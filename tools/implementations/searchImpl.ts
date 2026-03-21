import fs from "fs/promises";
import path from "node:path";
import { Dirent } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { JobContext } from "../../job/jobContext.js";
import { logger } from "../../utils/logger.js";

const execFileAsync = promisify(execFile);

type SearchResult = {
  file: string;
  line: number;
  snippet: string;
};

const DEFAULT_IGNORES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".cache",
]);

const isIgnored = (filePath: string) => {
  return filePath
    .split(path.sep)
    .some((segment) => DEFAULT_IGNORES.has(segment));
};

export const parseRgOutput = (
  stdout: string,
  maxResults: number
): SearchResult[] => {
  const results: SearchResult[] = [];

  let currentFile = "";

  let pendingBefore: { line: number; text: string }[] = [];
  let activeMatch: {
    line: number;
    lines: { line: number; text: string }[];
  } | null = null;

  for (const rawLine of stdout.split("\n")) {
    if (!rawLine.trim()) continue;

    let parsed: any;
    try {
      parsed = JSON.parse(rawLine);
    } catch {
      continue;
    }

    if (parsed.type === "begin") {
      currentFile = parsed.data.path.text;
      pendingBefore = [];
      activeMatch = null;
    }

    if (parsed.type === "context") {
      const ctxLine = {
        line: parsed.data.line_number,
        text: parsed.data.lines.text.replace(/\n$/, ""),
      };

      if (activeMatch) {
        // AFTER match → attach to current match
        activeMatch.lines.push(ctxLine);
      } else {
        // BEFORE match → buffer
        pendingBefore.push(ctxLine);

        // keep only last few lines (avoid overflow)
        if (pendingBefore.length > 5) {
          pendingBefore.shift();
        }
      }
    }

    if (parsed.type === "match") {
      // flush previous match if exists
      if (activeMatch) {
        results.push({
          file: currentFile,
          line: activeMatch.line,
          snippet: activeMatch.lines
            .map((l) => `${l.line}: ${l.text}`)
            .join("\n"),
        });

        if (results.length >= maxResults) break;
      }

      const matchLine = parsed.data.line_number;

      activeMatch = {
        line: matchLine,
        lines: [
          ...pendingBefore,
          {
            line: matchLine,
            text: parsed.data.lines.text.replace(/\n$/, ""),
          },
        ],
      };

      pendingBefore = []; // reset after consuming
    }

    if (parsed.type === "end") {
      // flush last match in file
      if (activeMatch) {
        results.push({
          file: currentFile,
          line: activeMatch.line,
          snippet: activeMatch.lines
            .map((l) => `${l.line}: ${l.text}`)
            .join("\n"),
        });

        activeMatch = null;

        if (results.length >= maxResults) break;
      }

      pendingBefore = [];
    }
  }

  return results;
};
const manualSearch = async (
  ctx: JobContext,
  query: string,
  maxResults: number
): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];
  const queue: string[] = [ctx.workspace];

  while (queue.length > 0 && results.length < maxResults) {
    const current = queue.pop()!;
    if (isIgnored(current)) continue;

    let entries: Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) break;
      const fullPath = path.join(current, entry.name);
      if (isIgnored(fullPath)) continue;
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(ts|tsx|js|jsx|json|md|yml|yaml)$/.test(entry.name)) continue;

      let content: string;
      try {
        content = await fs.readFile(fullPath, "utf-8");
      } catch {
        continue;
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length && results.length < maxResults; i++) {
        if (lines[i].includes(query)) {
          results.push({
            file: fullPath,
            line: i + 1,
            snippet: lines[i].trim(),
          });
        }
      }
    }
  }

  return results;
};

export const searchImpl = async (
  ctx: JobContext,
  query: string,
  maxResults = 20
): Promise<SearchResult[]> => {
  try {
    const { stdout } = await execFileAsync(
      "rg",
      [
        "--json",
        "-i", // case-insensitive search
        "--max-count",
        maxResults.toString(),
        "-C",
        "2", // 2 lines of context
        // file filters
        "-g",
        "*.ts",
        "-g",
        "*.tsx",
        "-g",
        "*.js",
        "-g",
        "*.jsx",
        "-g",
        "*.json",
        "-g",
        "*.md",
        "-g",
        "*.yml",
        "-g",
        "*.yaml",
        // ignore directories
        "-g",
        "!node_modules/**",
        "-g",
        "!.git/**",
        "-g",
        "!dist/**",
        "-g",
        "!build/**",
        "-g",
        "!.next/**",
        "-g",
        "!.cache/**",

        "--",
        query,
        ctx.workspace,
      ],
      {
        maxBuffer: 20 * 1024 * 1024, // bumped to 20MB for safety
      }
    );

    return parseRgOutput(stdout, maxResults);
  } catch (error: any) {
    if (error.code === 1 && !error.killed && !error.signal) {
      if (error.stdout) {
        return parseRgOutput(error.stdout, maxResults);
      }
      return [];
    }

    logger.warn("rg search failed, falling back to manual search", {
      err: error?.message ?? error,
    });
    return manualSearch(ctx, query, maxResults);
  }
};

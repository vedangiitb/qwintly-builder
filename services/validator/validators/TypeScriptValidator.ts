import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { JobContext } from "../../../job/jobContext.js";
import { PreflightErrorList } from "../../../types/preflightError.js";

export const TypeScriptValidator = async (
  ctx: JobContext
): Promise<PreflightErrorList> => {
  const tsconfigPath = path.join(ctx.workspace, "tsconfig.json");

  if (!fs.existsSync(tsconfigPath)) {
    return [
      {
        type: "typescript",
        filePath: "tsconfig.json",
        message: "tsconfig.json not found",
      },
    ];
  }

  return new Promise((resolve, reject) => {
    let output = "";

    const tsc = spawn(
      "tsc",
      ["--noEmit", "--pretty", "false", "--project", tsconfigPath],
      {
        cwd: ctx.workspace,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    tsc.stdout.on("data", (d) => {
      output += d.toString();
    });

    tsc.stderr.on("data", (d) => {
      output += d.toString();
    });

    tsc.on("error", reject);

    tsc.on("close", (code) => {
      if (code === 0) {
        resolve([]);
      } else {
        resolve(parseTsErrors(output));
      }
    });
  });
};

const IGNORED_TS_CODES = new Set([
  "TS2307",
  "TS2875",
  "TS7026",
  "TS2503",
  "TS2688",
  "TS7016",
]);

function parseTsErrors(output: string): PreflightErrorList {
  const errors: PreflightErrorList = [];

  const lines = output.split("\n").filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^(.*)\((\d+),(\d+)\): error (TS\d+): (.*)$/);

    if (!match) continue;

    const [, filePath, , , code, message] = match;

    if (IGNORED_TS_CODES.has(code)) {
      continue; // ignore dependency noise
    }

    errors.push({
      type: "typescript",
      filePath: filePath.trim(),
      message: `${code}: ${message.trim()}`,
    });
  }

  return errors;
}

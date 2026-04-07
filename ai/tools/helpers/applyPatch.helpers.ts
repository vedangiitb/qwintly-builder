import path from "node:path";

export type ApplyPatchOperation =
  | {
      kind: "update";
      filePath: string;
      hunks: PatchHunk[];
    };

type PatchLine =
  | { kind: "context"; text: string }
  | { kind: "add"; text: string }
  | { kind: "delete"; text: string };

export type PatchHunk = {
  label?: string;
  anchorEOF?: boolean;
  lines: PatchLine[];
};

const normalizeNewlines = (value: string) => value.replace(/\r\n/g, "\n");

export function parseApplyPatch(patchString: string): ApplyPatchOperation[] {
  const normalized = normalizeNewlines(patchString ?? "");
  const rawLines = normalized.split("\n");

  if (rawLines.length < 2 || rawLines[0].trim() !== "*** Begin Patch") {
    throw new Error('Invalid patch: missing "*** Begin Patch" header.');
  }

  let endIndex = -1;
  for (let idx = rawLines.length - 1; idx >= 0; idx -= 1) {
    if (rawLines[idx].trim() === "*** End Patch") {
      endIndex = idx;
      break;
    }
  }
  if (endIndex === -1) {
    throw new Error('Invalid patch: missing "*** End Patch" footer.');
  }

  const lines = rawLines.slice(1, endIndex);
  const operations: ApplyPatchOperation[] = [];

  const isOpHeader = (line: string) =>
    line.startsWith("*** Add File:") ||
    line.startsWith("*** Update File:") ||
    line.startsWith("*** Delete File:");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (!isOpHeader(line)) {
      throw new Error(`Invalid patch: expected file header at line ${i + 2}.`);
    }

    if (line.startsWith("*** Add File:")) {
      throw new Error(
        `Invalid patch: Add File operations are not allowed (use create_file tool instead).`,
      );
    }

    if (line.startsWith("*** Delete File:")) {
      throw new Error(
        `Invalid patch: Delete File operations are not allowed (use delete_file tool instead).`,
      );
    }

    if (line.startsWith("*** Update File:")) {
      const filePath = line.slice("*** Update File:".length).trim();
      if (!filePath) throw new Error(`Invalid patch: empty Update File path.`);
      i += 1;

      if (i < lines.length && lines[i].startsWith("*** Move to:")) {
        throw new Error(
          `Invalid patch: Move operations are not allowed in apply_patch.`,
        );
      }

      const hunks: PatchHunk[] = [];
      let currentHunk: PatchHunk | null = null;

      const pushHunk = () => {
        if (!currentHunk) return;
        if (currentHunk.lines.length === 0 && !currentHunk.anchorEOF) return;
        hunks.push(currentHunk);
      };

      while (i < lines.length && !isOpHeader(lines[i])) {
        const current = lines[i];
        if (!currentHunk) currentHunk = { lines: [] };

        if (current === "*** End of File") {
          currentHunk.anchorEOF = true;
          i += 1;
          continue;
        }

        if (current.startsWith("@@")) {
          pushHunk();
          const label = current.slice(2).trim();
          currentHunk = { label: label || undefined, lines: [] };
          i += 1;
          continue;
        }

        if (!current) {
          // Treat empty line as context line.
          currentHunk.lines.push({ kind: "context", text: "" });
          i += 1;
          continue;
        }

        const prefix = current[0];
        const text = current.slice(1);
        if (prefix === " ") {
          currentHunk.lines.push({ kind: "context", text });
        } else if (prefix === "+") {
          currentHunk.lines.push({ kind: "add", text });
        } else if (prefix === "-") {
          currentHunk.lines.push({ kind: "delete", text });
        } else {
          throw new Error(
            `Invalid patch line (expected ' ', '+', '-' or '@@'): "${current}"`,
          );
        }
        i += 1;
      }

      pushHunk();

      operations.push({ kind: "update", filePath, hunks });
      continue;
    }
  }

  return operations;
}

const findSubsequence = (
  haystack: string[],
  needle: string[],
  startAt: number,
  requireEnd: boolean,
): number => {
  if (needle.length === 0) {
    return requireEnd ? haystack.length : Math.min(startAt, haystack.length);
  }

  const lastStart = haystack.length - needle.length;
  for (let i = Math.max(0, startAt); i <= lastStart; i += 1) {
    let ok = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (requireEnd && i + needle.length !== haystack.length) continue;
    return i;
  }

  return -1;
};

export function applyHunksToContent(
  content: string,
  hunks: PatchHunk[],
): { content: string; changed: boolean } {
  const normalized = normalizeNewlines(content);
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const endsWithNewline = normalized.endsWith("\n");
  const fileLines = normalized.split("\n");

  let cursor = 0;
  let changed = false;

  for (const hunk of hunks) {
    const expected = hunk.lines
      .filter((l) => l.kind === "context" || l.kind === "delete")
      .map((l) => l.text);

    const requireEnd = Boolean(hunk.anchorEOF);
    const pos = requireEnd
      ? findSubsequence(fileLines, expected, 0, true)
      : findSubsequence(fileLines, expected, cursor, false);

    if (pos === -1) {
      const preview = expected.slice(0, 3).join("\\n");
      throw new Error(
        `Patch hunk failed to apply${
          hunk.label ? ` (${hunk.label})` : ""
        }: context not found. Expected (first lines): ${preview}`,
      );
    }

    let idx = pos;
    for (const line of hunk.lines) {
      if (line.kind === "context") {
        if (fileLines[idx] !== line.text) {
          throw new Error(
            `Patch context mismatch at line ${idx + 1}: expected "${line.text}"`,
          );
        }
        idx += 1;
        continue;
      }

      if (line.kind === "delete") {
        if (fileLines[idx] !== line.text) {
          throw new Error(
            `Patch delete mismatch at line ${idx + 1}: expected "${line.text}"`,
          );
        }
        fileLines.splice(idx, 1);
        changed = true;
        continue;
      }

      if (line.kind === "add") {
        fileLines.splice(idx, 0, line.text);
        idx += 1;
        changed = true;
      }
    }

    cursor = idx;
  }

  let next = fileLines.join("\n");
  if (endsWithNewline && !next.endsWith("\n")) next += "\n";
  next = next.replace(/\n/g, newline);

  return { content: next, changed };
}

export function isTextFilePath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  // Patch tool is meant for source/text files; still allow unknown.
  return ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg" && ext !== ".gif";
}

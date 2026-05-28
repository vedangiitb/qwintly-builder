const FILE_HEADER_RE =
  /^\*\*\*\s+(Add File|Update File|Delete File|Move to):\s+(.+)\s*$/gm;

function normalizeEditedPath(p: string): string {
  const trimmed = p.trim().split("\\").join("/");
  if (trimmed.startsWith("./")) return trimmed.slice(2);
  return trimmed;
}

export function extractTouchedFilesFromPatch(patch: string): string[] {
  const touched: string[] = [];
  if (typeof patch !== "string" || patch.trim().length === 0) return touched;

  for (const match of patch.matchAll(FILE_HEADER_RE)) {
    const rawPath = match[2];
    if (!rawPath) continue;
    touched.push(normalizeEditedPath(rawPath));
  }

  return touched;
}

export function normalizeEditedFilePath(p: string): string {
  return normalizeEditedPath(p);
}


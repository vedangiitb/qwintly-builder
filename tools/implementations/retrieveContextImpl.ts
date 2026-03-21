import { CodeIndex } from "../../types/index/codeIndex.js";

type RetrievedChunk = {
  file: string;
  text: string;
  score: number;
};

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .filter(Boolean);

const scoreText = (queryTokens: string[], text: string) => {
  const hay = text.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (!token) continue;
    if (hay.includes(token)) score += 1;
  }
  return score;
};

export const retrieveContextImpl = async (
  codeIndex: CodeIndex,
  query: string,
  maxChunks = 6
): Promise<RetrievedChunk[]> => {
  const projectIndex = codeIndex.projectIndex;
  if (!projectIndex) return [];

  const tokens = tokenize(query);
  const fileEntries = projectIndex.folderTree.filter((entry) => !entry.isDir);
  const scored = fileEntries.map((entry) => {
    const text = buildEntryText(entry);
    return {
      file: entry.path,
      text,
      score: scoreText(tokens, text || entry.path),
    };
  });

  const topChunks = scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);
  if (topChunks.length > 0) return topChunks;

  const pathFallback = fileEntries.map((entry) => ({
    file: entry.path,
    text: entry.path,
    score: scoreText(tokens, entry.path),
  }));

  return pathFallback
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);
};

const buildEntryText = (
  entry: CodeIndex["projectIndex"]["folderTree"][number]
): string => {
  const parts: string[] = [];
  if (entry.summary) parts.push(entry.summary);
  if (entry.route) parts.push(`Route: ${entry.route}`);
  if (entry.exports?.length)
    parts.push(`Exports: ${entry.exports.slice(0, 6).join(", ")}`);
  if (entry.dependencies?.length)
    parts.push(`Deps: ${entry.dependencies.slice(0, 6).join(", ")}`);
  if (entry.tags?.length) parts.push(`Tags: ${entry.tags.join(", ")}`);
  return parts.join(" | ");
};

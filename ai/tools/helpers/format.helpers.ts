export const sliceByLines = (
  content: string,
  startLine?: number,
  endLine?: number,
) => {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  const start =
    startLine === undefined || startLine === null
      ? 0
      : startLine <= 1
        ? 0
        : startLine - 1;

  const endExclusive =
    endLine === undefined || endLine === null || endLine === -1
      ? lines.length
      : Math.max(start, endLine);

  return lines.slice(start, endExclusive).join("\n");
};

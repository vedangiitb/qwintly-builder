import path from "node:path";

const normalizeForPrefixCheck = (value: string) =>
  value.replace(/\\/g, "/").replace(/\/+$/g, "");

const stripKnownWorkspacePrefix = (
  inputPath: string,
  workspaceRoot: string,
) => {
  const inputNormalized = normalizeForPrefixCheck(inputPath);
  const workspaceNormalized = normalizeForPrefixCheck(workspaceRoot);

  if (
    inputNormalized === workspaceNormalized ||
    inputNormalized.startsWith(`${workspaceNormalized}/`)
  ) {
    return inputNormalized.slice(workspaceNormalized.length);
  }

  // Common production path prefix (see tools.md).
  const hardcodedWorkspace = "/tmp/workspace";
  if (
    inputNormalized === hardcodedWorkspace ||
    inputNormalized.startsWith(`${hardcodedWorkspace}/`)
  ) {
    return inputNormalized.slice(hardcodedWorkspace.length);
  }

  // Common variant without leading slash.
  const hardcodedWorkspaceNoSlash = "tmp/workspace";
  if (
    inputNormalized === hardcodedWorkspaceNoSlash ||
    inputNormalized.startsWith(`${hardcodedWorkspaceNoSlash}/`)
  ) {
    return inputNormalized.slice(hardcodedWorkspaceNoSlash.length);
  }

  return null;
};

export const toWorkspacePath = (workspacePath: string, inputPath: string) => {
  const stripped = stripKnownWorkspacePrefix(inputPath, workspacePath);
  const isAbsoluteInput = path.isAbsolute(inputPath);

  if (stripped === null && isAbsoluteInput) {
    throw new Error(
      `Path "${inputPath}" is absolute but not within workspace "${workspacePath}".`,
    );
  }

  const relativePath = (stripped ?? inputPath).replace(/^[\/\\]+/, "");
  const workspaceRoot = path.resolve(workspacePath);
  const resolved = path.resolve(workspaceRoot, relativePath);
  const rel = path.relative(workspaceRoot, resolved);

  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path "${inputPath}" resolves outside the workspace root.`);
  }

  return resolved;
};

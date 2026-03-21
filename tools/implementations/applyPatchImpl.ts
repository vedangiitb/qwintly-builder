import path from "path";
import { applyPatch } from "diff";
import {
  createFolder,
  removeFile,
  removeFolder,
} from "../../infra/fs/workspace.js";
import { JobContext } from "../../job/jobContext.js";
import { readFileImpl } from "./readFileImpl.js";
import { writeCode } from "./writeCodeImpl.js";

type ApplyPatchOperation =
  | "patch"
  | "write"
  | "delete_file"
  | "delete_dir"
  | "mkdir";

type ApplyPatchArgs = {
  path: string;
  patch?: string;
  code?: string;
  description?: string;
  operation?: ApplyPatchOperation;
};

const toWorkspacePath = (ctx: JobContext, inputPath: string) => {
  let normalizedPath = inputPath;
  if (normalizedPath.startsWith("/tmp/workspace")) {
    normalizedPath = normalizedPath.slice("/tmp/workspace".length);
  } else if (normalizedPath.startsWith("tmp/workspace")) {
    normalizedPath = normalizedPath.slice("tmp/workspace".length);
  }
  normalizedPath = normalizedPath.replace(/^[\/\\]+/, "");
  return path.join(ctx.workspace, normalizedPath);
};

const resolveOperation = (args: ApplyPatchArgs): ApplyPatchOperation => {
  if (args.operation) return args.operation;
  if (args.patch && args.code) {
    throw new Error("apply_patch: provide either patch or code, not both");
  }
  if (args.patch) return "patch";
  if (args.code) return "write";
  throw new Error("apply_patch: missing patch or code");
};

export const applyPatchImpl = async (ctx: JobContext, args: ApplyPatchArgs) => {
  const operation = resolveOperation(args);

  if (operation === "delete_file") {
    const fullPath = toWorkspacePath(ctx, args.path);
    await removeFile(fullPath);
    return;
  }

  if (operation === "delete_dir") {
    const fullPath = toWorkspacePath(ctx, args.path);
    await removeFolder(fullPath);
    return;
  }

  if (operation === "mkdir") {
    const fullPath = toWorkspacePath(ctx, args.path);
    await createFolder(fullPath);
    return;
  }

  if (operation === "write") {
    if (typeof args.code !== "string") {
      throw new Error("apply_patch: code is required for write operation");
    }
    const desc = args.description ?? "Wrote file";
    await writeCode(ctx, args.path, args.code, desc);
    return;
  }

  if (!args.patch) {
    throw new Error("apply_patch: patch is required for patch operation");
  }

  const content = await readFileImpl(ctx, args.path);
  const fileContent = content ?? "";

  let patched: string | boolean = applyPatch(fileContent, args.patch);

  if (patched === false) {
    const normalizedContent = fileContent.replace(/\r\n/g, "\n");
    const normalizedPatch = args.patch.replace(/\r\n/g, "\n");
    patched = applyPatch(normalizedContent, normalizedPatch);

    if (patched === false && !normalizedPatch.endsWith("\n")) {
      patched = applyPatch(normalizedContent, normalizedPatch + "\n");
    }

    if (patched === false) {
      patched = applyPatch(normalizedContent, normalizedPatch, { fuzzFactor: 2 });
    }
  }

  if (patched === false) {
    throw new Error(`Failed to apply patch to ${args.path}`);
  }

  const desc = args.description ?? "Applied patch";
  await writeCode(ctx, args.path, patched, desc);
};

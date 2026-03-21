import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { JobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";

// Tool Implementations
import { applyPatchImpl } from "../implementations/applyPatchImpl.js";
import { getProjectInfoImpl } from "../implementations/getProjectInfoImpl.js";
import { listDirImpl } from "../implementations/listDirImpl.js";
import { readFileImpl } from "../implementations/readFileImpl.js";
import { retrieveContextImpl } from "../implementations/retrieveContextImpl.js";
import { searchImpl } from "../implementations/searchImpl.js";
import { updatePackageJsonImpl } from "../implementations/updatePackageJsonImpl.js";
import { validateImpl } from "../implementations/validateImpl.js";

type ToolHooks = {
  onWrite?: (path: string) => void;
  onValidate?: (result: { ok?: boolean; reason?: string }) => void;
  onPackageUpdate?: (path: string) => void;
  onToolCall?: (name: string, input: unknown) => void;
  onToolResult?: (name: string, output: unknown) => void;
};

export const getFileTools = (ctx: JobContext, hooks?: ToolHooks) => [
  new DynamicStructuredTool({
    name: "read_file",
    description: "Read the contents of a file from the workspace",
    schema: z.object({ path: z.string() }),
    func: async ({ path }: { path: string }) => {
      hooks?.onToolCall?.("read_file", { path });
      const result = { path, content: await readFileImpl(ctx, path) };
      hooks?.onToolResult?.("read_file", result);
      return JSON.stringify(result);
    },
  }),
  new DynamicStructuredTool({
    name: "apply_patch",
    description:
      "Apply a patch or perform file/folder operations (write/delete/mkdir)",
    schema: z.object({
      path: z.string(),
      patch: z.string().optional(),
      code: z.string().optional(),
      description: z.string().optional(),
      operation: z
        .enum(["patch", "write", "delete_file", "delete_dir", "mkdir"])
        .optional(),
    }),
    func: async (args: {
      path: string;
      patch?: string;
      code?: string;
      description?: string;
      operation?: "patch" | "write" | "delete_file" | "delete_dir" | "mkdir";
    }) => {
      hooks?.onToolCall?.("apply_patch", args);
      await applyPatchImpl(ctx, args);
      if (args.operation === "write" || args.operation === "patch") {
        hooks?.onWrite?.(args.path);
      }
      const result = { ok: true, path: args.path };
      hooks?.onToolResult?.("apply_patch", result);
      return JSON.stringify(result);
    },
  }),
  new DynamicStructuredTool({
    name: "ls",
    description: "List files in a directory with metadata",
    schema: z.object({ path: z.string() }),
    func: async ({ path }: { path: string }) => {
      hooks?.onToolCall?.("ls", { path });
      const result = { entries: await listDirImpl(ctx, path) };
      hooks?.onToolResult?.("ls", result);
      return JSON.stringify(result);
    },
  }),
];

export const getContextAndSearchTools = (
  ctx: JobContext,
  codeIndex: CodeIndex,
  hooks?: ToolHooks,
) => [
  new DynamicStructuredTool({
    name: "search",
    description:
      "Search for a text query in the codebase (rg-first, context fallback)",
    schema: z.object({
      query: z.string(),
      maxResults: z.number().int().positive().optional(),
      maxChunks: z.number().int().positive().optional(),
      includeContext: z.boolean().optional(),
    }),
    func: async ({
      query,
      maxResults,
      maxChunks,
      includeContext,
    }: {
      query: string;
      maxResults?: number;
      maxChunks?: number;
      includeContext?: boolean;
    }) => {
      hooks?.onToolCall?.("search", {
        query,
        maxResults,
        maxChunks,
        includeContext,
      });
      const results = await searchImpl(ctx, query, maxResults ?? 25);
      const shouldIncludeContext = includeContext ?? results.length === 0;
      const chunks = shouldIncludeContext
        ? await retrieveContextImpl(codeIndex, query, maxChunks ?? 6)
        : [];
      const payload = { results, chunks };
      hooks?.onToolResult?.("search", payload);
      return JSON.stringify(payload);
    },
  }),
  new DynamicStructuredTool({
    name: "validate",
    description: "Run preflight validation for the project",
    schema: z.object({}),
    func: async (_args: Record<string, any>) => {
      hooks?.onToolCall?.("validate", {});
      const result = await validateImpl(ctx, codeIndex);
      hooks?.onValidate?.(result ?? {});
      hooks?.onToolResult?.("validate", result);
      return JSON.stringify(result);
    },
  }),
];

export const getProjectInfoAndNpmTools = (
  ctx: JobContext,
  hooks?: ToolHooks,
) => [
  new DynamicStructuredTool({
    name: "get_project_info",
    description: "Get project information like package.json and tsconfig.json",
    schema: z.object({}),
    func: async (_args: Record<string, any>) => {
      hooks?.onToolCall?.("get_project_info", {});
      const result = await getProjectInfoImpl(ctx);
      hooks?.onToolResult?.("get_project_info", result);
      return JSON.stringify(result);
    },
  }),
  new DynamicStructuredTool({
    name: "update_package_json",
    description: "Update fields in package.json",
    schema: z.object({ updates: z.record(z.string(), z.any()) }),
    func: async ({ updates }: { updates: Record<string, any> }) => {
      hooks?.onToolCall?.("update_package_json", { updates });
      const result = await updatePackageJsonImpl(ctx, updates);
      hooks?.onPackageUpdate?.("package.json");
      hooks?.onToolResult?.("update_package_json", result);
      return JSON.stringify(result);
    },
  }),
];

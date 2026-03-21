import { createPatch } from "diff";
import { JobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { PlanTask } from "../../types/updatePlan.types.js";
import { CollectedContext } from "../../types/context.types.js";
import {
  getContextAndSearchTools,
  getFileTools,
  getProjectInfoAndNpmTools,
} from "../../tools/toolsets/deepAgentTools.js";
import { createToolHistory, ToolHistoryEntry } from "./deepAgent/toolHistory.js";

type RunState = {
  changedFiles: Set<string>;
  lastValidation?: { ok: boolean; reason?: string };
  toolHistory: ToolHistoryEntry[];
  finalResponse?: string;
};

type ToolMap = Map<string, { invoke: (input: any) => Promise<any> }>;

const parseToolOutput = (output: unknown) => {
  if (typeof output === "string") {
    try {
      return JSON.parse(output);
    } catch {
      return output;
    }
  }
  return output;
};

const getTool = (tools: ToolMap, name: string) => {
  const tool = tools.get(name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
};

export const toolOnlyService = async (
  ctx: JobContext,
  _collectedContext: CollectedContext,
  _planTasks: PlanTask[],
  codeIndex: CodeIndex,
) => {
  if (!codeIndex) throw new Error("Failed to load code index.");

  const state: RunState = {
    changedFiles: new Set<string>(),
    toolHistory: [],
  };

  const toolHistory = createToolHistory({
    maxEntries: 50,
    maxPayloadChars: 4000,
  });
  state.toolHistory = toolHistory.history;

  const hooks = {
    onWrite: (path: string) => state.changedFiles.add(path),
    onPackageUpdate: (path: string) => state.changedFiles.add(path),
    onValidate: (result: { ok?: boolean; reason?: string }) => {
      state.lastValidation = { ok: !!result?.ok, reason: result?.reason };
    },
    onToolCall: (name: string, input: unknown) => toolHistory.logTool("call", name, input),
    onToolResult: (name: string, output: unknown) =>
      toolHistory.logTool("result", name, output),
  };

  const toolList = [
    ...getFileTools(ctx, hooks),
    ...getContextAndSearchTools(ctx, codeIndex, hooks),
    ...getProjectInfoAndNpmTools(ctx, hooks),
  ];

  const toolMap: ToolMap = new Map(
    toolList.map((tool) => [tool.name, tool])
  );

  const callTool = async (name: string, input: any) => {
    const tool = getTool(toolMap, name);
    const output = await tool.invoke(input);
    return parseToolOutput(output);
  };

  const scratchDir = "tool-test";
  const markerFile = `${scratchDir}/marker.txt`;
  const marker = `TOOL_ONLY_MARKER_${Date.now()}`;

  await callTool("apply_patch", { path: scratchDir, operation: "mkdir" });

  await callTool("apply_patch", {
    path: markerFile,
    operation: "write",
    code: marker,
    description: "Tool-only write",
  });

  const readResult = await callTool("read_file", { path: markerFile });
  const originalContent = (readResult as any)?.content ?? "";
  const updatedContent = originalContent.replace(marker, `${marker}_UPDATED`);
  const patch = createPatch(markerFile, originalContent, updatedContent);

  await callTool("apply_patch", {
    path: markerFile,
    patch,
    description: "Tool-only patch",
  });

  await callTool("ls", { path: scratchDir });

  await callTool("search", {
    query: marker,
    maxResults: 5,
    includeContext: true,
  });

  await callTool("get_project_info", {});

  await callTool("update_package_json", { updates: { scripts: {} } });

  const previousSkip = process.env.SKIP_VALIDATOR_AGENT;
  process.env.SKIP_VALIDATOR_AGENT = "1";
  try {
    await callTool("validate", {});
  } finally {
    if (previousSkip === undefined) {
      delete process.env.SKIP_VALIDATOR_AGENT;
    } else {
      process.env.SKIP_VALIDATOR_AGENT = previousSkip;
    }
  }

  if (!state.lastValidation) {
    state.lastValidation = {
      ok: false,
      reason: "validate was not called",
    };
  }

  return {
    ok: !!state.lastValidation?.ok,
    attempts: 1,
    validation: state.lastValidation,
    changedFiles: Array.from(state.changedFiles),
    toolHistory: state.toolHistory,
    response: state.finalResponse,
  };
};

import { FunctionCallingConfigMode, Tool } from "@google/genai";
import { aiResponse } from "../../infra/ai/gemini.client.js";
import { logger } from "../logger/logger.service.js";
import {
  compactForModel,
  DEFAULT_CONTEXT_POLICY,
  getApplyPatchEventMeta,
  normalizeReadFileArgs,
  redactFunctionCallArgs,
  ToolEvent,
  ToolLoopContextPolicy,
} from "./helpers/toolLoopContext.helpers.js";

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export type ToolLoopResult = {
  contents: any[]; // full trace (unredacted) unless keepFullTrace=false
  modelContents: any[]; // what was actually sent to the model (compacted/redacted)
  finalText: string;
  steps: number;
  terminalCall?: {
    name: string;
    args: Record<string, unknown>;
    response: unknown;
  };
};

type AiCallFn = (
  request: unknown,
  options: {
    tools?: Tool[];
    model?: string;
    toolCallingMode?: FunctionCallingConfigMode;
  },
) => Promise<{ functionCalls?: any[]; text?: string }>;

export type RunToolLoopOptions = {
  initialContents: any[];
  tools: Tool[];
  handlers: Record<string, ToolHandler>;
  maxSteps?: number;
  model?: string;
  toolCallingMode?: FunctionCallingConfigMode;
  terminalToolNames?: string[];
  keepFullTrace?: boolean;
  contextPolicy?: ToolLoopContextPolicy;
  aiCall?: AiCallFn;
};

export async function runToolLoop(
  options: RunToolLoopOptions,
): Promise<ToolLoopResult> {
  const {
    initialContents,
    tools,
    handlers,
    maxSteps = 30,
    model,
    toolCallingMode = FunctionCallingConfigMode.ANY,
    terminalToolNames = [],
    keepFullTrace = true,
    contextPolicy,
    aiCall = aiResponse as unknown as AiCallFn,
  } = options;

  const policy: Required<ToolLoopContextPolicy> = {
    ...DEFAULT_CONTEXT_POLICY,
    ...(contextPolicy ?? {}),
  };

  const toolEvents: ToolEvent[] = [];

  const fullTraceContents: any[] = keepFullTrace ? [...initialContents] : [];
  let modelContents: any[] = [...initialContents];
  const pushBoth = (fullItem: any, modelItem: any) => {
    if (keepFullTrace) fullTraceContents.push(fullItem);
    modelContents.push(modelItem);
  };
  const pushModelOnly = (modelItem: any) => {
    modelContents.push(modelItem);
  };

  for (let step = 0; step < maxSteps; step++) {
    modelContents = compactForModel({
      initialCount: initialContents.length,
      modelContents,
      toolEvents,
      policy,
    });

    if (policy.logApproxModelChars) {
      const approxChars = JSON.stringify(modelContents).length;
      logger.info(`Tool loop: approx model chars=${approxChars} step=${step + 1}`);
    }

    const response = await aiCall(modelContents, {
      tools,
      model,
      toolCallingMode,
    });

    const functionCalls = response.functionCalls ?? [];
    if (functionCalls.length === 0) {
      return {
        contents: keepFullTrace ? fullTraceContents : modelContents,
        modelContents,
        finalText: (response.text ?? "").trim(),
        steps: step + 1,
      };
    }

    for (const call of functionCalls) {
      const name = call.name?.toString() ?? "";
      const args = (call.args ?? {}) as Record<string, unknown>;
      console.log("Function Call",name)
      console.log("Function Args",args)

      if (!name) {
        throw new Error("Tool loop: function call missing name.");
      }

      const handler = handlers[name];
      if (!handler) {
        throw new Error(`Tool loop: no handler registered for "${name}".`);
      }

      let effectiveArgs: Record<string, unknown> = args;
      let readFileMeta: { start: number; end: number; wasCapped: boolean } | null = null;
      if (name === "read_file") {
        const normalized = normalizeReadFileArgs(
          effectiveArgs,
          policy.readFileDefaultMaxLines,
        );
        effectiveArgs = normalized.effectiveArgs;
        readFileMeta = {
          start: normalized.start,
          end: normalized.end,
          wasCapped: normalized.wasCapped,
        };
      }

      const modelArgs = redactFunctionCallArgs(name, effectiveArgs);

      const assistantFull = {
        role: "model",
        parts: [
          {
            functionCall: {
              name,
              args: effectiveArgs,
            },
          },
        ],
      };

      const assistantModel = {
        role: "model",
        parts: [
          {
            functionCall: {
              name,
              args: modelArgs,
            },
          },
        ],
      };

      if (keepFullTrace) {
        pushBoth(assistantFull, assistantModel);
      } else {
        pushModelOnly(assistantModel);
      }

      const toolResultRaw = await handler(effectiveArgs);
      let toolResult: unknown = toolResultRaw;

      if (name === "read_file" && readFileMeta) {
        const path = String(effectiveArgs.path ?? "");
        const rawContent =
          typeof (toolResultRaw as any)?.content === "string"
            ? String((toolResultRaw as any).content)
            : typeof toolResultRaw === "string"
              ? toolResultRaw
              : JSON.stringify(toolResultRaw ?? null);

        toolResult = {
          path,
          start_line: readFileMeta.start,
          end_line: readFileMeta.end,
          truncated: readFileMeta.wasCapped,
          content: rawContent,
          note: readFileMeta.wasCapped
            ? `Capped to ${policy.readFileDefaultMaxLines} lines. Request more with start_line/end_line.`
            : undefined,
        };
      }

      const responseFull = {
        role: "user",
        parts: [
          {
            functionResponse: {
              name,
              response: toolResult,
            },
          },
        ],
      };

      if (keepFullTrace) {
        fullTraceContents.push(responseFull);
      }
      modelContents.push(responseFull);

      // Deterministic event summaries for compact "memory".
      try {
        if (name === "read_file") {
          const path = String(effectiveArgs.path ?? "");
          const start = readFileMeta?.start ?? Number(effectiveArgs.start_line ?? 1);
          const end = readFileMeta?.end ?? Number(effectiveArgs.end_line ?? start);
          toolEvents.push({
            name,
            summary: `read_file ${path}:${start}-${end}${readFileMeta?.wasCapped ? " (capped)" : ""}`,
          });
        } else if (name === "apply_patch") {
          const meta = typeof (modelArgs as any).patch_string === "object" ? (modelArgs as any).patch_string : null;
          const fallback = getApplyPatchEventMeta(effectiveArgs);
          const ok = (toolResult as any)?.success === true ? "success" : (toolResult as any)?.success === false ? "failure" : "done";
          toolEvents.push({
            name,
            summary: `apply_patch files=${JSON.stringify(meta?.files ?? fallback.files)} sha256=${String(meta?.sha256 ?? fallback.sha256).slice(0, 12)} chars=${meta?.chars ?? fallback.chars} result=${ok}`,
          });
        } else if (name === "search") {
          const q = String(effectiveArgs.search_query ?? "").trim();
          const results = Array.isArray((toolResultRaw as any)?.results) ? (toolResultRaw as any).results : [];
          toolEvents.push({
            name,
            summary: `search "${q}" -> ${results.length} results`,
          });
        } else if (name === "list_dir") {
          const p = String(effectiveArgs.path ?? "");
          const d = Number(effectiveArgs.depth ?? 1);
          toolEvents.push({ name, summary: `list_dir ${p} depth=${d}` });
        } else if (name === "create_file") {
          const p = String(effectiveArgs.path ?? "");
          toolEvents.push({ name, summary: `create_file ${p}` });
        } else if (name === "delete_file") {
          const p = String(effectiveArgs.path ?? "");
          toolEvents.push({ name, summary: `delete_file ${p}` });
        } else {
          toolEvents.push({ name, summary: `${name} called` });
        }
      } catch {
        toolEvents.push({ name, summary: `${name} called` });
      }

      if (terminalToolNames.includes(name)) {
        return {
          contents: keepFullTrace ? fullTraceContents : modelContents,
          modelContents,
          finalText: "",
          steps: step + 1,
          terminalCall: { name, args: effectiveArgs, response: toolResultRaw },
        };
      }
    }
  }

  throw new Error(`Tool loop: max steps reached (${maxSteps}).`);
}

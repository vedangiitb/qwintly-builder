import { createDeepAgent } from "deepagents";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, isAIMessage } from "@langchain/core/messages";
import { GEMINI_API_KEY } from "../../config/env.js";
import { JobContext } from "../../job/jobContext.js";
import { deepAgentPrompt } from "../../prompts/deepAgentPrompt.js";
import {
  getFileTools,
  getContextAndSearchTools,
  getProjectInfoAndNpmTools,
} from "../../tools/toolsets/deepAgentTools.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { PlanTask } from "../../types/updatePlan.types.js";
import { CollectedContext } from "../../types/context.types.js";
import { logger } from "../../utils/logger.js";
import { buildBudgetedPromptInputs } from "./deepAgent/contextBudget.js";
import { getDeepAgentConfig, scalePromptBudgets } from "./deepAgent/config.js";
import { truncateSerialized } from "./deepAgent/serialization.js";
import { createToolHistory, ToolHistoryEntry } from "./deepAgent/toolHistory.js";
import { validateImpl } from "../../tools/implementations/validateImpl.js";

type RunState = {
  changedFiles: Set<string>;
  lastValidation?: { ok: boolean; reason?: string };
  toolHistory: ToolHistoryEntry[];
  finalResponse?: string;
};

type RunMetrics = {
  promptChars: number;
  toolCalls: number;
  readFiles: number;
  runtimeMs: number;
  modelUsed: string;
  fallbackUsed: boolean;
};

type RunConfig = {
  modelName: string;
  maxRecursion: number;
  maxToolCalls: number;
  maxReadFiles: number;
  maxRuntimeMs: number;
  maxOutputTokens: number;
  promptBudgets: Parameters<typeof buildBudgetedPromptInputs>[3];
};

type RunResult = {
  state: RunState;
  metrics: RunMetrics;
  error?: string;
  abortReason?: string;
  abortType?: "timeout" | "tool_limit" | "read_limit";
};

const runDeepAgentOnce = async (
  ctx: JobContext,
  collectedContext: CollectedContext,
  planTasks: PlanTask[],
  codeIndex: CodeIndex,
  runConfig: RunConfig,
  fallbackUsed: boolean,
): Promise<RunResult> => {
  const state: RunState = {
    changedFiles: new Set<string>(),
    toolHistory: [],
  };

  const toolHistory = createToolHistory({
    maxEntries: 30,
    maxPayloadChars: 4000,
  });
  state.toolHistory = toolHistory.history;

  let toolCalls = 0;
  let readFiles = 0;
  let abortReason: string | undefined;
  let abortType: RunResult["abortType"];

  const startTime = Date.now();

  const hooks = {
    onWrite: (path: string) => state.changedFiles.add(path),
    onPackageUpdate: (path: string) => state.changedFiles.add(path),
    onValidate: (result: { ok?: boolean; reason?: string }) => {
      state.lastValidation = { ok: !!result?.ok, reason: result?.reason };
    },
    onToolCall: (name: string, input: unknown) => {
      toolCalls += 1;
      if (name === "read_file") {
        readFiles += 1;
      }
      if (!abortReason && toolCalls > runConfig.maxToolCalls) {
        abortReason = `tool call limit exceeded (${runConfig.maxToolCalls})`;
        abortType = "tool_limit";
      }
      if (!abortReason && readFiles > runConfig.maxReadFiles) {
        abortReason = `read_file limit exceeded (${runConfig.maxReadFiles})`;
        abortType = "read_limit";
      }
      toolHistory.logTool("call", name, input);
    },
    onToolResult: (name: string, output: unknown) =>
      toolHistory.logTool("result", name, output),
  };

  const tools = [
    ...getFileTools(ctx, hooks),
    ...getContextAndSearchTools(ctx, codeIndex, hooks),
    ...getProjectInfoAndNpmTools(ctx, hooks),
  ];

  const budgetedPrompt = buildBudgetedPromptInputs(
    collectedContext,
    planTasks,
    codeIndex,
    runConfig.promptBudgets,
  );

  const instructions = deepAgentPrompt(
    budgetedPrompt.context,
    budgetedPrompt.planTasks,
    budgetedPrompt.codeIndex,
  );

  const model = new ChatGoogleGenerativeAI({
    model: runConfig.modelName,
    apiKey: GEMINI_API_KEY,
    temperature: 0.2,
    maxRetries: 3,
    maxOutputTokens: runConfig.maxOutputTokens,
  });

  const agent = createDeepAgent({
    model,
    tools,
    instructions,
    builtinTools: [],
  });

  let lastMessageCount = 0;
  let lastAIContent: string | undefined;
  let error: string | undefined;

  try {
    const stream = await agent.stream(
      { messages: [new HumanMessage("Begin the task and follow the instructions.")] },
      { streamMode: "updates", recursionLimit: runConfig.maxRecursion },
    );

    for await (const chunk of stream as AsyncIterable<any>) {
      if (!abortReason && Date.now() - startTime > runConfig.maxRuntimeMs) {
        abortReason = `runtime limit exceeded (${runConfig.maxRuntimeMs}ms)`;
        abortType = "timeout";
      }
      if (abortReason) break;

      const messages = chunk?.messages;
      if (!Array.isArray(messages)) continue;
      if (messages.length <= lastMessageCount) continue;
      const newMessages = messages.slice(lastMessageCount);
      lastMessageCount = messages.length;

      for (const msg of newMessages) {
        if (isAIMessage(msg)) {
          const content = msg.content;
          if (typeof content === "string") {
            lastAIContent = content;
            logger.debug("Deep agent assistant message", {
              event: "assistant_message",
              content: truncateSerialized(content, 1200),
            });
          } else if (content != null) {
            const serialized = JSON.stringify(content);
            lastAIContent = serialized;
            logger.debug("Deep agent assistant message", {
              event: "assistant_message",
              content: truncateSerialized(serialized, 1200),
            });
          }
        }
      }
    }
  } catch (err: any) {
    error = err?.message || String(err);
  }

  if (lastAIContent) {
    state.finalResponse = lastAIContent;
  }

  if (!error && !abortReason) {
    if (!state.lastValidation) {
      try {
        const result = await validateImpl(ctx, codeIndex);
        state.lastValidation = {
          ok: !!result?.ok,
          reason: result?.reason ?? (result?.ok ? undefined : "validation failed"),
        };
      } catch (err: any) {
        state.lastValidation = {
          ok: false,
          reason: `validate failed: ${err?.message || err}`,
        };
      }
    }
  }

  if (abortReason && abortType !== "timeout") {
    if (!state.lastValidation) {
      try {
        const result = await validateImpl(ctx, codeIndex);
        state.lastValidation = {
          ok: !!result?.ok,
          reason: result?.reason ?? (result?.ok ? undefined : "validation failed"),
        };
      } catch (err: any) {
        state.lastValidation = {
          ok: false,
          reason: `validate failed: ${err?.message || err}`,
        };
      }
    }
  }

  if (abortReason) {
    state.lastValidation = { ok: false, reason: abortReason };
  }

  if (!state.lastValidation && !error) {
    state.lastValidation = {
      ok: false,
      reason: "validate was not called",
    };
  }

  const runtimeMs = Date.now() - startTime;
  const metrics: RunMetrics = {
    promptChars: instructions.length,
    toolCalls,
    readFiles,
    runtimeMs,
    modelUsed: runConfig.modelName,
    fallbackUsed,
  };

  return { state, metrics, error, abortReason, abortType };
};

export const deepAgentService = async (
  ctx: JobContext,
  collectedContext: CollectedContext,
  planTasks: PlanTask[],
  codeIndex: CodeIndex,
) => {
  if (!codeIndex) throw new Error("Failed to load code index.");

  if (!process.env.GOOGLE_API_KEY && GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = GEMINI_API_KEY;
  }

  const config = getDeepAgentConfig();

  const baseRunConfig: RunConfig = {
    modelName: config.primaryModel,
    maxRecursion: config.maxRecursion,
    maxToolCalls: config.maxToolCalls,
    maxReadFiles: config.maxReadFiles,
    maxRuntimeMs: config.maxRuntimeMs,
    maxOutputTokens: config.maxOutputTokens,
    promptBudgets: config.promptBudgets,
  };

  const fallbackRunConfig: RunConfig = {
    modelName: config.fallbackModel,
    maxRecursion: Math.min(25, config.maxRecursion),
    maxToolCalls: Math.max(5, Math.floor(config.maxToolCalls * 0.7)),
    maxReadFiles: Math.max(3, Math.floor(config.maxReadFiles * 0.7)),
    maxRuntimeMs: Math.max(60000, Math.floor(config.maxRuntimeMs * 0.7)),
    maxOutputTokens: config.maxOutputTokens,
    promptBudgets: scalePromptBudgets(config.promptBudgets, 0.7),
  };

  const accumulatedChangedFiles = new Set<string>();

  const primaryResult = await runDeepAgentOnce(
    ctx,
    collectedContext,
    planTasks,
    codeIndex,
    baseRunConfig,
    false,
  );

  for (const path of primaryResult.state.changedFiles) {
    accumulatedChangedFiles.add(path);
  }

  let finalResult = primaryResult;
  let attempts = 1;

  if (primaryResult.error || primaryResult.abortType === "timeout") {
    logger.info("Deep agent retrying with fallback model", {
      error: primaryResult.error,
      abortReason: primaryResult.abortReason,
    });
    const fallbackResult = await runDeepAgentOnce(
      ctx,
      collectedContext,
      planTasks,
      codeIndex,
      fallbackRunConfig,
      true,
    );
    for (const path of fallbackResult.state.changedFiles) {
      accumulatedChangedFiles.add(path);
    }
    finalResult = fallbackResult;
    attempts = 2;
  }

  return {
    ok: !!finalResult.state.lastValidation?.ok,
    attempts,
    validation: finalResult.state.lastValidation,
    changedFiles: Array.from(accumulatedChangedFiles),
    toolHistory: finalResult.state.toolHistory,
    response: finalResult.state.finalResponse,
    metrics: finalResult.metrics,
    modelUsed: finalResult.metrics.modelUsed,
    fallbackUsed: finalResult.metrics.fallbackUsed,
    error: finalResult.error,
  };
};

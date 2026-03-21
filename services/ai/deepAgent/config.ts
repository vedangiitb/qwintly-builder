import { PromptBudgets } from "./contextBudget.js";

export type DeepAgentConfig = {
  primaryModel: string;
  fallbackModel: string;
  maxRecursion: number;
  maxToolCalls: number;
  maxReadFiles: number;
  maxRuntimeMs: number;
  maxOutputTokens: number;
  promptBudgets: Partial<PromptBudgets>;
};

const readInt = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
};

const readString = (name: string, fallback: string) => {
  const raw = process.env[name];
  return raw && raw.trim().length > 0 ? raw.trim() : fallback;
};

export const getDeepAgentConfig = (): DeepAgentConfig => {
  return {
    primaryModel: readString("DEEP_AGENT_PRIMARY_MODEL", "gemini-2.5-flash-lite"),
    fallbackModel: readString("DEEP_AGENT_FALLBACK_MODEL", "gemini-2.0-flash"),
    maxRecursion: readInt("DEEP_AGENT_MAX_RECURSION", 40),
    maxToolCalls: readInt("DEEP_AGENT_MAX_TOOL_CALLS", 30),
    maxReadFiles: readInt("DEEP_AGENT_MAX_READ_FILES", 12),
    maxRuntimeMs: readInt("DEEP_AGENT_MAX_RUNTIME_MS", 180000),
    maxOutputTokens: readInt("DEEP_AGENT_MAX_OUTPUT_TOKENS", 1024),
    promptBudgets: {
      contextChars: readInt("DEEP_AGENT_PROMPT_BUDGET_CONTEXT", 3000),
      planChars: readInt("DEEP_AGENT_PROMPT_BUDGET_PLAN", 1500),
      codeIndexChars: readInt("DEEP_AGENT_PROMPT_BUDGET_INDEX", 6000),
    },
  };
};

export const scalePromptBudgets = (
  budgets: Partial<PromptBudgets>,
  factor: number
): Partial<PromptBudgets> => {
  const scale = (value?: number) =>
    value === undefined ? undefined : Math.max(1, Math.floor(value * factor));
  return {
    contextChars: scale(budgets.contextChars),
    planChars: scale(budgets.planChars),
    codeIndexChars: scale(budgets.codeIndexChars),
  };
};

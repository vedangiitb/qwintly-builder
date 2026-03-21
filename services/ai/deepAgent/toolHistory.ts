import { logger } from "../../../utils/logger.js";
import { safeStringify, truncateSerialized } from "./serialization.js";

export type ToolHistoryEntry = {
  name: string;
  input: unknown;
  output?: unknown;
};

type ToolHistoryOptions = {
  maxEntries: number;
  maxPayloadChars: number;
};

export const createToolHistory = (options: ToolHistoryOptions) => {
  const history: ToolHistoryEntry[] = [];

  const toHistoryValue = (value: unknown) => {
    const text = safeStringify(value);
    if (text.length <= options.maxPayloadChars) return text;
    return text.slice(0, options.maxPayloadChars) + "...(truncated)";
  };

  const pushHistory = (entry: ToolHistoryEntry) => {
    history.push({
      name: entry.name,
      input: toHistoryValue(entry.input),
      output: entry.output !== undefined ? toHistoryValue(entry.output) : undefined,
    });
    if (history.length > options.maxEntries) {
      history.splice(0, history.length - options.maxEntries);
    }
  };

  const logTool = (phase: "call" | "result", name: string, payload: unknown) => {
    if (phase === "call") {
      pushHistory({ name, input: payload });
      logger.info("Deep agent tool call", {
        event: "tool_call",
        toolName: name,
        payload: truncateSerialized(payload, 1200),
      });
      return;
    }

    const last = history[history.length - 1];
    if (last && last.name === name && last.output === undefined) {
      last.output = toHistoryValue(payload);
    } else {
      pushHistory({ name, input: {}, output: payload });
    }

    logger.info("Deep agent tool result", {
      event: "tool_result",
      toolName: name,
      payload: truncateSerialized(payload, 1200),
    });
  };

  return {
    history,
    logTool,
  };
};

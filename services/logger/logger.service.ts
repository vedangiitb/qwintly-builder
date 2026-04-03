import { getJobContext } from "../../job/jobContext.js";

type logType = "STATUS" | "INFO" | "WARN" | "ERROR";

export const logger = {
  status: (message: string) => emit(message, "STATUS"),
  info: (message: string) => emit(message, "INFO"),
  warn: (message: string) => emit(message, "WARN"),
  error: (message: string) => emit(message, "ERROR"),
};

const emit = (message: string, type: logType) => {
  const ctx = getJobContext();

  const log = JSON.stringify({
    message,
    type,
    chatId: ctx?.chatId,
    sessionId: ctx?.sessionId,
  });

  if (type === "ERROR") {
    console.error(log);
  } else if (type === "WARN") {
    console.warn(log);
  } else {
    console.log(log);
  }
};

import { QwintlyCore } from "@vedangiitb/qwintly-core";
import { getJobContext } from "../../job/jobContext.js";
import {
  GEMINI_API_KEY,
  SUPABASE_ENDPOINT,
  SUPABASE_SECRET,
  UPSTASH_TOKEN,
  UPSTASH_URL,
} from "../../config/env.js";

let cachedCore: QwintlyCore | null = null;
const GEMINI_MODEL = "gemini-2.5-flash-lite";

export function getQwintlyCore(): QwintlyCore {
  if (cachedCore) return cachedCore;

  const ctx = getJobContext();

  cachedCore = new QwintlyCore({
    chatId: ctx.chatId,
    sessionId: ctx.sessionId,
    workspacePath: ctx.workspace,
    source: "qwintly-builder",
    step: "building" as any,
    supabase: {
      endpoint: SUPABASE_ENDPOINT,
      secret: SUPABASE_SECRET,
    },
    upstash: {
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    },
    gemini: {
      apiKey: GEMINI_API_KEY,
      ...(GEMINI_MODEL ? { model: GEMINI_MODEL } : {}),
    },
  });

  return cachedCore;
}

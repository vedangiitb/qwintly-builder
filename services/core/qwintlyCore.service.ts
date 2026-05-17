import { QwintlyCore } from "@vedangiitb/qwintly-core";
import {
  SUPABASE_ENDPOINT,
  SUPABASE_SECRET,
  UNSPLASH_ACCESS_KEY,
  UNSPLASH_URL,
  UPSTASH_TOKEN,
  UPSTASH_URL,
} from "../../config/env.js";
import { getJobContext } from "../../job/jobContext.js";
import { getKeyFromUserid } from "../byok/byok.service.js";

let cachedCore: QwintlyCore | null = null;
const GEMINI_MODEL_DEFAULT = "gemini-2.5-flash-lite";

export async function getQwintlyCore(): Promise<QwintlyCore> {
  if (cachedCore) return cachedCore;

  const ctx = getJobContext();

  const GEMINI_API_KEY = await getKeyFromUserid(ctx.userId, ctx.provider);

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
      ...{ model: ctx.model || GEMINI_MODEL_DEFAULT },
    },
    unsplash: {
      url: UNSPLASH_URL,
      accessKey: UNSPLASH_ACCESS_KEY,
    },
  });

  return cachedCore;
}

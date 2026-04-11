import {
  FunctionCallingConfigMode,
  GenerateContentConfig,
  GoogleGenAI,
  Tool,
} from "@google/genai";
import type { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { GEMINI_API_KEY } from "../../config/env.js";

let cachedAi: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  if (!cachedAi) {
    cachedAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  return cachedAi;
}

type AIResponseOptions = {
  tools?: Tool[];
  schema?: ZodSchema;
  model?: string;
  toolCallingMode?: FunctionCallingConfigMode;
};

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export async function aiResponse(
  request: unknown,
  options: AIResponseOptions = {}
) {
  const {
    tools,
    schema,
    model = DEFAULT_MODEL,
    toolCallingMode = FunctionCallingConfigMode.AUTO,
  } = options;

  const config: GenerateContentConfig = {};

  // Tool calling has highest priority
  if (tools && tools.length > 0) {
    config.tools = tools;
    config.toolConfig = {
      functionCallingConfig: {
        mode: toolCallingMode,
      },
    };
  }

  // Structured JSON response
  if (schema) {
    config.responseMimeType = "application/json";
    config.responseJsonSchema = zodToJsonSchema(schema as any);
  }

  try {
    const ai = getAi();
    return await ai.models.generateContent({
      model,
      contents: request as any,
      ...(Object.keys(config).length > 0 && { config }),
    });
  } catch (err: any) {
    throw new Error(`AI generation failed: ${err?.message || "Unknown error"}`);
  }
}

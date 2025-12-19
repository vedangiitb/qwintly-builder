import { GoogleGenAI } from "@google/genai";
import { GOOGLE_GENAI_API_KEY } from "../../config/env.js";

export const ai = new GoogleGenAI({
  apiKey: GOOGLE_GENAI_API_KEY!,
});

export const aiResponse = async (request: string, tools: any[]) => {
  return await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: request,
    config: {
      tools: tools,
    },
  });
};

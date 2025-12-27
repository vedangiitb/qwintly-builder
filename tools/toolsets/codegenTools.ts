import { Tool } from "@google/genai";
import { writeCodeSchema } from "../schemas/writeCode.schema.js";
export const codegenTools = (): Tool[] => {
  return [{ functionDeclarations: [writeCodeSchema] }];
};

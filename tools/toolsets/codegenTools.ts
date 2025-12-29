import { Tool } from "@google/genai";
import { writeCodeSchema } from "../schemas/writeCode.schema.js";
import { ReadFileSchema } from "../schemas/readFile.schema.js";
export const codegenTools = (): Tool[] => {
  return [{ functionDeclarations: [writeCodeSchema, ReadFileSchema] }];
};

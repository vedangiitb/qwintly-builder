import { Tool } from "@google/genai";
import { ReadFileSchema } from "../schemas/readFile.schema.js";
import { writeCodeSchema } from "../schemas/writeCode.schema.js";
import { FinishTaskSchema } from "../schemas/finishTask.schema.js";
export const validatorTools = (): Tool[] => {
  return [
    {
      functionDeclarations: [writeCodeSchema, ReadFileSchema, FinishTaskSchema],
    },
  ];
};

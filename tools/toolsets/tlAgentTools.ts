import { Tool } from "@google/genai";
import { CreateTasksSchema } from "../schemas/createTasks.schema.js";
import { ReadFileSchema } from "../schemas/readFile.schema.js";
export const tlAgentTools = (): Tool[] => {
  return [{ functionDeclarations: [CreateTasksSchema, ReadFileSchema] }];
};

import { Tool } from "@google/genai";
import { ReadFileSchema } from "../schemas/readFile.schema.js";
import { CreateFileSchema } from "../schemas/createFile.schema.js";
import { DeleteFileSchema } from "../schemas/deleteFile.schema.js";
import { SearchSchema } from "../schemas/search.schema.js";
import { ListDirSchema } from "../schemas/listDir.schema.js";
import { SubmitPlannerTasksSchema } from "../schemas/submitPlannerTasks.schema.js";

export const plannerTools = (): Tool[] => {
  return [
    {
      functionDeclarations: [
        ReadFileSchema,
        CreateFileSchema,
        DeleteFileSchema,
        SearchSchema,
        ListDirSchema,
        SubmitPlannerTasksSchema,
      ],
    },
  ];
};

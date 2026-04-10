import { Tool } from "@google/genai";
import { ReadFileSchema } from "../schemas/readFile.schema.js";
import { ApplyPatchSchema } from "../schemas/applyPatch.schema.js";
import { SubmitCodegenDoneSchema } from "../schemas/submitCodegenDone.schema.js";

export const codegenTools = (): Tool[] => {
  return [
    {
      functionDeclarations: [
        ReadFileSchema,
        ApplyPatchSchema,
        SubmitCodegenDoneSchema,
      ],
    },
  ];
};

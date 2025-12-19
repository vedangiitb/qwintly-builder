import { Type } from "@google/genai";

export const createStructureTool = {
  name: "createStructureTool",
  description:
    "Create or modify project folder structure and define files with their purpose (no code)",
  parameters: {
    type: Type.OBJECT,
    properties: {
      folders: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      files: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            path: { type: Type.STRING },
            purpose: { type: Type.STRING },
          },
          required: ["path", "purpose"],
        },
      },
    },
    required: ["folders", "files"],
  },
};

import { Type } from "@google/genai";

export const ReadFileSchema = {
  name: "read_file",
  description: "Read the contents of a file from the codebase",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING },
    },
    required: ["path"],
  },
};

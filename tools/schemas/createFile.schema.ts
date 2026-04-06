import { Type } from "@google/genai";

export const CreateFileSchema = {
  name: "create_file",
  description: "Creates an empty file at the given absolute path.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "Absolute path of the file to create.",
      },
    },
    required: ["path"],
  },
};

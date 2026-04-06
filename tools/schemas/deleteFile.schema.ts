import { Type } from "@google/genai";

export const DeleteFileSchema = {
  name: "delete_file",
  description: "Deletes a file at the given absolute path.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "Absolute path of the file to delete.",
      },
    },
    required: ["path"],
  },
};

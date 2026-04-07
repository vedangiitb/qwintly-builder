import { Type } from "@google/genai";

export const DeleteFileSchema = {
  name: "delete_file",
  description:
    "Deletes a file at the given path. Prefer workspace-relative paths; absolute paths are allowed only if they resolve within the workspace.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description:
          "Workspace-relative path of the file to delete (preferred). Absolute paths are allowed only if within the workspace root.",
      },
    },
    required: ["path"],
  },
};

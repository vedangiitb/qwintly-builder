import { Type } from "@google/genai";

export const CreateFileSchema = {
  name: "create_file",
  description:
    "Creates an empty file at the given path. Prefer workspace-relative paths; absolute paths are allowed only if they resolve within the workspace.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description:
          "Workspace-relative path of the file to create (preferred). Absolute paths are allowed only if within the workspace root.",
      },
    },
    required: ["path"],
  },
};

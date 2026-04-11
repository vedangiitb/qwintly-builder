import { Type } from "@google/genai";

export const WriteFileSchema = {
  name: "write_file",
  description:
    "Writes full file content to the given path within the workspace (overwrites existing file).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description:
          "Absolute or workspace-relative path to the file to write (must be within the workspace).",
      },
      content: {
        type: Type.STRING,
        description: "Complete file contents to write.",
      },
    },
    required: ["path", "content"],
  },
};


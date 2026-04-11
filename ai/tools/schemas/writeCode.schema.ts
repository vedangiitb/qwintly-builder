import { Type } from "@google/genai";

export const writeCodeSchema = {
  name: "write_code",
  description: "Writes full file content to the given path within the workspace.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description:
          "Absolute or workspace-relative path to the file to write (must be within the workspace).",
      },
      code: {
        type: Type.STRING,
        description: "Complete file contents to write.",
      },
      description: {
        type: Type.STRING,
        description: "Short description of the changes being applied.",
      },
    },
    required: ["path", "code", "description"],
  },
};


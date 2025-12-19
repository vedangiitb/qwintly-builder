import { Type } from "@google/genai";

export const writeFileTool = {
  name: "write_file",
  description: "Write code to a file",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING },
      content: { type: Type.STRING },
    },
    required: ["path", "content"],
  },
};

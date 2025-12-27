import { FunctionDeclaration, Type } from "@google/genai";

export const writeCodeSchema: FunctionDeclaration = {
  name: "write_code",
  description: "Write code to a file",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING },
      code: { type: Type.STRING },
      description: { type: Type.STRING },
    },
    required: ["path", "code", "description"],
  },
};

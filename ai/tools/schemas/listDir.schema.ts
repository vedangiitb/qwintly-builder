import { Type } from "@google/genai";

export const ListDirSchema = {
  name: "list_dir",
  description: "Lists directory/folder structure for a given path.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "Absolute path of the directory to list.",
      },
      depth: {
        type: Type.INTEGER,
        description: "Max depth to traverse (maximum 3).",
        minimum: 1,
        maximum: 3,
      },
    },
    required: ["path", "depth"],
  },
};

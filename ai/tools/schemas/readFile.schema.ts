import { Type } from "@google/genai";

export const ReadFileSchema = {
  name: "read_file",
  description:
    "Reads a specific text file from the local codebase and returns its contents. Supports partial reading via line ranges. If end_line is omitted, the response is capped to ~200 lines; request additional ranges with start_line/end_line for more context.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description:
          "The relative path to the file from the project root (e.g., 'src/index.ts').",
      },
      start_line: {
        type: Type.INTEGER,
        description:
          "The 1-based line number to start reading from. Defaults to the beginning of the file.",
        minimum: 1,
      },
      end_line: {
        type: Type.INTEGER,
        description:
          "The 1-based line number to stop reading at (inclusive). If omitted, reads until the end of the file.",
        minimum: 1,
      },
    },
    required: ["path"],
  },
};

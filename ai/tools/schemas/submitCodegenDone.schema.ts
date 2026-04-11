import { Type } from "@google/genai";

export const SubmitCodegenDoneSchema = {
  name: "submit_codegen_done",
  description:
    "Signals the code-generation agent is finished with the current task. Calling this tool ends the codegen phase.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description:
          "Short summary of what was changed and why (1-3 sentences max).",
      },
    },
    required: ["summary"],
  },
};


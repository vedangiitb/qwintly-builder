import { Type } from "@google/genai";

export const FinishTaskSchema = {
  name: "finish_task",
  description: "Signal that all fixes are complete and report changes made",
  parameters: {
    type: Type.OBJECT,
    properties: {
      finished: { type: Type.BOOLEAN },
    },
    required: ["changes"],
  },
};

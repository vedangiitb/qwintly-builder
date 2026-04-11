import { Type } from "@google/genai";

export const ApplyPatchSchema = {
  name: "apply_patch",
  description: "Applies a diff patch to a file or set of files.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patch_string: {
        type: Type.STRING,
        description: "The patch string to apply.",
      },
    },
    required: ["patch_string"],
  },
};

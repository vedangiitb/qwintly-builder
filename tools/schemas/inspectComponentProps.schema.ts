import { Type } from "@google/genai";

export const InspectComponentPropsSchema = {
  name: "inspect_component_props",
  description: "Inspect the public props and types of a React component",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING },
    },
    required: ["path"],
  },
};

import { Type } from "@google/genai";

export const SearchSchema = {
  name: "search",
  description: "Search the codebase using ripgrep (rg).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      search_query: {
        type: Type.STRING,
        description:
          "The search query passed to rg (e.g., 'fetchChatMessages\\(').",
      },
    },
    required: ["search_query"],
  },
};

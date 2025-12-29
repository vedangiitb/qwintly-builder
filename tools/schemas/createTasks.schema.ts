import { Type } from "@google/genai";

export const CreateTasksSchema = {
  name: "create_task",
  description: "Create implementation tasks from PM requirements",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            task_id: { type: Type.STRING },
            description: { type: Type.STRING },
            content: { type: Type.STRING },
            isNewPage: { type: Type.BOOLEAN },
            pagePath: { type: Type.STRING },
            depends: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "task_id",
            "description",
            "content",
            "isNewPage",
            "pagePath",
            "depends"
          ],
        },
      },
    },
    required: ["tasks"],
  },
};

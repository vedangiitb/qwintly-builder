import { Type } from "@google/genai";

export const SubmitPlannerTasksSchema = {
  name: "submit_planner_tasks",
  description:
    "Finalizes and returns the planner tasks for the code-generation agent. Calling this tool ends the planning phase.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      planner_tasks: {
        type: Type.ARRAY,
        description:
          "Ordered list of atomic tasks. Each task must include a clear description and a list of workspace paths to modify or reference.",
        items: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description:
                "Atomic, unambiguous instruction for the code-generation agent.",
            },
            targets: {
              type: Type.ARRAY,
              description:
                "Workspace-relative file paths that the code-generation agent should modify or reference for this task.",
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["description", "targets"],
        },
      },
    },
    required: ["planner_tasks"],
  },
};


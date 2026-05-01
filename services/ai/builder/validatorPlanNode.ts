import { ValidatorIndex } from "@vedangiitb/qwintly-core";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { createWorkspaceToolImpls } from "@vedangiitb/qwintly-core";
import { plannerTools } from "@vedangiitb/qwintly-core";
import { createWorkspaceDeps } from "./workspaceDeps.service.js";
import { validationNodePrompt } from "../prompts/validationNodePrompt.js";
import { BuilderNode } from "./createBuilderGraph.js";
import {
  parsePlannerTasksJson,
  parsePlannerTasksUnknown,
} from "./plannerTaskParser.js";

export function makeValidatorPlanNode(
  validatorIndex: ValidatorIndex,
): BuilderNode {
  return async (state) => {
    const core = getQwintlyCore();

    await core.streamLog(
      "AI: Planning fixes for validation issues...",
      "step_started" as any,
    );

    const prompt = validationNodePrompt({
      errors: state.validationErrors ?? [],
      history: state.validationFixHistory ?? [],
      validatorIndex,
    });

    const deps = createWorkspaceDeps();
    const { readFileImpl, searchImpl, listDirImpl } =
      createWorkspaceToolImpls(deps);

    const result = await core.runAiFlow(
      [{ role: "user", parts: [{ text: prompt }] }],
      plannerTools(),
      {
        read_file: async (args) => {
          const path = String(args.path ?? "");
          const startLine =
            args.start_line === undefined ? undefined : Number(args.start_line);
          const endLine =
            args.end_line === undefined ? undefined : Number(args.end_line);

          const content = await readFileImpl(path, startLine, endLine);
          return { path, content };
        },
        search: async (args) => {
          const results = await searchImpl(String(args.search_query ?? ""));
          return { results };
        },
        list_dir: async (args) => {
          const content = await listDirImpl(
            String(args.path ?? ""),
            Number(args.depth ?? 1),
          );
          return { content };
        },
        submit_planner_tasks: async (args) => {
          const tasks = parsePlannerTasksUnknown(args.planner_tasks);
          return { success: true, count: tasks.length };
        },
      },
      25,
      ["submit_planner_tasks"],
    );

    const plannerTasks =
      result.terminalCall?.name === "submit_planner_tasks"
        ? parsePlannerTasksUnknown(result.terminalCall.args.planner_tasks)
        : parsePlannerTasksJson(result.finalText);

    await core.streamLog(
      `AI: Fix plan ready (${plannerTasks.length} tasks)`,
      "step_finished" as any,
    );

    return { plannerTasks };
  };
}


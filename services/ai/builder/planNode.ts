import { ProjectRequestType } from "../../../data/project.constants.js";
import { PlannerIndex } from "@vedangiitb/qwintly-core";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { createWorkspaceToolImpls } from "@vedangiitb/qwintly-core";
import { createWorkspaceDeps } from "./workspaceDeps.service.js";
import { plannerTools } from "@vedangiitb/qwintly-core";
import { planNodePrompt } from "../prompts/planNodePrompt.js";
import { BuilderNode } from "./createBuilderGraph.js";
import {
  parsePlannerTasksJson,
  parsePlannerTasksUnknown,
} from "./plannerTaskParser.js";

export function makePlanNode(
  plannerIndex: PlannerIndex,
  requestType: string,
): BuilderNode {
  return async (state) => {
    const core = await getQwintlyCore();
    const isNewProject = requestType === ProjectRequestType.NEW;

    await core.streamLog("AI: Generating plan...", "step_started" as any);

    const prompt = planNodePrompt({
      planTasks: state.planTasks ?? [],
      collectedContext: state.collectedContext,
      plannerIndex,
      isNewProject,
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
      `AI: Plan ready (${plannerTasks.length} tasks)`,
      "step_finished" as any,
    );
    console.log("Planner tasks produced", {
      count: plannerTasks.length,
      requestType,
    });

    return { plannerTasks };
  };
}

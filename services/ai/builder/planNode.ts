import {
  EVENT_TYPES,
  PlannerIndex,
  plannerPrompt,
  plannerTools,
} from "@vedangiitb/qwintly-core";
import { ProjectRequestType } from "../../../data/project.constants.js";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { persistModelRsp } from "../../project/persistModelrsp.service.js";
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

    await core.streamLog("AI: Generating plan...", EVENT_TYPES.STEP_STARTED);

    const prompt = plannerPrompt({
      planTasks: state.planTasks ?? [],
      collectedContext: state.collectedContext,
      plannerIndex,
      isNewProject,
    });

    const result = await core.runAiFlow(
      [{ role: "user", parts: [{ text: prompt }] }],
      plannerTools(),
      25,
      ["submit_planner_tasks"],
      persistModelRsp,
    );

    const plannerTasks =
      result.terminalCall?.name === "submit_planner_tasks"
        ? parsePlannerTasksUnknown(result.terminalCall.args.planner_tasks)
        : parsePlannerTasksJson(result.finalText);

    await core.streamLog(
      `Planner agent: Planned ${plannerTasks.length} coding tasks`,
      EVENT_TYPES.STEP_FINISHED,
      true,
    );
    console.log("Planner tasks produced", {
      count: plannerTasks.length,
      requestType,
    });

    return { plannerTasks };
  };
}

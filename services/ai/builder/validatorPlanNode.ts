import {
  plannerTools,
  ValidatorIndex,
  validatorPrompt,
} from "@vedangiitb/qwintly-core";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { BuilderNode } from "./createBuilderGraph.js";
import {
  parsePlannerTasksJson,
  parsePlannerTasksUnknown,
} from "./plannerTaskParser.js";

export function makeValidatorPlanNode(
  validatorIndex: ValidatorIndex,
): BuilderNode {
  return async (state) => {
    const core = await getQwintlyCore();

    await core.streamLog(
      "AI: Planning fixes for validation issues...",
      "step_started" as any,
    );

    const prompt = validatorPrompt({
      errors: state.validationErrors ?? [],
      history: state.validationFixHistory ?? [],
      validatorIndex,
    });

    const result = await core.runAiFlow(
      [{ role: "user", parts: [{ text: prompt }] }],
      plannerTools(),
      25,
      ["submit_planner_tasks"],
    );

    const plannerTasks =
      result.terminalCall?.name === "submit_planner_tasks"
        ? parsePlannerTasksUnknown(result.terminalCall.args.planner_tasks)
        : parsePlannerTasksJson(result.finalText);

    await core.streamLog(
      `AI: Fix plan ready with ${plannerTasks.length} coding tasks`,
      "step_finished" as any,
    );

    return { plannerTasks };
  };
}

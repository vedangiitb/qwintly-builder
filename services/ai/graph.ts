import { getJobContext } from "../../job/jobContext.js";
import { getQwintlyCore } from "../core/qwintlyCore.service.js";
import { createBuilderGraph } from "./builder/createBuilderGraph.js";
import { makeIterateAndCodeNode } from "./builder/iterateAndCodeNode.js";
import { makePlanNode } from "./builder/planNode.js";
import { validationNode } from "./builder/validationNode.js";
import { makeValidatorPlanNode } from "./builder/validatorPlanNode.js";
import { CollectedContext } from "../../types/context.types.js";
import { PlanTask } from "../../types/updatePlan.types.js";
import { AgentState } from "./state.js";

export const runBuilderAiFlow = async (
  planTasks: PlanTask[],
  collectedContext: CollectedContext,
) => {
  const core = await getQwintlyCore();
  const [plannerIndex, validatorIndex] = await Promise.all([
    core.buildPlannerIdx(),
    core.buildValidatorIdx(),
  ]);

  const ctx = getJobContext();

  const graph = createBuilderGraph({
    plan: makePlanNode(plannerIndex as any, ctx.requestType),
    codegen: makeIterateAndCodeNode(ctx.requestType),
    validate: validationNode,
    validationPlan: makeValidatorPlanNode(validatorIndex as any),
  });

  const initialState: AgentState = {
    iteration: 0,
    planTasks: planTasks ?? [],
    collectedContext,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
    editedFiles: [],
  };

  await core.streamLog("AI: Starting builder flow", "step_started" as any);
  const result = await graph.invoke(initialState);
  await core.streamLog("AI: Builder flow complete", "step_finished" as any);
  return result;
};

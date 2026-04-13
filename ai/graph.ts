import { getJobContext } from "../job/jobContext.js";
import { createBuilderGraph } from "../services/ai/builder/createBuilderGraph.js";
import { makeIterateAndCodeNode } from "../services/ai/builder/iterateAndCodeNode.js";
import { makePlanNode } from "../services/ai/builder/planNode.js";
import { validationNode } from "../services/ai/builder/validationNode.js";
import { makeValidatorPlanNode } from "../services/ai/builder/validatorPlanNode.js";
import { buildPlannerIndex } from "../services/indexer/plannerIndex.js";
import { buildValidatorIndex } from "../services/indexer/validatorIndex.js";
import { CollectedContext } from "../types/context.types.js";
import { PlanTask } from "../types/updatePlan.types.js";
import { AgentState } from "./state.js";

export const runBuilderAiFlow = async (
  planTasks: PlanTask[],
  collectedContext: CollectedContext,
) => {
  const [plannerIndex, validatorIndex] = await Promise.all([
    buildPlannerIndex(),
    buildValidatorIndex(),
  ]);

  const ctx = getJobContext();

  const graph = createBuilderGraph({
    plan: makePlanNode(plannerIndex, ctx.requestType),
    codegen: makeIterateAndCodeNode(ctx.requestType),
    validate: validationNode,
    validationPlan: makeValidatorPlanNode(validatorIndex),
  });

  const initialState: AgentState = {
    iteration: 0,
    planTasks: planTasks ?? [],
    collectedContext,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
  };

  return await graph.invoke(initialState);
};

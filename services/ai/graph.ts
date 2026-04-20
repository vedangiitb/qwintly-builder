import { getJobContext } from "../../job/jobContext.js";
import { createBuilderGraph } from "./builder/createBuilderGraph.js";
import { makeIterateAndCodeNode } from "./builder/iterateAndCodeNode.js";
import { makePlanNode } from "./builder/planNode.js";
import { validationNode } from "./builder/validationNode.js";
import { makeValidatorPlanNode } from "./builder/validatorPlanNode.js";
import { buildPlannerIndex } from "../indexer/plannerIndex.js";
import { buildValidatorIndex } from "../indexer/validatorIndex.js";
import { CollectedContext } from "../../types/context.types.js";
import { PlanTask } from "../../types/updatePlan.types.js";
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

import { CollectedContext } from "../types/context.types.js";
import { PlanTask } from "../types/updatePlan.types.js";
import { AgentState } from "./state.js";
import { buildPlannerIndex } from "../services/indexer/plannerIndex.js";
import { buildCodegenIndex } from "../services/indexer/codegenIndex.js";
import { buildValidatorIndex } from "../services/indexer/validatorIndex.js";
import { createBuilderGraph } from "../services/ai/builder/createBuilderGraph.js";
import { makePlanNode } from "../services/ai/builder/planNode.js";
import { makeIterateAndCodeNode } from "../services/ai/builder/iterateAndCodeNode.js";
import { validationNode } from "../services/ai/builder/validationNode.js";
import { makeValidatorPlanNode } from "../services/ai/builder/validatorPlanNode.js";

export const runBuilderAiFlow = async (
  planTasks: PlanTask[],
  collectedContext: CollectedContext,
) => {
  const [plannerIndex, validatorIndex] = await Promise.all([
    buildPlannerIndex(),
    buildValidatorIndex(),
  ]);

  const graph = createBuilderGraph({
    plan: makePlanNode(plannerIndex),
    codegen: makeIterateAndCodeNode(),
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

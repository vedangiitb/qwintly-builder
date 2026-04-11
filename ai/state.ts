import { Annotation } from "@langchain/langgraph";
import { CollectedContext } from "../types/context.types.js";
import { PreflightErrorList } from "../types/preflightError.js";
import { PlannerTask } from "../types/ai/plannerTasks.types.js";
import { ValidatorAgentHistory } from "../types/validatorAgentHistory.js";
import { PlanTask } from "../types/updatePlan.types.js";

export type AgentState = {
  iteration: number;
  planTasks: PlanTask[];
  collectedContext: CollectedContext;
  plannerTasks: PlannerTask[];
  validationErrors: PreflightErrorList;
  validationFixHistory: ValidatorAgentHistory;
};

export const AgentStateAnnotation = Annotation.Root({
  iteration: Annotation<number>(),
  planTasks: Annotation<PlanTask[]>(),
  collectedContext: Annotation<CollectedContext>(),
  plannerTasks: Annotation<PlannerTask[]>(),
  validationErrors: Annotation<PreflightErrorList>(),
  validationFixHistory: Annotation<ValidatorAgentHistory>(),
});

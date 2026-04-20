import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState, AgentStateAnnotation } from "../state.js";

export type BuilderNode = (
  state: AgentState,
) => Promise<Partial<AgentState>> | Partial<AgentState>;

export type BuilderNodes = {
  plan: BuilderNode;
  codegen: BuilderNode;
  validate: BuilderNode;
  validationPlan: BuilderNode;
};

export function createBuilderGraph(nodes: BuilderNodes) {
  const routeAfterValidate = (state: AgentState) => {
    const errors = state.validationErrors ?? [];
    if (errors.length === 0) return "end";
    if ((state.iteration ?? 0) < 3) return "repair";
    return "end";
  };

  return new StateGraph(AgentStateAnnotation)
    .addNode("plan", nodes.plan)
    .addNode("codegen", nodes.codegen)
    .addNode("validate", nodes.validate)
    .addNode("validationPlan", nodes.validationPlan)
    .addEdge(START, "plan")
    .addEdge("plan", "codegen")
    .addEdge("codegen", "validate")
    .addConditionalEdges("validate", routeAfterValidate, {
      repair: "validationPlan",
      end: END,
    })
    .addEdge("validationPlan", "codegen")
    .compile();
}


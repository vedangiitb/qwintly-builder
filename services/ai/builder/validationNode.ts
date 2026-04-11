import { BuilderNode } from "./createBuilderGraph.js";
import { HeuristicValidator } from "../../validator/validators/HeuristicValidator.js";
import { NextRulesValidator } from "../../validator/validators/NextRulesValidator.js";

export const validationNode: BuilderNode = async () => {
  const [nextErrors, heuristicErrors] = await Promise.all([
    NextRulesValidator(),
    HeuristicValidator(),
  ]);

  return {
    validationErrors: [...nextErrors, ...heuristicErrors],
  };
};


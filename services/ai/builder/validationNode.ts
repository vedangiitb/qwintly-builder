import { BuilderNode } from "./createBuilderGraph.js";
import { HeuristicValidator } from "../../validator/validators/HeuristicValidator.js";
import { NextRulesValidator } from "../../validator/validators/NextRulesValidator.js";
import { logger } from "../../logger/logger.service.js";

export const validationNode: BuilderNode = async () => {
  logger.status("Validating project…", { phase: "validate" });
  const [nextErrors, heuristicErrors] = await Promise.all([
    NextRulesValidator(),
    HeuristicValidator(),
  ]);

  const errors = [...nextErrors, ...heuristicErrors];
  if (errors.length === 0) {
    logger.status("Validation passed", { phase: "validate" });
  } else {
    logger.status(`Validation found ${errors.length} issue(s)`, {
      phase: "validate",
      progress: { current: errors.length, total: errors.length, unit: "issues" },
    });
    logger.warn("Validation issues found", { count: errors.length });
  }

  return {
    validationErrors: errors,
  };
};

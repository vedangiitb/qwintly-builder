import { BuilderNode } from "./createBuilderGraph.js";
import { HeuristicValidator } from "../../validator/validators/HeuristicValidator.js";
import { NextRulesValidator } from "../../validator/validators/NextRulesValidator.js";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";

export const validationNode: BuilderNode = async () => {
  const core = getQwintlyCore();
  await core.streamLog("Validating project...", "step_started" as any);

  const [nextErrors, heuristicErrors] = await Promise.all([
    NextRulesValidator(),
    HeuristicValidator(),
  ]);

  const errors = [...nextErrors, ...heuristicErrors];
  if (errors.length === 0) {
    await core.streamLog("Validation passed", "step_finished" as any);
  } else {
    await core.streamLog(
      `Validation found ${errors.length} issue(s)`,
      "step_error" as any,
    );
    console.warn("Validation issues found", { count: errors.length });
  }

  return {
    validationErrors: errors,
  };
};


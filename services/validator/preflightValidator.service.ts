import { PreflightErrorList } from "../../types/preflightError.js";
import { ValidatorAgentHistory } from "../../types/validatorAgentHistory.js";
import { HeuristicValidator } from "./validators/HeuristicValidator.js";
import { NextRulesValidator } from "./validators/NextRulesValidator.js";
import { logger } from "../logger/logger.service.js";

export type PreflightValidatorResult =
  | { ok: true; history: ValidatorAgentHistory }
  | { ok: false; errors: PreflightErrorList; history: ValidatorAgentHistory };

export const preflightValidator = async (): Promise<PreflightValidatorResult> => {
  logger.info("Preflight validator: running Next + heuristic checks");
  const history: ValidatorAgentHistory = [];

  const [nextErrors, heuristicErrors] = await Promise.all([
    NextRulesValidator(),
    HeuristicValidator(),
  ]);

  const errors: PreflightErrorList = [...nextErrors, ...heuristicErrors];
  logger.info(`Preflight validator: found ${errors.length} error(s)`);

  if (errors.length === 0) {
    return { ok: true, history };
  }

  return { ok: false, errors, history };
};

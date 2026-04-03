import { getJobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { PreflightErrorList } from "../../types/preflightError.js";
import { ValidatorAgentHistory } from "../../types/validatorAgentHistory.js";
import { validatorAgent } from "./validatorAgent.service.js";
import { HeuristicValidator } from "./validators/HeuristicValidator.js";
import { NextRulesValidator } from "./validators/NextRulesValidator.js";
import { logger } from "../logger/logger.service.js";

export const preflightValidator = async (codeIndex: CodeIndex) => {
  const ctx = getJobContext();
  if (!codeIndex) throw new Error("Failed to load code index.");
  const skipAgent = ["1", "true", "yes"].includes(
    (process.env.SKIP_VALIDATOR_AGENT ?? "").toLowerCase()
  );
  const validators = {
    next: NextRulesValidator,
    heuristic: HeuristicValidator,
  };

  const PRIORITY: (keyof typeof validators)[] = ["next", "heuristic"];

  const MAX_STEPS = 4;
  let steps = 0;

  const globalHistory: ValidatorAgentHistory = [];
  while (steps < MAX_STEPS) {
    logger.info(`Preflight validator step ${steps + 1}/${MAX_STEPS}`);
    const allErrors: {
      type: keyof typeof validators;
      errors: PreflightErrorList;
    }[] = [];

    for (const [type, validator] of Object.entries(validators)) {
      const errors = await validator();
      logger.info(`Validator "${type}" found ${errors.length} error(s)`);
      if (errors.length > 0) {
        allErrors.push({ type: type as any, errors });
      }
    }

    const errorTypes = allErrors.map((e) => e.type).join(", ") || "none";
    const totalErrors = allErrors.reduce((acc, cur) => acc + cur.errors.length, 0);
    logger.info(
      `Preflight validation summary: total=${totalErrors}, types=${errorTypes}`,
    );

    if (allErrors.length === 0) {
      return { ok: true, history: globalHistory };
    }

    if (skipAgent) {
      logger.warn("Skipping validator agent due to SKIP_VALIDATOR_AGENT flag");
      return {
        ok: false,
        reason: "Preflight errors detected",
        errors: allErrors,
      };
    }

    let selected;
    for (const p of PRIORITY) {
      selected = allErrors.find((e) => e.type === p);
      if (selected) break;
    }

    if (!selected) break;

    logger.info(`Validator agent selected for "${selected.type}" errors`);
    const newHistory = await validatorAgent(
      selected.errors,
      globalHistory,
      codeIndex
    );

    globalHistory.push(...newHistory);

    steps += 1;
  }

  return {
    ok: false,
    reason: "Max preflight steps reached",
  };
};

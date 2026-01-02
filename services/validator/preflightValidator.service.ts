import { JobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { PreflightErrorList } from "../../types/preflightError.js";
import { ValidatorAgentHistory } from "../../types/validatorAgentHistory.js";
import { validatorAgent } from "./validatorAgent.service.js";
import { HeuristicValidator } from "./validators/HeuristicValidator.js";
import { NextRulesValidator } from "./validators/NextRulesValidator.js";

export const preflightValidator = async (
  ctx: JobContext,
  codeIndex: CodeIndex | undefined
) => {
  if (!codeIndex) throw new Error("Failed to load code index.");
  const validators = {
    next: NextRulesValidator,
    heuristic: HeuristicValidator,
  };

  const PRIORITY: (keyof typeof validators)[] = ["next", "heuristic"];

  const MAX_STEPS = 4;
  let steps = 0;

  const globalHistory: ValidatorAgentHistory = [];
  while (steps < MAX_STEPS) {
    console.log("step", steps);
    const allErrors: {
      type: keyof typeof validators;
      errors: PreflightErrorList;
    }[] = [];

    for (const [type, validator] of Object.entries(validators)) {
      const errors = await validator(ctx);
      console.log(errors);
      if (errors.length > 0) {
        allErrors.push({ type: type as any, errors });
      }
    }

    console.log(allErrors);

    if (allErrors.length === 0) {
      return { ok: true, history: globalHistory };
    }

    let selected;
    for (const p of PRIORITY) {
      selected = allErrors.find((e) => e.type === p);
      if (selected) break;
    }

    if (!selected) break;

    const newHistory = await validatorAgent(
      ctx,
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

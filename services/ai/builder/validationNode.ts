import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { HeuristicValidator } from "../../validator/HeuristicValidator.js";
import { NextRulesValidator } from "../../validator/NextRulesValidator.js";
import { BuilderNode } from "./createBuilderGraph.js";

function formatValidationIssues(
  errors: Array<{
    type?: string | null;
    filePath?: string | null;
    message?: string | null;
  }>,
  limit: number,
) {
  const lines = errors.slice(0, limit).map((e) => {
    const type = e.type ?? "unknown";
    const file = e.filePath ?? "unknown";
    const message = (e.message ?? "").trim() || "(no message)";
    return `- [${type}] ${file}: ${message}`;
  });

  const remaining = Math.max(0, errors.length - limit);
  if (remaining > 0) lines.push(`- ...and ${remaining} more`);
  return lines.join("\n");
}

export const validationNode: BuilderNode = async (state) => {
  const core = await getQwintlyCore();
  await core.streamLog("Validating project...", EVENT_TYPES.STEP_STARTED);

  const [nextErrors, heuristicErrors] = await Promise.all([
    NextRulesValidator(),
    HeuristicValidator(),
  ]);

  const errors = [...nextErrors, ...heuristicErrors];
  if (errors.length === 0) {
    await core.streamLog("Validation passed", EVENT_TYPES.STEP_FINISHED);
  } else {
    console.warn("Validation issues found", { count: errors.length, errors });
    await core.streamLog(
      `Validation found ${errors.length} issue(s)`,
      EVENT_TYPES.STEP_ERROR,
      true,
    );

    const preview = formatValidationIssues(errors, 20);
    if (preview.trim().length > 0) {
      console.log(
        `Validation issues (first 20):\n${preview}`,
        EVENT_TYPES.STEP_ERROR,
        true,
      );
    }
  }

  return {
    validationErrors: errors,
  };
};

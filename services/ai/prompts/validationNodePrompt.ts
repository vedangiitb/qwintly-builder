import {
  jsonBlock,
  mdSection,
  plannerClosingNote,
  plannerObjectives,
  renderPlannerTaskFormatSection,
  renderPlannerToolRules,
  renderPlannerWhatNotToDoSection,
} from "./helpers/promptParts.helper.js";
import { renderExamples } from "./examples/renderExamples.js";

export type ValidationNodePromptParams = {
  errors: Array<{
    type?: string | null;
    filePath?: string | null;
    message?: string | null;
  }>;
  history: Array<{ file?: string; fix?: string }>;
  validatorIndex: unknown;
};

export const validationNodePrompt = (params: ValidationNodePromptParams) => {
  const { errors, history, validatorIndex } = params;

  const renderedErrors =
    errors.length === 0
      ? "- No validation errors were provided."
      : errors
          .map(
            (error) =>
              `- Type: ${error.type}\n  File: ${error.filePath}\n  Message: ${error.message}`,
          )
          .join("\n");

  const renderedHistory =
    history.length === 0
      ? "- No previous fixes attempted."
      : history
          .map((h) => `- File: ${h.file}\n  Fix Attempted: ${h.fix}`)
          .join("\n");

  const sections = [
    `
You are a senior software engineer.
Based on the provided validation errors and fix history, generate a detailed technical implementation plan.
Provide precise, step-by-step instructions for a code-generation agent; ensure tasks are explicit and highly granular.
    `.trim(),

    plannerObjectives("validator"),

    mdSection(
      "Inputs (Authoritative)",
      `
Validation Errors:
${renderedErrors}

Fix History:
${renderedHistory}

${jsonBlock("Validator Index", validatorIndex ?? {})}
      `.trim(),
    ),

    renderPlannerToolRules(),

    renderPlannerTaskFormatSection(),

    renderPlannerWhatNotToDoSection([
      "Do NOT write actual code blocks in descriptions.",
      "Do NOT explain your reasoning.",
      "Do NOT output any text outside tool calls.",
      'Do NOT create vague tasks like "fix the error".',
    ]),

    mdSection("Examples", renderExamples("validator")),

    plannerClosingNote,
  ];

  return sections.join("\n\n---\n\n");
};

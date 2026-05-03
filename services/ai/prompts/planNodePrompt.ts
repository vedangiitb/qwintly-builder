import { renderUiConstraints } from "./helpers/genConfig.helper.js";
import {
  jsonBlock,
  mdSection,
  projectStateNote,
  plannerClosingNote,
  renderPlannerTaskFormatSection,
  renderPlannerToolRules,
  renderPlannerWhatNotToDoSection,
  plannerObjectives,
} from "./helpers/promptParts.helper.js";
import { renderExamples } from "./examples/renderExamples.js";

export type PlanNodePromptParams = {
  planTasks: unknown[];
  collectedContext: unknown;
  plannerIndex: unknown;
  isNewProject: boolean;
};

export const planNodePrompt = (params: PlanNodePromptParams) => {
  const { planTasks, collectedContext, plannerIndex, isNewProject } = params;

  const sections = [
    `
You are a senior software architect.
Based on the provided PM plan and code context, generate a detailed technical implementation plan.
Provide precise, step-by-step instructions for a code-generation agent; ensure tasks are explicit, atomic, and ordered.
${projectStateNote(isNewProject, "planner")}
    `.trim(),

    renderUiConstraints("planner"),

    mdSection(
      "page.config.ts Type Requirement (CRITICAL)",
      `
Whenever a planner task involves creating or editing any \`page.config.ts\`, the plan MUST explicitly instruct the codegen agent to export config with:
- \`import type { BuilderElement } from "@/types/elements";\`
- \`export const config = { ... } satisfies { elements: BuilderElement[] };\`

This is a strict requirement; the build will fail if \`satisfies { elements: BuilderElement[] }\` is missing.
      `.trim(),
    ),

    mdSection(
      "Inputs (Authoritative)",
      [
        jsonBlock("Plan Tasks", planTasks ?? []),
        jsonBlock("Collected Context", collectedContext ?? {}),
        jsonBlock("Planner Index", plannerIndex ?? {}),
      ].join("\n"),
    ),

    plannerObjectives("planner"),

    renderPlannerToolRules(),

    renderPlannerTaskFormatSection(),

    renderPlannerWhatNotToDoSection([
      "Do NOT write actual code blocks in descriptions (use descriptive pseudo-steps if needed).",
      "Do NOT explain your reasoning; just provide the plan.",
      "Do NOT output any text outside tool calls.",
      'Do NOT create vague tasks like "improve UI" or "refactor logic".',
    ]),

    mdSection("Examples", renderExamples("planner")),

    plannerClosingNote,
  ];

  return sections.join("\n\n---\n\n");
};

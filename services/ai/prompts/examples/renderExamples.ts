import { codegenExamples } from "./codegen.examples.js";
import { plannerExamples } from "./planner.examples.js";
import { validatorExamples } from "./validator.examples.js";

export type UiExamplesTarget = "planner" | "codegen" | "validator";

export const renderExamples = (target: UiExamplesTarget): string => {
  switch (target) {
    case "planner":
      return plannerExamples;
    case "codegen":
      return codegenExamples;
    case "validator":
      return validatorExamples;
    default:
      return codegenExamples;
  }
};

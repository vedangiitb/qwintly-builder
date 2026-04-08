import { z } from "zod";
import { PlannerTask } from "../../../types/ai/plannerTasks.types.js";

export const PlannerTaskSchema = z.object({
  description: z.string().min(1),
  targets: z.array(z.string().min(1)),
});

export const PlannerTasksSchema = z.array(PlannerTaskSchema);

function stripCodeFences(input: string) {
  const trimmed = (input ?? "").trim();
  const withoutStart = trimmed.replace(/^```(?:json)?\s*/i, "");
  return withoutStart.replace(/```$/i, "").trim();
}

export function parsePlannerTasksUnknown(value: unknown): PlannerTask[] {
  return PlannerTasksSchema.parse(value) as PlannerTask[];
}

export function parsePlannerTasksJson(text: string): PlannerTask[] {
  const cleaned = stripCodeFences(text);
  if (!cleaned) {
    throw new Error("Planner tasks parse failed: empty response text.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Planner tasks parse failed: invalid JSON. First 200 chars: ${cleaned.slice(0, 200)}`,
    );
  }

  return parsePlannerTasksUnknown(parsed);
}

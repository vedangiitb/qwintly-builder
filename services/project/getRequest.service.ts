import { TaskPlansRepository } from "../../repository/planTasks.repository.js";
import { PlanTask } from "../../types/updatePlan.types.js";

export async function fetchPlanTasks(planId: string): Promise<PlanTask[]> {
  if (!planId) {
    throw new Error("planId is required");
  }

  const repo = new TaskPlansRepository();

  try {
    const { tasks } = await repo.fetchPlanTasksById(planId);
    return tasks ?? [];
  } catch (err: any) {
    throw new Error(
      `Failed to fetch plan tasks for planId ${planId}: ${err?.message ?? err}`,
    );
  }
}

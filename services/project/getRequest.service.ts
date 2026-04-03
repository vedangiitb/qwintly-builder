import { getJobContext } from "../../job/jobContext.js";
import { TaskPlansRepository } from "../../repository/planTasks.repository.js";
import { PlanTask } from "../../types/updatePlan.types.js";

export async function fetchPlanTasks(): Promise<PlanTask[]> {
  const ctx = getJobContext();
  const planId = ctx.tasksPlanId;
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

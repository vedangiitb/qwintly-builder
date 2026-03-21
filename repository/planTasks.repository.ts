import { Plan } from "../types/updatePlan.types.js";
import { DBRepository } from "./repository.js";

export class TaskPlansRepository extends DBRepository {
  /*
   * Table: project_tasks
   * Use: Fetch plan tasks by id (Fetch)
   */
  async fetchPlanTasksById(
    planId: string,
  ): Promise<{ id: string; tasks: Plan["tasks"] }> {
    const supabase = this.client;

    const { data, error } = await supabase
      .from("project_tasks")
      .select("id, content")
      .eq("id", planId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("plan not found or unauthorized");

    return {
      id: data.id,
      tasks: data.content,
    };
  }
}

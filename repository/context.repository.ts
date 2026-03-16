import {
  CollectedContext,
  defaultCollectedContext,
} from "../types/context.types.js";
import { defaultProjectInfo, ProjectInfo } from "../types/projectInfo.types.js";
import { DBRepository } from "./repository.js";

export class ContextRepository extends DBRepository {
  /*
   * Table: project_context
   * Use: Fetch collected context (READ)
   */
  async fetchCollectedContext(id: string): Promise<CollectedContext> {
    const supabase = this.client;

    const { data, error } = await supabase
      .from("project_context")
      .select("collected_context")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return defaultCollectedContext;
    }

    const raw = data.collected_context ?? {};

    return {
      projectIdentity: {
        ...defaultCollectedContext.projectIdentity,
        ...(raw.projectIdentity ?? {}),
      },
      targetBusinessContext: {
        ...defaultCollectedContext.targetBusinessContext,
        ...(raw.targetBusinessContext ?? {}),
      },
      branding: {
        ...defaultCollectedContext.branding,
        ...(raw.branding ?? {}),
      },
      functionalRequirements: {
        ...defaultCollectedContext.functionalRequirements,
        ...(raw.functionalRequirements ?? {}),
      },
      constraints: {
        ...defaultCollectedContext.constraints,
        ...(raw.constraints ?? {}),
      },
      otherInfo: raw.otherInfo ?? [],
    };
  }

  /*
   * Table: project_context
   * Use: Fetch project info (READ)
   */
  async fetchProjectInfo(id: string): Promise<ProjectInfo> {
    const supabase = this.client;

    const { data, error } = await supabase
      .from("project_context")
      .select("project_info")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return defaultProjectInfo;

    const raw = data.project_info ?? {};

    return {
      ...defaultProjectInfo,
      ...raw,
      uiPages: raw.uiPages ?? defaultProjectInfo.uiPages,
    };
  }

  /*
   * Table: project_context
   * Use: Update project info (WRITE)
   */
  async updateProjectInfo(id: string, projectInfo: ProjectInfo) {
    const supabase = this.client;
    const { error } = await supabase
      .from("project_context")
      .update({ project_info: projectInfo })
      .eq("id", id);

    if (error) throw error;
  }
}

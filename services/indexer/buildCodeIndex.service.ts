import { buildPlannerIndex } from "./plannerIndex.js";

// For now, the "code index" is the planner index (folder tree + configs + conventions).
export const buildCodeIndex = async (rootDir?: string) => {
  return await buildPlannerIndex(rootDir);
};


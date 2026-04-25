import { PlannerIndex } from "../../types/index/index.types.js";
import {
  projectConfigs,
  projectConventions,
} from "./data/configs.constants.js";
import { buildFolderTree } from "./helpers/buildFolderTree.js";

export const buildPlannerIndex = async (
  rootDir?: string,
): Promise<PlannerIndex> => {
  const folderTree = await buildFolderTree(rootDir);

  return {
    folderTree,
    projectConfigs: {
      frameworkConfig: projectConfigs.frameworkConfig,
      runtimeConfig: projectConfigs.runtimeConfig,
      toolingConfig: projectConfigs.toolingConfig,
    },
    projectConventions: {
      folderConventions: projectConventions.folderConventions,
      importsConventions: projectConventions.importsConventions,
      routingConventions: projectConventions.routingConventions,
      namingConventions: projectConventions.namingConventions,
    },
  };
};

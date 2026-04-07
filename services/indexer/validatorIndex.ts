import { ValidatorIndex } from "../../types/index/index.types.js";
import { projectConfigs } from "./data/configs.constants.js";
import { buildFolderTree } from "./helpers/buildFolderTree.js";

export const buildValidatorIndex = async (
  rootDir?: string,
): Promise<ValidatorIndex> => {
  const folderTree = await buildFolderTree(rootDir);

  return {
    folderTree,
    projectConfigs: {
      frameworkConfig: projectConfigs.frameworkConfig,
      runtimeConfig: projectConfigs.runtimeConfig,
      toolingConfig: projectConfigs.toolingConfig,
    },
  };
};

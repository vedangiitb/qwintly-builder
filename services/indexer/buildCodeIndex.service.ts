import { CodeIndex } from "../../types/index/codeIndex.js";
import { ProjectConfig } from "../../types/index/projectConfig.js";
import { ProjectConventions } from "../../types/index/projectConventions.js";
import { ProjectIndex } from "../../types/index/projectIndex.js";
import { buildProjectIndex } from "./helpers/buildProjectIndex.js";
import { getProjectConfig } from "./helpers/getProjectConfig.js";
import { getProjectConventions } from "./helpers/getProjectConventions.js";

export const buildCodeIndex = async (): Promise<CodeIndex> => {
  const projectIndex: ProjectIndex = await buildProjectIndex();
  // TODO: Reduce projectConfig and projectConventions sizes to reduce token usage
  const projectConfig: ProjectConfig = getProjectConfig();
  const projectConventions: ProjectConventions = getProjectConventions();

  const codeIndex: CodeIndex = {
    projectConfig,
    projectConventions,
    projectIndex,
  };
  return codeIndex;
};

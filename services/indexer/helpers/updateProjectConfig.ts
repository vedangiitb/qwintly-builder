import { projectConfigs } from "../../../data/configs.constants.js";

export const updateProjectConfig = () => {
  const frameworkConfig = projectConfigs.frameworkConfig;

  const projectConfig = { framework: frameworkConfig };

  return projectConfig;
};

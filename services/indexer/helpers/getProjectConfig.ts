import { projectConfigs } from "../../../data/configs.constants.js";
import {
  FrameworkConfig,
  RuntimeConfig,
  ToolingConfig,
} from "../../../types/index/projectConfig.js";

export const getProjectConfig = () => {
  const frameworkConfig: FrameworkConfig = projectConfigs.frameworkConfig;
  const runtimeConfig: RuntimeConfig = projectConfigs.runtimeConfig;
  const toolingConfig: ToolingConfig = projectConfigs.toolingConfig;

  const projectConfig = {
    framework: frameworkConfig,
    runtime: runtimeConfig,
    tooling: toolingConfig,
  };

  return projectConfig;
};

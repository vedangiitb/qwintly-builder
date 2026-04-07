import {
  projectConfigs,
  projectConventions,
} from "../../services/indexer/data/configs.constants.js";

export type CodegenIndex = {
  folderTree: string;
  projectConfigs: Pick<
    typeof projectConfigs,
    "frameworkConfig" | "runtimeConfig"
  >;
  projectConventions: Pick<
    typeof projectConventions,
    "importsConventions" | "stylingConventions"
  >;
};

export type PlannerIndex = {
  folderTree: string;
  projectConfigs: Pick<
    typeof projectConfigs,
    "frameworkConfig" | "runtimeConfig" | "toolingConfig"
  >;
  projectConventions: Pick<
    typeof projectConventions,
    | "folderConventions"
    | "importsConventions"
    | "routingConventions"
    | "namingConventions"
    | "componentConventions"
    | "stylingConventions"
  >;
};

export type ValidatorIndex = {
  folderTree: string;
  projectConfigs: Pick<
    typeof projectConfigs,
    "frameworkConfig" | "runtimeConfig" | "toolingConfig"
  >;
};

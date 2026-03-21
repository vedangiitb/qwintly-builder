import { projectConfigs } from "../../../data/configs.constants.js";
import {
  AllowedShadcnComponents,
  ComponentConventions,
  FolderStructureList,
  FrontendOnlyRules,
  ImportConventions,
  NamingConventions,
  ProjectConventions,
  RoutingConventions,
  StylingConventions,
} from "../../../types/index/projectConventions.js";

export const getProjectConventions = (): ProjectConventions => {
  const folderStructure: FolderStructureList = projectConfigs.folderStructure;
  const routingConventions: RoutingConventions =
    projectConfigs.routingConventions;
  const namingConventions: NamingConventions = projectConfigs.namingConventions;
  const componentConventions: ComponentConventions =
    projectConfigs.componentConventions;
  const stylingConventions: StylingConventions =
    projectConfigs.stylingConventions;
  const importConventions: ImportConventions =
    projectConfigs.importConventions;
  const frontendOnlyRules: FrontendOnlyRules =
    projectConfigs.frontendOnlyRules;
  const allowedShadcnComponents: AllowedShadcnComponents =
    projectConfigs.allowedShadcnComponents;

  const projectConventions = {
    folderStructure,
    routingConventions,
    namingConventions,
    componentConventions,
    stylingConventions,
    importConventions,
    frontendOnlyRules,
    allowedShadcnComponents,
  };

  return projectConventions;
};

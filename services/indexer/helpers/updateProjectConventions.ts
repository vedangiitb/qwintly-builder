import { projectConfigs } from "../../../data/configs.constants.js";
import {
    AllowedShadcnComponents,
    FolderStructureList,
    ProjectConventions,
    RoutingConventions,
} from "../../../types/index/projectConventions/projectConventions.js";

export const updateProjectConventions = (): ProjectConventions => {
  const folderStructure: FolderStructureList = projectConfigs.folderStructure;
  const routingConventions: RoutingConventions =
    projectConfigs.routingConventions;
  const allowedShadcnComponents: AllowedShadcnComponents =
    projectConfigs.allowedShadcnComponents;

  const projectConventions = {
    folderStructure,
    routingConventions,
    allowedShadcnComponents,
  };

  return projectConventions;
};

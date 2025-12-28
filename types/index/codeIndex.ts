import { ProjectConfig } from "./projectConfig/projectConfig.js";
import { ProjectConventions } from "./projectConventions/projectConventions.js";
import { ProjectStructure } from "./projectStructure/projectStructure.js";

export interface CodeIndex {
  projectConfig: ProjectConfig;
  projectConventions: ProjectConventions;
  projectStructure: ProjectStructure;
}

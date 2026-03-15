import { ProjectConfig } from "./projectConfig.js";
import { ProjectConventions } from "./projectConventions.js";
import { ProjectIndex } from "./projectIndex.js";

export interface CodeIndex {
  projectIndex: ProjectIndex;
  projectConfig: ProjectConfig;
  projectConventions: ProjectConventions;
}

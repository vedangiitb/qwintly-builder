import { ProjectConfig } from "./projectConfig.js";
import {
  ComponentConventions,
  ImportConventions,
  NamingConventions,
  RoutingConventions,
  StylingConventions,
} from "./projectConventions.js";

export interface CodeIndex {
  folderTree: string;
  projectConfig: ProjectConfig;
  routingConventions: RoutingConventions;
  namingConventions: NamingConventions;
  componentConventions: ComponentConventions;
  stylingConventions: StylingConventions;
  importConventions: ImportConventions;
}

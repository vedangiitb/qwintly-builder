import { ProjectDetails } from "../index/projectDetails/projectDetails.js";
import { ProjectStructure } from "../index/projectStructure/projectStructure.js";

export interface PmIndex {
  projectDetails: ProjectDetails;
  capabilities: ProjectCapabilites;
  existingPages: ProjectStructure;
}

export interface ProjectCapabilites {
  supported_task_types: string[];
  ui_task_intents: string[];
  be_task_intents: string[];
  db_task_intents: string[];
}

interface Intent {
  name: string;
  description: string;
}

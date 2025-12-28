import { ProjectDetails } from "./index/projectDetails/projectDetails.js";

export interface pmMessage {
  tasks: pmTask[];
  newInfo: ProjectDetails;
}

export interface pmTask {
  task_id: string;
  task_type: taskType;
  intent: intentType;
  description: string;
  content: JSON;
  page: string;
  new_feature_name: string;
  feature: string;
  service: string;
  component_id: string;
}

type taskType = "ui_task" | "be_task" | "db_task";
type intentType =
  | "add_page"
  | "add_section"
  | "modify_section"
  | "modify_text_content"
  | "modify_styling"
  | "add_new_service"
  | "modify_service"
  | "connect_ai"
  | "db_connection"
  | "add_new_table"
  | "modify_schema"
  | "modify_table"
  | "add_new_column"
  | "modify_column";

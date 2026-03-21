export const TASK_TYPE = {
  UI_TASK: "ui_task",
  BE_TASK: "be_task",
  DB_TASK: "db_task",
};

export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE];

export const INTENT = {
  ADD_PAGE: "add_page",
  ADD_SECTION: "add_section",
  MODIFY_SECTION: "modify_section",
  MODIFY_TEXT_CONTENT: "modify_text_content",
  MODIFY_STYLING: "modify_styling",
  ADD_NEW_SERVICE: "add_new_service",
  MODIFY_SERVICE: "modify_service",
  CONNECT_AI: "connect_ai",
  DB_CONNECTION: "db_connection",
  ADD_NEW_TABLE: "add_new_table",
  MODIFY_SCHEMA: "modify_schema",
  MODIFY_TABLE: "modify_table",
  ADD_NEW_COLUMN: "add_new_column",
  MODIFY_COLUMN: "modify_column",
};

export type Intent = (typeof INTENT)[keyof typeof INTENT];

export type PlanTask = {
  task_id: string;
  task_type: TaskType;
  intent: Intent;
  description: string;
};

export const PLAN_STATUS = {
  PENDING: "pending",
  UPDATED: "updated",
  IMPLEMENTED: "implemented",
};

export type PlanStatus = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];

export type Plan = {
  id?: string;
  tasks: PlanTask[];
  status: PlanStatus;
  messageId?: string;
};

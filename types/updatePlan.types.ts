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
};

export type Intent = (typeof INTENT)[keyof typeof INTENT];

export type PlanTask = {
  task_id: string;
  task_type: TaskType;
  intent: Intent;
  task: string;
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

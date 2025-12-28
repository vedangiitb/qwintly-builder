export const pmIndexConstants = {
  capabilities: {
    supported_task_types: ["ui_task", "be_task", "db_task"],

    ui_task_intents: [
      "add_page",
      "add_section",
      "modify_section",
      "modify_text_content",
      "modify_styling",
    ],

    be_task_intents: [
      "add_new_service",
      "modify_service",
      "connect_ai",
      "db_connection",
    ],

    db_task_intents: [
      "add_new_table",
      "modify_schema",
      "modify_table",
      "add_new_column",
      "modify_column",
    ],
    // unsupported_capabilities: ["payments"],
  },
};

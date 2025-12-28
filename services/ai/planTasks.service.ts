import { aiResponse } from "../../infra/ai/gemini.client.js";
import { JobContext } from "../../job/jobContext.js";
import { tlAgentPrompt } from "../../prompts/tlAgentPrompt.js";
import { createTaskImpl } from "../../tools/implementations/createTaskImpl.js";
import { CreateTasksSchema } from "../../tools/schemas/createTasks.schema.js";
import { tlAgentTools } from "../../tools/toolsets/tlAgentTools.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { pmMessage } from "../../types/pmMessage.js";
import { createTaskList } from "../../types/tlTasks.interface.js";

export async function planTasks(
  ctx: JobContext,
  pmMessage: pmMessage,
  codeIndex: CodeIndex
) {
  const tasks = pmMessage.tasks;
  const projectDetails = pmMessage.newInfo;

  try {
    const response = await aiResponse(
      tlAgentPrompt(tasks, codeIndex, projectDetails),
      {
        tools: tlAgentTools(),
      }
    );

    if (!response.functionCalls || response.functionCalls.length === 0) {
      throw new Error("No function call found in the response.");
    }

    const functionCall = response.functionCalls[0];
    if (!functionCall)
      throw new Error("No function call found in the response.");

    const { name, args } = functionCall;

    if (name !== CreateTasksSchema.name) {
      throw new Error(`Unexpected function call: ${name}`);
    }

    if (!args || !Array.isArray(args.tasks)) {
      throw new Error("Invalid arguments: expected 'tasks' array");
    }

    const taskList: createTaskList = {
      tasks: [],
    };

    for (const task of args.tasks) {
      if (
        !task.task_id ||
        !task.description ||
        task.content === undefined ||
        task.isNewPage === undefined ||
        !task.pagePath
      ) {
        throw new Error(
          `Invalid task object received: ${JSON.stringify(task)}`
        );
      }

      const createdTask = await createTaskImpl(
        String(task.task_id),
        String(task.description),
        String(task.content),
        Boolean(task.isNewPage),
        String(task.pagePath)
      );

      taskList.tasks.push(createdTask);
    }

    const tasksList = taskList.tasks;
    if (!taskList) throw new Error("No tasks created.");
    return tasksList;
  } catch (err) {
    console.error(err);
  }
}

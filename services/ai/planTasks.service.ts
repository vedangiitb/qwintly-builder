import { aiResponse } from "../../infra/ai/gemini.client.js";
import { JobContext } from "../../job/jobContext.js";
import { tlAgentPrompt } from "../../prompts/tlAgentPrompt.js";
import { createTaskImpl } from "../../tools/implementations/createTaskImpl.js";
import { readFileImpl } from "../../tools/implementations/readFileImpl.js";
import { CreateTasksSchema } from "../../tools/schemas/createTasks.schema.js";
import { ReadFileSchema } from "../../tools/schemas/readFile.schema.js";
import { tlAgentTools } from "../../tools/toolsets/tlAgentTools.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { pmMessage } from "../../types/pmMessage.js";
import { createTaskList } from "../../types/tlTasks.interface.js";

export async function planTasks(
  ctx: JobContext,
  pmMessage: pmMessage,
  codeIndex: CodeIndex | undefined
) {
  if (!codeIndex) throw new Error("Failed to load code index.");
  const tasks = pmMessage.tasks;
  const projectDetails = pmMessage.newInfo;

  const contents: any[] = [
    {
      role: "user",
      parts: [
        {
          text: tlAgentPrompt(tasks, codeIndex, projectDetails),
        },
      ],
    },
  ];

  const MAX_ITERATIONS = 10;

  const MAX_READS = 3;
  let readCount = 0;

  const readFiles = new Map<string, string>();

  for (let step = 0; step < MAX_ITERATIONS; step++) {
    const response = await aiResponse(contents, {
      tools: tlAgentTools(),
    });

    if (!response.functionCalls || response.functionCalls.length === 0) {
      throw new Error("Agent did not call any function.");
    }

    const { name, args } = response.functionCalls[0];

    contents.push({
      role: "assistant",
      parts: [
        {
          functionCall: {
            name,
            args,
          },
        },
      ],
    });
    // ----------------------------
    // READ FILE TOOL
    // ----------------------------
    if (name === ReadFileSchema.name) {
      if (readCount >= MAX_READS) {
        console.log("Read limit exceeded");
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  ok: false,
                  error: {
                    type: "READ_LIMIT_EXCEEDED",
                    message:
                      "You have already read enough files. Stop investigation and create tasks now.",
                    retryable: false,
                  },
                },
              },
            },
          ],
        });
        continue;
      }

      readCount++;

      try {
        const { path } = args as { path: string };
        console.log("PlanTasks:Reading file", path);

        let content: string;
        if (readFiles.has(path)) {
          content = readFiles.get(path)!;
        } else {
          content = await readFileImpl(ctx, path);
          readFiles.set(path, content);
        }

        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  ok: true,
                  data: { path, content },
                },
              },
            },
          ],
        });

        contents.push({
          role: "user",
          parts: [
            {
              text: "Reminder: Excessive file reading is discouraged. Only read files strictly required for task planning.",
            },
          ],
        });

        continue;
      } catch (err: any) {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  ok: false,
                  error: {
                    type: "READ_FILE_FAILED",
                    message: err?.message ?? String(err),
                    retryable: false,
                  },
                },
              },
            },
          ],
        });

        continue;
      }
    }

    // ----------------------------
    // CREATE TASK TOOL (TERMINAL)
    // ----------------------------
    if (name === CreateTasksSchema.name) {
      console.log("Calling create task schema fucntion");
      if (!args || !Array.isArray(args.tasks)) {
        throw new Error("Invalid create_task arguments.");
      }

      const taskList: createTaskList = { tasks: [] };

      for (const task of args.tasks) {
        if (
          !task.task_id ||
          !task.description ||
          task.content === undefined ||
          task.isNewPage === undefined ||
          !task.pagePath ||
          !Array.isArray(task.depends) ||
          !task.depends.every((d: any) => typeof d === "string")
        ) {
          throw new Error(`Invalid task object: ${JSON.stringify(task)}`);
        }
        const createdTask = await createTaskImpl(
          task.task_id,
          task.description,
          task.content,
          task.isNewPage,
          task.pagePath,
          task.depends
        );

        taskList.tasks.push(createdTask);
      }

      return taskList.tasks;
    }
    // ----------------------------
    // UNKNOWN TOOL
    // ----------------------------
    throw new Error(`Unknown function call: ${name}`);
  }
}

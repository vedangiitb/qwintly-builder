import { ValidatorIndex } from "../../../types/index/index.types.js";
import { FunctionCallingConfigMode } from "@google/genai";
import { validationNodePrompt } from "../../../ai/prompts/validationPlanNode.prompt.js";
import { plannerTools } from "../../../ai/tools/toolsets/plannerTools.js";
import { readFileImpl } from "../../../ai/tools/implementations/readFile.impl.js";
import { searchImpl } from "../../../ai/tools/implementations/search.impl.js";
import { listDirImpl } from "../../../ai/tools/implementations/listDir.impl.js";
import { runToolLoop } from "../toolLoopRunner.js";
import { BuilderNode } from "./createBuilderGraph.js";
import { parsePlannerTasksJson, parsePlannerTasksUnknown } from "./plannerTaskParser.js";

export function makeValidatorPlanNode(validatorIndex: ValidatorIndex): BuilderNode {
  return async (state) => {
    const prompt = validationNodePrompt(
      state.validationErrors ?? [],
      state.validationFixHistory ?? [],
      validatorIndex,
    );

    const result = await runToolLoop({
      initialContents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: plannerTools(),
      handlers: {
        read_file: async (args) => {
          const path = String(args.path ?? "");
          const startLine =
            args.start_line === undefined ? undefined : Number(args.start_line);
          const endLine =
            args.end_line === undefined ? undefined : Number(args.end_line);

          const content = await readFileImpl(path, startLine, endLine);
          return { path, content };
        },
        search: async (args) => {
          const results = await searchImpl(String(args.search_query ?? ""));
          return { results };
        },
        list_dir: async (args) => {
          const content = await listDirImpl(
            String(args.path ?? ""),
            Number(args.depth ?? 1),
          );
          return { content };
        },
        submit_planner_tasks: async (args) => {
          const tasks = parsePlannerTasksUnknown(args.planner_tasks);
          return { success: true, count: tasks.length };
        },
      },
      toolCallingMode: FunctionCallingConfigMode.ANY,
      terminalToolNames: ["submit_planner_tasks"],
      maxSteps: 25,
    });

    const plannerTasks =
      result.terminalCall?.name === "submit_planner_tasks"
        ? parsePlannerTasksUnknown(result.terminalCall.args.planner_tasks)
        : parsePlannerTasksJson(result.finalText);
    return { plannerTasks };
  };
}

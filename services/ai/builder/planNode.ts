import { FunctionCallingConfigMode } from "@google/genai";
import {
  createWorkspaceToolImpls,
  plannerTools,
  runToolLoop,
} from "qwintly-ai-core";
import { ProjectRequestType } from "../../../data/project.constants.js";
import { aiResponse } from "../../../infra/ai/gemini.client.js";
import { PlannerIndex } from "../../../types/index/index.types.js";
import { logger } from "../../logger/logger.service.js";
import { createAiCoreWorkspaceDeps } from "../helpers/aiCoreDeps.js";
import { planNodePrompt } from "../prompts/planNodePrompt.js";
import { BuilderNode } from "./createBuilderGraph.js";
import {
  parsePlannerTasksJson,
  parsePlannerTasksUnknown,
} from "./plannerTaskParser.js";

export function makePlanNode(
  plannerIndex: PlannerIndex,
  requestType: string,
): BuilderNode {
  return async (state) => {
    const isNewProject = requestType === ProjectRequestType.NEW;
    logger.status("AI: Generating plan…", { phase: "ai_plan" });
    const prompt = planNodePrompt({
      planTasks: state.planTasks ?? [],
      collectedContext: state.collectedContext,
      plannerIndex,
      isNewProject,
    });

    const deps = createAiCoreWorkspaceDeps();
    const { readFileImpl, searchImpl, listDirImpl } =
      createWorkspaceToolImpls(deps);

    const result = await runToolLoop({
      initialContents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: plannerTools(),
      aiCall: aiResponse as any,
      logger: deps.logger,
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

    logger.status(`AI: Plan ready (${plannerTasks.length} tasks)`, {
      phase: "ai_plan",
      progress: {
        current: plannerTasks.length,
        total: plannerTasks.length,
        unit: "tasks",
      },
    });
    logger.info("Planner tasks produced", {
      count: plannerTasks.length,
      requestType,
    });
    return { plannerTasks };
  };
}

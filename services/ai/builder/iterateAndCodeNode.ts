import {
  codegenPrompt,
  codegenTools,
  EVENT_TYPES,
} from "@vedangiitb/qwintly-core";
import { ProjectRequestType } from "../../../data/project.constants.js";
import { formatDurationMs } from "../../../utils/formatDuration.js";
import { withStatusHeartbeat } from "../../../utils/withStatusHeartbeat.js";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { persistModelRsp } from "../../project/persistModelrsp.service.js";
import { normalizeEditedFilePath } from "./applyPatchPathExtractor.js";
import { BuilderNode } from "./createBuilderGraph.js";

export function makeIterateAndCodeNode(requestType: string): BuilderNode {
  return async (state) => {
    const core = await getQwintlyCore();
    const iteration = (state.iteration ?? 0) + 1;
    const history = [...(state.validationFixHistory ?? [])];
    const editedFilesSet = new Set<string>(
      (state.editedFiles ?? []).map(normalizeEditedFilePath),
    );

    const isNewProject = requestType === ProjectRequestType.NEW;

    const tasks = state.plannerTasks ?? [];
    const totalTasks = tasks.length;

    if (totalTasks > 0) {
      await core.streamLog(
        `AI: Starting implementation (${totalTasks} tasks)`,
        EVENT_TYPES.STEP_STARTED,
      );
    }

    let taskIndex = 0;
    for (const task of tasks) {
      taskIndex += 1;
      await core.streamLog(
        `AI: Implementing task ${taskIndex}/${totalTasks} — “${task.description}”`,
        "step_started" as any,
      );

      const taskStartedAt = Date.now();
      const codegenIndex = await core.buildCodegenIdx();
      if (!codegenIndex) throw new Error("Could not build codegen index");

      const prompt = codegenPrompt({
        task,
        codegenIndex,
        collectedContext: state.collectedContext,
        isNewProject,
      });

      await withStatusHeartbeat(
        () =>
          core.runAiFlow(
            [{ role: "user", parts: [{ text: prompt }] }],
            codegenTools(),
            25,
            ["submit_codegen_done"],
            persistModelRsp,
          ),
        {
          intervalMs: 30_000,
          eventType: "step_started",
          message: (elapsedMs) =>
            `AI: Implementing task ${taskIndex}/${totalTasks} — “${task.description}” (${formatDurationMs(
              elapsedMs,
            )} elapsed)`,
        },
      );

      for (const target of task.targets ?? []) {
        history.push({ file: target, fix: task.description });
      }

      const taskElapsedMs = Date.now() - taskStartedAt;
      await core.streamLog(
        `AI: Done task ${task.description} (${taskIndex}/${totalTasks}) (${formatDurationMs(taskElapsedMs)})`,
        EVENT_TYPES.STEP_FINISHED,
        true,
      );
      console.log("Completed planner task", {
        iteration,
        taskIndex,
        totalTasks,
        description: task.description,
        elapsedMs: taskElapsedMs,
      });
    }

    return {
      iteration,
      validationFixHistory: history,
      editedFiles: Array.from(editedFilesSet),
    };
  };
}

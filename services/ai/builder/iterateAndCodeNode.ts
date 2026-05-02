import { ProjectRequestType } from "../../../data/project.constants.js";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { createWorkspaceToolImpls } from "@vedangiitb/qwintly-core";
import { codegenTools } from "@vedangiitb/qwintly-core";
import { createWorkspaceDeps } from "./workspaceDeps.service.js";
import { codegenNodePrompt } from "../prompts/codegenNodePrompt.js";
import { BuilderNode } from "./createBuilderGraph.js";
import { formatDurationMs } from "../../../utils/formatDuration.js";
import { withStatusHeartbeat } from "../../../utils/withStatusHeartbeat.js";

export function makeIterateAndCodeNode(requestType: string): BuilderNode {
  return async (state) => {
    const core = await getQwintlyCore();
    const iteration = (state.iteration ?? 0) + 1;
    const history = [...(state.validationFixHistory ?? [])];

    const deps = createWorkspaceDeps();
    const { readFileImpl, writeFileImpl, applyPatchImpl } =
      createWorkspaceToolImpls(deps);

    const isNewProject = requestType === ProjectRequestType.NEW;

    const tasks = state.plannerTasks ?? [];
    const totalTasks = tasks.length;

    if (totalTasks > 0) {
      await core.streamLog(
        `AI: Starting implementation (${totalTasks} tasks)`,
        "step_started" as any,
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

      const targetSnapshots: Array<{ path: string; content: string }> = [];
      for (const target of task.targets ?? []) {
        try {
          const content = await readFileImpl(target, 1, 200);
          targetSnapshots.push({ path: target, content });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          targetSnapshots.push({
            path: target,
            content: `read_file failed: ${message}`,
          });
        }
      }

      const snapshotBlock =
        targetSnapshots.length > 0
          ? `\n\nTARGET FILE SNAPSHOTS (first 200 lines):\n${targetSnapshots
              .map(
                (s) =>
                  `--- ${s.path} ---\n${s.content}\n--- end ${s.path} ---\n`,
              )
              .join("\n")}`
          : "";

      const prompt = codegenNodePrompt({
        task,
        codegenIndex,
        collectedContext: state.collectedContext,
        isNewProject,
      }).concat(snapshotBlock);

      await withStatusHeartbeat(
        () =>
          core.runAiFlow(
            [{ role: "user", parts: [{ text: prompt }] }],
            codegenTools(),
            {
              read_file: async (args) => {
                const path = String(args.path ?? "");
                const startLine =
                  args.start_line === undefined
                    ? undefined
                    : Number(args.start_line);
                const endLine =
                  args.end_line === undefined
                    ? undefined
                    : Number(args.end_line);

                const content = await readFileImpl(path, startLine, endLine);
                return { path, content };
              },
              write_file: async (args) => {
                const path = String(args.path ?? "");
                const content = String(args.content ?? "");
                return await writeFileImpl(path, content);
              },
              apply_patch: async (args) => {
                const patchString = String(args.patch_string ?? "");
                return await applyPatchImpl(patchString);
              },
              submit_codegen_done: async (args) => {
                return {
                  success: true,
                  summary: String(args.summary ?? "").trim(),
                };
              },
            },
            25,
            ["submit_codegen_done"],
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
        `AI: Done task ${taskIndex}/${totalTasks} (${formatDurationMs(taskElapsedMs)})`,
        "step_finished" as any,
      );
      console.log("Completed planner task", {
        iteration,
        taskIndex,
        totalTasks,
        description: task.description,
        elapsedMs: taskElapsedMs,
      });
    }

    return { iteration, validationFixHistory: history };
  };
}

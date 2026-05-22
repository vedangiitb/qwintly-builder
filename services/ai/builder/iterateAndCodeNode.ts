import {
  codegenPrompt,
  codegenTools,
  createWorkspaceToolImpls,
  EVENT_TYPES,
} from "@vedangiitb/qwintly-core";
import { ProjectRequestType } from "../../../data/project.constants.js";
import { formatDurationMs } from "../../../utils/formatDuration.js";
import { withStatusHeartbeat } from "../../../utils/withStatusHeartbeat.js";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { normalizeEditedFilePath } from "./applyPatchPathExtractor.js";
import { BuilderNode } from "./createBuilderGraph.js";
import { createWorkspaceDeps } from "./workspaceDeps.service.js";
import { persistModelRsp } from "../../project/persistModelrsp.service.js";

export function makeIterateAndCodeNode(requestType: string): BuilderNode {
  return async (state) => {
    const core = await getQwintlyCore();
    const iteration = (state.iteration ?? 0) + 1;
    const history = [...(state.validationFixHistory ?? [])];
    const editedFilesSet = new Set<string>(
      (state.editedFiles ?? []).map(normalizeEditedFilePath),
    );

    const deps = createWorkspaceDeps();
    const {
      readFileImpl,
      createNewRouteImpl,
      insertElementImpl,
      deleteElementImpl,
      updatePropsImpl,
      updateClassNameImpl,
      listDirImpl,
      updateGlobalStylesImpl,
    } = createWorkspaceToolImpls(deps);

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
              create_new_route: async (args) => {
                const parentRoute = String(args.parent_route ?? "");
                const routeName = String(args.route_name ?? "");
                const result = await createNewRouteImpl(parentRoute, routeName);
                return result;
              },
              insert_element: async (args) => {
                const route = String(args.route ?? "");
                const parent_id = String(args.parent_id ?? "");
                const element: any = args.element;
                const result = await insertElementImpl(
                  route,
                  parent_id,
                  element,
                );
                return result;
              },
              delete_element: async (args) => {
                const route = String(args.route ?? "");
                const element_id = String(args.element_id ?? "");
                const result = await deleteElementImpl(route, element_id);
                return result;
              },
              update_props: async (args) => {
                const route = String(args.route ?? "");
                const element_id = String(args.element_id ?? "");
                const props: any = args.props;
                const result = await updatePropsImpl({
                  route,
                  element_id,
                  ...props,
                });
                return result;
              },
              update_classname: async (args) => {
                const route = String(args.route ?? "");
                const element_id = String(args.element_id ?? "");
                const class_name = String(args.class_name ?? "");
                const result = await updateClassNameImpl(
                  route,
                  element_id,
                  class_name,
                );
                return result;
              },
              submit_codegen_done: async (args) => {
                return {
                  success: true,
                  summary: String(args.summary ?? "").trim(),
                };
              },
              list_dir: async (args) => {
                const content = await listDirImpl(
                  String(args.path ?? ""),
                  Number(args.depth ?? 1),
                );
                return { content };
              },
              update_global_styles: async (args) => {
                const tokens: any = args.tokens;
                const result = await updateGlobalStylesImpl({ tokens });
                return result;
              },
            },
            20,
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
        `AI: Done task ${taskIndex}/${totalTasks} (${formatDurationMs(taskElapsedMs)})`,
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

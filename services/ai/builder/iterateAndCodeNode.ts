import { codegenNodePrompt } from "../../../ai/prompts/codegenNode.prompt.js";
import { applyPatchImpl } from "../../../ai/tools/implementations/applyPatch.impl.js";
import { readFileImpl } from "../../../ai/tools/implementations/readFile.impl.js";
import { codegenTools } from "../../../ai/tools/toolsets/codegenTools.js";
import { buildCodegenIndex } from "../../indexer/codegenIndex.js";
import { runToolLoop } from "../toolLoopRunner.js";
import { BuilderNode } from "./createBuilderGraph.js";

export function makeIterateAndCodeNode(): BuilderNode {
  return async (state) => {
    const iteration = (state.iteration ?? 0) + 1;
    const history = [...(state.validationFixHistory ?? [])];

    for (const task of state.plannerTasks ?? []) {
      const codegenIndex = await buildCodegenIndex();
      if (!codegenIndex) throw new Error("Could not build codegen index");
      const prompt = codegenNodePrompt(task, codegenIndex,state.collectedContext);

        await runToolLoop({
          initialContents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: codegenTools(),
          handlers: {
          read_file: async (args) => {
            const path = String(args.path ?? "");
            const startLine =
              args.start_line === undefined
                ? undefined
                : Number(args.start_line);
            const endLine =
              args.end_line === undefined ? undefined : Number(args.end_line);

            const content = await readFileImpl(path, startLine, endLine);
            return { path, content };
          },
            apply_patch: async (args) => {
              return await applyPatchImpl(String(args.patch_string ?? ""));
            },
            submit_codegen_done: async (args) => {
              return { success: true, summary: String(args.summary ?? "").trim() };
            },
          },
          maxSteps: 25,
          terminalToolNames: ["submit_codegen_done"],
        });

        for (const target of task.targets ?? []) {
          history.push({ file: target, fix: task.description });
        }
    }

    return { iteration, validationFixHistory: history };
  };
}

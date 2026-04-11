import { codegenNodePrompt } from "../../../ai/prompts/codegenNode.prompt.js";
import { applyPatchImpl } from "../../../ai/tools/implementations/applyPatch.impl.js";
import { readFileImpl } from "../../../ai/tools/implementations/readFile.impl.js";
import { writeFileImpl } from "../../../ai/tools/implementations/writeFile.impl.js";
import { codegenTools } from "../../../ai/tools/toolsets/codegenTools.js";
import { buildCodegenIndex } from "../../indexer/codegenIndex.js";
import { runToolLoop } from "../toolLoopRunner.js";
import { BuilderNode } from "./createBuilderGraph.js";

export function makeIterateAndCodeNode(requestType: string): BuilderNode {
  return async (state) => {
    const iteration = (state.iteration ?? 0) + 1;
    const history = [...(state.validationFixHistory ?? [])];

    for (const task of state.plannerTasks ?? []) {
      const codegenIndex = await buildCodegenIndex();
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

      const prompt = codegenNodePrompt(
        task,
        codegenIndex,
        state.collectedContext,
        requestType,
      ).concat(snapshotBlock);

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
          write_file: async (args) => {
            const path = String(args.path ?? "");
            const content = String(args.content ?? "");
            return await writeFileImpl(path, content);
          },
          apply_patch: async (args) => {
            const patchString = String(args.patch_string ?? "");
            const result = await applyPatchImpl(patchString);

            if ((result as any)?.success !== false) return result;

            const error = String((result as any)?.error ?? "");
            const filePathMatches = Array.from(
              error.matchAll(
                /(?:Update|Add|Delete) File failed for "([^"]+)"/g,
              ),
            ).map((m) => m[1]);

            const uniquePaths = Array.from(new Set(filePathMatches)).slice(
              0,
              3,
            );
            const debugFiles: Array<{ path: string; head: string }> = [];

            for (const filePath of uniquePaths) {
              try {
                const head = await readFileImpl(filePath, 1, 200);
                debugFiles.push({ path: filePath, head });
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                debugFiles.push({
                  path: filePath,
                  head: `read_file failed: ${message}`,
                });
              }
            }

            return {
              ...result,
              debug: {
                files: debugFiles,
                hint:
                  "apply_patch failed because the expected context didn't match the current file. " +
                  "Regenerate the patch from the snapshots above; for large rewrites, use Delete+Add instead of Update.",
              },
            };
          },
          submit_codegen_done: async (args) => {
            return {
              success: true,
              summary: String(args.summary ?? "").trim(),
            };
          },
        },
        maxSteps: 25,
        terminalToolNames: ["submit_codegen_done"],
        applyPatchAutoRetryMax: 2,
      });

      for (const target of task.targets ?? []) {
        history.push({ file: target, fix: task.description });
      }
    }

    return { iteration, validationFixHistory: history };
  };
}

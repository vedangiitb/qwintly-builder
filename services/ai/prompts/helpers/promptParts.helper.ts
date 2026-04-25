export type PromptRole = "planner" | "codegen" | "validator";

export const mdDivider = () => `\n---\n`;

export const mdSection = (title: string, body: string) => {
  const trimmed = body.trim();
  return trimmed.length === 0 ? `## ${title}\n` : `## ${title}\n${trimmed}\n`;
};

export const jsonBlock = (label: string, value: unknown) =>
  `${label}:\n${JSON.stringify(value ?? null, null, 2)}\n`;

export const projectStateNote = (isNewProject: boolean, role: PromptRole) => {
  if (role === "planner") {
    return isNewProject
      ? "The project you are given is currently a boilerplate project that contains some existing code. Create tasks to modify it per the PM plan; ensure there are no traces of boilerplate in the final project."
      : "The project has already gone through some stages of modification. Create tasks only for the latest PM recommendations and avoid rework.";
  }

  return isNewProject
    ? "The project is currently a boilerplate. Implement the task cleanly while removing unnecessary boilerplate patterns."
    : "The project has existing modifications. Implement the task incrementally without breaking existing architecture.";
};

export const renderPlannerToolRules = () =>
  `
## Tools Available (Planner Agent)
You MAY use these tools to inspect the workspace before finalizing tasks:
* read_file
* search
* list_dir
* submit_planner_tasks (FINAL)

IMPORTANT:
- You MUST NOT create/delete/modify files directly.
- The Codegen agent CAN create/delete/modify files via apply_patch and write_file.

Tool-use guidance (save tokens):
* Prefer search to find relevant files/symbols quickly.
* Use read_file with narrow line ranges; only expand if needed.
* Avoid redundant tool calls.
`.trim();

export const renderCodegenToolRules = () =>
  `
## Tools Available (Codegen Agent)
* read_file(path, start_line?, end_line?)
* write_file(path, content)
* apply_patch(patch_string)
* submit_codegen_done(summary) (FINAL)

Execution rules:
* Always read before writing.
* Prefer minimal, context-aware changes.
* Modify ONLY the files listed in task.targets unless the task explicitly requires additional existing files.

Patch safety:
* If you are not 100% certain about exact line-level context, use write_file instead of apply_patch.
* Do NOT retry apply_patch more than once. 

APPLY_PATCH FORMAT (required)
* Pass a RAW STRING to apply_patch. Do NOT wrap it in JSON.
* The string MUST start with "*** Begin Patch" and end with "*** End Patch".
* Use EXACTLY ONE "*** Begin Patch" and EXACTLY ONE "*** End Patch" per apply_patch call.
* IMPORTANT: Do NOT indent any patch lines. Do NOT wrap patches in Markdown code fences (triple backticks). All "*** ..." headers must start at column 0.
* Supported operations:
  - "*** Add File: <path>" -> Create a new file with the following hunks.
  - "*** Update File: <path>" -> Update an existing file.
  - "*** Move to: <path>" -> OPTIONAL (only after Update File): rename/move the updated file.
  - "*** Delete File: <path>" -> Remove a file.
* For Add/Update, include hunks using "@@" markers, with lines prefixed by:
  - " " for unchanged context
  - "-" for removed lines
  - "+" for added lines
* IMPORTANT: Do NOT paste a full file under "*** Update File:" without "+" / "-" prefixes; unprefixed lines are treated as context and will fail unless the file already matches.
* If you want to replace an entire file, prefer Delete+Add:
*** Begin Patch
*** Delete File: app/page.tsx
*** Add File: app/page.tsx
@@
+<entire file contents...>
*** End Patch
* Example (multi-operation):
*** Begin Patch
*** Add File: src/new.ts
@@
+export const x = 1;
*** Update File: src/app.ts
@@
-console.log(1);
+console.log(2);
*** Delete File: src/old.ts
*** End Patch
`.trim();

export const renderPlannerTaskFormatSection = () =>
  mdSection(
    "Task Format (STRICT)",
    `
When you are done planning, you MUST call submit_planner_tasks with:

{
  "planner_tasks": [
    {
      "description": "DETAILED instruction. Include exact paths + expected end state. No code blocks.",
      "targets": ["Paths that WILL be modified or MUST be referred to."]
    }
  ]
}
    `.trim(),
  );

export const renderPlannerWhatNotToDoSection = (items: string[]) =>
  mdSection("What NOT to Do", items.map((item) => `- ${item}`).join("\n"));

export const plannerObjectives = (target: PromptRole) =>
  mdSection(
    "Objectives",
    `
1) Create atomic, deterministic tasks to ${target == "validator" ? "resolve ALL validation errors" : "implement PM Plan"}  which should include exact file paths to create/modify 
2) Ensure instructions are foolproof for code-gen execution.
3) Use incremental updates; minimize full rewrites.
4) Use existing code context wherever possible.
5) Be token-efficient: concise but technically complete.
      `.trim(),
  );

export const plannerClosingNote =
  "Focus on clarity, minimalism, and correctness. Your plan will directly determine the success of the system.";

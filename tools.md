## AI Tools

This document reflects the **current tool schemas and how they are used** in the builder (planner/codegen loops).

### 1) Read File (`read_file`)
- **Description:** Read a text file (optionally a 1-based line range).
- **Inputs:** `path` (required), `start_line` (optional), `end_line` (optional)
- **Output (typical):** `{ path, content }` or `"not found"` if missing
- **Available to:** planner, codegen, validation planning
- **Notes:** If `end_line` is omitted, the tool-loop will cap reads to ~200 lines.

### 2) Write File (`write_file`)
- **Description:** Overwrite a file with full content (creates parent folders if needed).
- **Inputs:** `path` (required), `content` (required)
- **Output:** `{ ok: true }`
- **Available to:** codegen
- **When to use:** Large rewrites or repeated `apply_patch` context mismatches.

### 3) Apply Patch (`apply_patch`)
- **Description:** Apply a patch across one or more files (add/update/delete).
- **Inputs:** `patch_string` (required)
- **Output:** `{ success: true }` or `{ success: false, error }`
- **Available to:** codegen
- **Supported operations:**
  - `*** Add File: <path>`
  - `*** Update File: <path>`
  - `*** Delete File: <path>`
- **Important rules / gotchas:**
  - `*** Update File:` must include actual `+`/`-` changes (not just a pasted file).
  - For full-file replacements, prefer **Delete+Add** or use `write_file`.

Example patch:
```text
*** Begin Patch
*** Add File: newfile.ts
@@
+const x = 1;
*** Update File: existing.ts
@@
-const y = 1;
+const y = 2;
*** Delete File: oldfile.ts
*** End Patch
```

### 4) Search (`search`)
- **Description:** Search the codebase using ripgrep (`rg`).
- **Inputs:** `search_query` (required)
- **Output (typical):** `{ results }` where each result includes file/line/content
- **Available to:** planner, validation planning

### 5) List Directory (`list_dir`)
- **Description:** List a directory structure up to a bounded depth.
- **Inputs:** `path` (required), `depth` (required, 1–3)
- **Output (typical):** `{ content }`
- **Available to:** planner, validation planning

### 6) Submit Planner Tasks (`submit_planner_tasks`)
- **Description:** Finalize planner output (ends planning phase).
- **Inputs:** `planner_tasks` (required array of `{ description, targets }`)
- **Output (typical):** `{ success: true, count }`
- **Available to:** planner

### 7) Submit Codegen Done (`submit_codegen_done`)
- **Description:** Finalize codegen output (ends codegen phase).
- **Inputs:** `summary` (required string)
- **Output (typical):** `{ success: true, summary }`
- **Available to:** codegen

### Toolset summary
- **Planner toolset:** `read_file`, `search`, `list_dir`, `submit_planner_tasks`
- **Codegen toolset:** `read_file`, `apply_patch`, `write_file`, `submit_codegen_done`

### Codegen loop behavior (Codex-like)
- The codegen loop injects a snapshot (first ~200 lines) of each `task.targets` file into the prompt.
- If `apply_patch` fails, the loop will auto-retry up to **2** times with file snapshots and a hint to use `write_file` or Delete+Add.

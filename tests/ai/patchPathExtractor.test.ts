import test from "node:test";
import assert from "node:assert/strict";
import { extractTouchedFilesFromPatch } from "../../services/ai/builder/applyPatchPathExtractor.js";

test("extractTouchedFilesFromPatch: captures add/update/delete/move", () => {
  const patch = `
*** Begin Patch
*** Add File: app/new/page.tsx
@@
+export default function Page() {}
*** Update File: app/old/page.config.ts
@@
-export const config = {}
+export const config = {}
*** Move to: app/moved/page.config.ts
*** Delete File: app/gone/page.tsx
*** End Patch
  `.trim();

  assert.deepEqual(extractTouchedFilesFromPatch(patch), [
    "app/new/page.tsx",
    "app/old/page.config.ts",
    "app/moved/page.config.ts",
    "app/gone/page.tsx",
  ]);
});


import { applyPatch } from "diff";
import { logger } from "./utils/logger.js";

const fileContent = "foo\nbar\nbaz";
const patch = "Index: a\n===================================================================\n--- a\n+++ b\n@@ -1,3 +1,3 @@\n foo\n-bar\n+bux\n baz";

let patched: string | boolean = applyPatch(fileContent, patch, { fuzzFactor: 2 });

logger.info("Diff patch result", { patched });

import fs from "fs";
import path from "path";
import { JobContext } from "../../../job/jobContext.js";
import {
    PreflightErrorList
} from "../../../types/preflightError.js";
import { stripLeadingComments, walk } from "./NextRulesValidator.js";

export const HeuristicValidator = async (
  ctx: JobContext
): Promise<PreflightErrorList> => {
  const errors: PreflightErrorList = [];

  const appDir = path.join(ctx.workspace, "app");
  if (!fs.existsSync(appDir)) return [];

  walk(appDir, (filePath) => {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return;

    const code = fs.readFileSync(filePath, "utf-8");
    const rel = path.relative(ctx.workspace, filePath);

    // ----------------------------------
    // H1: page/layout must default export
    // ----------------------------------
    if (
      /\/(page|layout)\.tsx$/.test(filePath) &&
      !/\bexport\s+default\b/.test(code)
    ) {
      errors.push({
        type: "heuristic",
        filePath: rel,
        message: "page.tsx or layout.tsx must have a default export.",
      });
    }

    // ----------------------------------
    // H2: file has JSX but no export
    // ----------------------------------
    if (
      /\.tsx$/.test(filePath) &&
      /<\w+/.test(code) &&
      !/\bexport\b/.test(code)
    ) {
      errors.push({
        type: "heuristic",
        filePath: rel,
        message: "JSX file does not export any component or value.",
      });
    }

    // ----------------------------------
    // H3: JSX inside .ts file
    // ----------------------------------
    if (filePath.endsWith(".ts") && /<\w+/.test(code)) {
      errors.push({
        type: "heuristic",
        filePath: rel,
        message: "JSX detected in .ts file; use .tsx instead.",
      });
    }

    // ----------------------------------
    // H4: duplicate 'use client'
    // ----------------------------------
    const useClientCount = (code.match(/["']use client["']/g) || []).length;

    if (useClientCount > 1) {
      errors.push({
        type: "heuristic",
        filePath: rel,
        message: 'Duplicate "use client" directives found.',
      });
    }

    // ----------------------------------
    // H5: forbidden imports in client files
    // ----------------------------------
    const hasUseClient =
      stripLeadingComments(code).startsWith('"use client"') ||
      stripLeadingComments(code).startsWith("'use client'");

    if (hasUseClient && /\b(fs|path|child_process)\b/.test(code)) {
      errors.push({
        type: "heuristic",
        filePath: rel,
        message:
          "Client component imports Node.js-only modules (fs, path, etc).",
      });
    }
  });

  return errors;
};

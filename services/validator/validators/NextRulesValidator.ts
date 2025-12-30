import { JobContext } from "../../../job/jobContext.js";
import { PreflightErrorList } from "../../../types/preflightError.js";
import fs from "fs";
import path from "path";
const HOOK_REGEX =
  /\b(useState|useEffect|useContext|useRef|useReducer|useMemo|useCallback|useRouter)\b/;

const BROWSER_API_REGEX = /\b(window|document|localStorage|sessionStorage)\b/;

// Rule 1: "use client" required when React hooks are used
// Rule 2: "use client" must be the FIRST statement
// Rule 3: Server Components must NOT use browser-only APIs
// Rule 4: app/api/**/route.ts must export HTTP methods
// Rule 5: page.tsx / layout.tsx must have a default export

export const NextRulesValidator = async (
  ctx: JobContext
): Promise<PreflightErrorList> => {
  const errors: PreflightErrorList = [];

  const appDir = path.join(ctx.workspace, "app");
  if (!fs.existsSync(appDir)) return [];

  walk(appDir, (filePath) => {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return;

    const code = fs.readFileSync(filePath, "utf-8");
    const withoutComments = stripLeadingComments(code);
    const hasUseClient =
      withoutComments.startsWith('"use client"') ||
      withoutComments.startsWith("'use client'");

    // -----------------------------
    // Rule 1 + 2: Hooks require "use client"
    // -----------------------------
    if (HOOK_REGEX.test(code) && !hasUseClient) {
      errors.push({
        type: "next",
        filePath: relative(ctx.workspace, filePath),
        message: 'React hooks used without "use client" directive.',
      });
    }

    // -----------------------------
    // Rule 3: Server component using browser APIs
    // -----------------------------
    if (!hasUseClient && BROWSER_API_REGEX.test(code)) {
      errors.push({
        type: "next",
        filePath: relative(ctx.workspace, filePath),
        message:
          "Server Component uses browser-only APIs without 'use client'.",
      });
    }

    // -----------------------------
    // Rule 4: API route must export HTTP method
    // -----------------------------
    if (
      filePath.includes(`${path.sep}app${path.sep}api${path.sep}`) &&
      filePath.endsWith("route.ts")
    ) {
      if (
        !/\bexport\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/.test(
          code
        )
      ) {
        errors.push({
          type: "next",
          filePath: relative(ctx.workspace, filePath),
          message:
            "API route does not export any HTTP method (GET, POST, etc).",
        });
      }
    }

    // -----------------------------
    // Rule 5: page/layout must have default export
    // -----------------------------
    if (
      /\/(page|layout)\.tsx$/.test(filePath) &&
      !/\bexport\s+default\b/.test(code)
    ) {
      errors.push({
        type: "next",
        filePath: relative(ctx.workspace, filePath),
        message: "page.tsx or layout.tsx missing default export.",
      });
    }
  });

  return errors;
};

export function walk(dir: string, cb: (file: string) => void) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function relative(root: string, file: string) {
  return path.relative(root, file);
}

export function stripLeadingComments(code: string): string {
  let remaining = code.trimStart();

  // Remove leading // comments
  while (remaining.startsWith("//")) {
    remaining = remaining.slice(remaining.indexOf("\n") + 1).trimStart();
  }

  // Remove leading /* */ comments
  if (remaining.startsWith("/*")) {
    const end = remaining.indexOf("*/");
    if (end !== -1) {
      remaining = remaining.slice(end + 2).trimStart();
    }
  }

  return remaining;
}

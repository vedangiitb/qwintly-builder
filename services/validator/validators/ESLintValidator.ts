import { ESLint } from "eslint";
import fs from "fs";
import path from "path";
import { JobContext } from "../../../job/jobContext.js";
import { PreflightErrorList } from "../../../types/preflightError.js";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export const ESLintValidator = async (
  ctx: JobContext
): Promise<PreflightErrorList> => {
  const errors: PreflightErrorList = [];

  const eslint = new ESLint({
    // overrideConfigFile: false,

    overrideConfig: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
          globals: {
            window: "readonly",
            document: "readonly",
          },
          parserOptions: {
            ecmaFeatures: { jsx: true },
          },
        },
        plugins: {
          // eslint-plugin-react-hooks must be available in builder image
          "react-hooks": reactHooksPlugin as any,
        },
        rules: {
          "no-undef": "error",
          "no-redeclare": "error",
          "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "off",
        },
      },
    ],
  });

  const files = collectTsFiles(path.join(ctx.workspace, "app"));
  if (files.length === 0) return [];

  const results = await eslint.lintFiles(files);

  for (const result of results) {
    for (const msg of result.messages) {
      if (msg.severity !== 2) continue;

      errors.push({
        type: "eslint",
        filePath: path.relative(ctx.workspace, result.filePath),
        message: `[${msg.ruleId}] ${msg.message}`,
      });
    }
  }

  return errors;
};

function collectTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const files: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }

  return files;
}

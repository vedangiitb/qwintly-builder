import { spawn } from "child_process";
import { JobContext } from "../../../job/jobContext.js";
import {
  PreflightErrorList
} from "../../../types/preflightError.js";

export const TypeScriptValidator = async (
  ctx: JobContext
): Promise<PreflightErrorList> => {
  return new Promise((resolve, reject) => {
    let stderr = "";

    const tsc = spawn("tsc", ["--noEmit", "--pretty", "false"], {
      cwd: ctx.workspace,
      stdio: ["ignore", "pipe", "pipe"],
    });

    tsc.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    tsc.on("error", (err) => {
      reject(err); // infra failure
    });

    tsc.on("close", (code) => {
      if (code === 0) {
        resolve([]);
        return;
      }

      const errors = parseTsErrors(stderr);
      resolve(errors);
    });
  });
};

function parseTsErrors(stderr: string): PreflightErrorList {
  const errors: PreflightErrorList = [];

  const lines = stderr.split("\n").filter(Boolean);

  for (const line of lines) {
    /**
     * Example:
     * src/app/page.tsx(12,18): error TS2339: Property 'user' does not exist on type 'Session'.
     */
    const match = line.match(/^(.*)\((\d+),(\d+)\): error TS\d+: (.*)$/);

    if (!match) continue;

    const [, filePath] = match;

    errors.push({
      type: "typescript",
      filePath: filePath.trim(),
      message: line.trim(),
    });
  }

  return errors;
}

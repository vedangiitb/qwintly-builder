import * as fs from "node:fs/promises";
import * as path from "node:path";
import { JobContext } from "../../job/jobContext.js";

export const getProjectInfoImpl = async (ctx: JobContext) => {
  try {
    const packageJsonPath = path.join(ctx.workspace, "package.json");
    const tsconfigPath = path.join(ctx.workspace, "tsconfig.json");

    let packageJson = null;
    let tsconfig = null;

    try {
      const pkgContent = await fs.readFile(packageJsonPath, "utf-8");
      packageJson = JSON.parse(pkgContent);
    } catch (e) {
      // ignore if not exists
    }

    try {
      const tsContent = await fs.readFile(tsconfigPath, "utf-8");
      tsconfig = JSON.parse(tsContent);
    } catch (e) {
      // ignore if not exists
    }

    return {
      ok: true,
      packageJson,
      tsconfig,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message ?? "Unknown error getting project info",
    };
  }
};

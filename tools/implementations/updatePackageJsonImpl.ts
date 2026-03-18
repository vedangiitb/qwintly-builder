import * as fs from "node:fs/promises";
import * as path from "node:path";
import { JobContext } from "../../job/jobContext.js";

export const updatePackageJsonImpl = async (
  ctx: JobContext,
  updates: Record<string, any>
) => {
  try {
    const packageJsonPath = path.join(ctx.workspace, "package.json");
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);
    
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === "object" && packageJson[key] && typeof packageJson[key] === "object") {
        Object.assign(packageJson[key], value);
      } else {
        packageJson[key] = value;
      }
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf-8");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? "Unknown error updating package.json" };
  }
};

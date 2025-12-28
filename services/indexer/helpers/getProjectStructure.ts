import path from "node:path";
import { readTsFiles } from "../../../infra/fs/workspace.js";
import { JobContext } from "../../../job/jobContext.js";
import {
  Page,
  ProjectStructure,
} from "../../../types/index/projectStructure/projectStructure.js";

type SectionKey = keyof ProjectStructure;

const SECTION_DIRS: Record<SectionKey, string | [string, string]> = {
  pages: ["/app", "/app/api"],
  components: "/components",
  hooks: "/hooks",
  infra: "/infra",
  lib: "/lib",
  services: "/services",
  utils: "/utils",
};

export async function getProjectStructure(
  ctx: JobContext
): Promise<ProjectStructure> {
  const result: ProjectStructure = {
    pages: [],
    components: [],
    hooks: [],
    infra: [],
    lib: [],
    services: [],
    utils: [],
  };

  await Promise.all(
    (Object.keys(SECTION_DIRS) as SectionKey[]).map(async (key) => {
      const dir = SECTION_DIRS[key];

      result[key] = Array.isArray(dir)
        ? await getPages(ctx.workspace, dir[0], dir[1])
        : await getPages(ctx.workspace, dir);
    })
  );

  return result;
}

export async function getPages(
  workspace: string,
  includeDir: string,
  excludeDir?: string
): Promise<Page[]> {
  try {
    const includePath = path.join(workspace, includeDir);

    if (!excludeDir) {
      return await readTsFiles(includePath);
    }

    const excludePath = path.join(workspace, excludeDir);

    const [included, excluded] = await Promise.all([
      readTsFiles(includePath),
      readTsFiles(excludePath),
    ]);

    const excludedSet = new Set(excluded);
    return included.filter((page) => !excludedSet.has(page));
  } catch (err) {
    throw new Error(
      `getPages failed for ${includeDir}${
        excludeDir ? ` (excluding ${excludeDir})` : ""
      } with cause ${err}`
    );
  }
}

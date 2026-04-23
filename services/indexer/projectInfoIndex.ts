import path from "node:path";
import { readFile, safeReadDir } from "../../infra/fs/workspace.js";
import { getJobContext } from "../../job/jobContext.js";
import { ContextRepository } from "../../repository/context.repository.js";
import { ProjectInfo } from "../../types/projectInfo.types.js";

type UiPage = ProjectInfo["uiPages"][number];

const SECTION_NAME_REGEX =
  /sectionName\s*:\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g;

const isRouteGroup = (segment: string) =>
  segment.startsWith("(") && segment.endsWith(")");

const isParallelRoute = (segment: string) => segment.startsWith("@");

const toPosixPath = (p: string) => p.replace(/\\/g, "/");

const extractSectionNames = (content: string): string[] => {
  if (!content) return [];

  const seen = new Set<string>();
  const results: string[] = [];

  for (const match of content.matchAll(SECTION_NAME_REGEX)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? "";
    const sectionName = raw.trim();
    if (!sectionName) continue;
    if (seen.has(sectionName)) continue;
    seen.add(sectionName);
    results.push(sectionName);
  }

  return results;
};

const computePageRouteFromSegments = (segments: string[]): string => {
  const filtered = segments.filter(
    (s) => s && !isRouteGroup(s) && !isParallelRoute(s),
  );

  if (filtered.length === 0) return "/";
  return `/${filtered.join("/")}`;
};

const computePageNameFromRoute = (pageRoute: string): string => {
  if (pageRoute === "/") return "root";
  return pageRoute.slice(1).split("/").join("-");
};

const findPageConfigFiles = async (dir: string): Promise<string[]> => {
  const entries = await safeReadDir(dir);
  const results: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isFile()) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findPageConfigFiles(fullPath)));
      continue;
    }

    if (entry.name === "page.config.ts") {
      results.push(fullPath);
    }
  }

  return results;
};

export async function computeProjectInfo(
  rootDir: string,
): Promise<ProjectInfo> {
  const effectiveRoot = rootDir;

  const appDir = path.join(effectiveRoot, "app");
  const pageConfigFiles = await findPageConfigFiles(appDir);

  const uiPages: UiPage[] = [];

  for (const filePath of pageConfigFiles) {
    const relFromApp = toPosixPath(path.relative(appDir, filePath));
    const relDir = path.posix.dirname(relFromApp);
    const segments = relDir === "." ? [] : relDir.split("/").filter(Boolean);

    if (segments.some(isParallelRoute)) {
      continue;
    }

    const pageRoute = computePageRouteFromSegments(segments);
    const pageName = computePageNameFromRoute(pageRoute);
    const description = `${pageName} page for this project`;

    const content = await readFile(filePath);
    const sectionNames = extractSectionNames(content);

    const page: UiPage = {
      pageRoute,
      pageName,
      description,
    };

    if (sectionNames.length > 0) {
      page.sections = sectionNames.map((sectionName) => ({
        sectionName,
        description: `${sectionName} section for this page`,
      }));
    }

    uiPages.push(page);
  }

  uiPages.sort((a, b) =>
    a.pageRoute.localeCompare(b.pageRoute, undefined, {
      sensitivity: "base",
    }),
  );

  return {
    uiPages,
    lastUpdatedPlanVersion: 1,
  };
}

export async function buildProjectInfo(): Promise<ProjectInfo> {
  const ctx = getJobContext();
  const projectInfo = await computeProjectInfo(ctx.workspace);

  const repo = new ContextRepository();
  await repo.updateProjectInfo(ctx.chatId, projectInfo);

  return projectInfo;
}

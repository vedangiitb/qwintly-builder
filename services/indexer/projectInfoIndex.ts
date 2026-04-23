import path from "node:path";
import { readFile, safeReadDir } from "../../infra/fs/workspace.js";
import { getJobContext } from "../../job/jobContext.js";
import { ContextRepository } from "../../repository/context.repository.js";
import { ProjectInfo } from "../../types/projectInfo.types.js";

type UiPage = ProjectInfo["uiPages"][number];

const isRouteGroup = (segment: string) =>
  segment.startsWith("(") && segment.endsWith(")");

const isParallelRoute = (segment: string) => segment.startsWith("@");

const toPosixPath = (p: string) => p.replace(/\\/g, "/");

const extractQuotedString = (match: RegExpMatchArray | null): string => {
  if (!match) return "";
  return String(match[1] ?? match[2] ?? match[3] ?? "").trim();
};

const extractPropString = (objText: string, prop: "id" | "type"): string => {
  const re =
    prop === "id"
      ? /\bid\s*:\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/
      : /\btype\s*:\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/;

  return extractQuotedString(objText.match(re));
};

const sectionNameFromId = (id: string): string => {
  if (!id) return "";
  if (id.endsWith("-section")) return id.slice(0, -"-section".length);
  if (id.endsWith("-container")) return id.slice(0, -"-container".length);
  return id;
};

const extractDirectContainerIdsFromArrayText = (arrayText: string): string[] => {
  const seen = new Set<string>();
  const results: string[] = [];

  let bracketDepth = 0;
  const objectStartStack: number[] = [];
  let inString: '"' | "'" | "`" | null = null;

  for (let i = 0; i < arrayText.length; i++) {
    const ch = arrayText[i]!;

    if (inString) {
      if (inString !== "`" && ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth -= 1;
      continue;
    }

    if (ch === "{") {
      if (bracketDepth >= 1) objectStartStack.push(i);
      continue;
    }

    if (ch === "}") {
      const start = objectStartStack.pop();
      if (start === undefined) continue;

      // only consider objects that are direct children of the current array
      if (bracketDepth !== 1 || objectStartStack.length !== 0) continue;

      const objText = arrayText.slice(start, i + 1);
      const id = extractPropString(objText, "id");
      const type = extractPropString(objText, "type");

      if (type === "container" && id && id !== "root" && !seen.has(id)) {
        seen.add(id);
        results.push(id);
      }

      continue;
    }
  }

  return results;
};

const extractRootChildSectionNames = (rootObjText: string): string[] => {
  const childrenKey = rootObjText.indexOf("children");
  if (childrenKey < 0) return [];

  const arrayStart = rootObjText.indexOf("[", childrenKey);
  if (arrayStart < 0) return [];

  // isolate the children array text (including brackets)
  let bracketDepth = 0;
  let inString: '"' | "'" | "`" | null = null;

  for (let i = arrayStart; i < rootObjText.length; i++) {
    const ch = rootObjText[i]!;

    if (inString) {
      if (inString !== "`" && ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "[") bracketDepth += 1;
    if (ch === "]") {
      bracketDepth -= 1;
      if (bracketDepth === 0) {
        const arrayText = rootObjText.slice(arrayStart, i + 1);
        const ids = extractDirectContainerIdsFromArrayText(arrayText);
        return ids
          .map(sectionNameFromId)
          .filter(Boolean);
      }
    }
  }

  return [];
};

const extractSectionNamesFromConfig = (content: string): string[] => {
  console.log(content)
  if (!content) return [];

  const elementsKey = content.indexOf("elements");
  if (elementsKey < 0) return [];

  const arrayStart = content.indexOf("[", elementsKey);
  if (arrayStart < 0) return [];

  const seen = new Set<string>();
  const results: string[] = [];

  let bracketDepth = 0;
  const objectStartStack: number[] = [];
  let inString: '"' | "'" | "`" | null = null;

  for (let i = arrayStart; i < content.length; i++) {
    const ch = content[i]!;

    if (inString) {
      if (inString !== "`" && ch === "\\") {
        i += 1;
        continue;
      }

      if (ch === inString) {
        inString = null;
      }

      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth -= 1;
      if (bracketDepth <= 0) break;
      continue;
    }

    if (ch === "{") {
      if (bracketDepth >= 1) {
        objectStartStack.push(i);
      }
      continue;
    }

    if (ch === "}") {
      const objectStart = objectStartStack.pop();
      if (bracketDepth >= 1 && objectStart !== undefined) {
        const objText = content.slice(objectStart, i + 1);
        const id = extractPropString(objText, "id");
        const type = extractPropString(objText, "type");

        if (type === "container" && id === "root") {
          const rootSections = extractRootChildSectionNames(objText);
          if (rootSections.length > 0) {
            return rootSections;
          }
        }

        if (
          type === "container" &&
          id &&
          id !== "root" &&
          (id.endsWith("-section") || id.endsWith("-container"))
        ) {
          const sectionName = sectionNameFromId(id);
          if (sectionName && !seen.has(sectionName)) {
            seen.add(sectionName);
            results.push(sectionName);
          }
        }
      }
      continue;
    }
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
    const sectionNames = extractSectionNamesFromConfig(content);

    console.log(sectionNames)

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

  console.log(projectInfo)

  const repo = new ContextRepository();
  await repo.updateProjectInfo(ctx.chatId, projectInfo);

  return projectInfo;
}

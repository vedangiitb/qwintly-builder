import { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { projectConfigs } from "../../../data/configs.constants.js";
import { filterDescription, readFile } from "../../../infra/fs/workspace.js";
import { JobContext } from "../../../job/jobContext.js";
import { ProjectIndex } from "../../../types/index/projectIndex.js";
// import { FileEntry, TreeEntry } from "../../../types/index/projectStructure.js";
import { FileEntry, TreeEntry } from "../../../types/index/projectIndex.js";

const TEXT_EXTENSIONS = new Set(
  projectConfigs.indexing.includeExtensions.map((ext) => ext.toLowerCase()),
);

const EXCLUDED_DIRS = new Set(
  projectConfigs.indexing.excludeDirectories.map((d) => d.toLowerCase()),
);

const MAX_FILE_BYTES = projectConfigs.indexing.maxFileBytes;

const isExcludedDir = (dirName: string) =>
  EXCLUDED_DIRS.has(dirName.toLowerCase());

const toFileEntry = async (
  filePath: string,
  kind?: string,
): Promise<FileEntry> => {
  const ext = path.extname(filePath).toLowerCase();

  return {
    name: path.basename(filePath),
    path: filePath,
    ext,
    kind,
  };
};

const getBaseDir = async (workspace: string) => {
  const rootApp = path.join(workspace, "app");
  try {
    await fs.access(rootApp);
    return workspace;
  } catch {
    // fall through
  }

  const srcApp = path.join(workspace, "src", "app");
  try {
    await fs.access(srcApp);
    return path.join(workspace, "src");
  } catch {
    return workspace;
  }
};

export async function buildProjectIndex(
  ctx: JobContext,
): Promise<ProjectIndex> {
  const baseDir = await getBaseDir(ctx.workspace);
  const folderTree = await buildFolderTree(ctx.workspace, baseDir);
  const enrichedTree = await enrichTree(ctx, folderTree, baseDir);

  const legend = {
    isDir: "true=folder, false=file",
    depth: "nesting level from project root (0=top)",
    path: "workspace-relative path",
    ext: "file extension",
    summary: "short semantic summary (generated)",
    dependencies: "import/require/@import targets",
    exports: "exported identifiers",
    tags: "quick labels for filtering",
    route: "app route path (for page.tsx only)",
    kind: {
      app: "Next.js app directory",
      route: "app route page.tsx",
      layout: "app layout.tsx",
      template: "app template.tsx",
      loading: "app loading.tsx",
      error: "app error.tsx",
      "not-found": "app not-found.tsx",
      component: "UI component",
      hook: "custom hook",
      provider: "context/provider",
      style: "styles",
      lib: "shared logic",
      util: "helpers",
      service: "client service",
      store: "state store",
      type: "types",
      data: "static data",
      config: "config file",
      asset: "bundled asset",
      "public-asset": "public asset",
      tests: "test folder/file",
      folder: "other folder",
      file: "other file",
      "api-route": "server route.ts (should be avoided)",
    },
  };

  return { folderTree: enrichedTree, legend };
}

const buildFolderTree = async (
  rootDir: string,
  baseDir: string,
): Promise<TreeEntry[]> => {
  const entries: TreeEntry[] = [];

  const walk = async (dir: string, depth: number) => {
    let dirEntries: Dirent[] = [];
    try {
      dirEntries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of dirEntries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (isExcludedDir(entry.name)) continue;
        const rel = path.relative(rootDir, fullPath).replace(/\\/g, "/");
        entries.push({
          name: entry.name,
          path: `/${rel}`,
          isDir: true,
          depth,
          kind: inferKindFromPath(fullPath, baseDir, true),
        });
        await walk(fullPath, depth + 1);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) continue;
        const fileEntry = await toFileEntry(
          fullPath,
          inferKindFromPath(fullPath, baseDir, false),
        );
        const rel = path.relative(rootDir, fullPath).replace(/\\/g, "/");
        entries.push({
          ...fileEntry,
          path: `/${rel}`,
          isDir: false,
          depth,
        });
      }
    }
  };

  await walk(rootDir, 0);
  return entries;
};

const inferKindFromPath = (
  fullPath: string,
  baseDir: string,
  isDir: boolean,
): string => {
  const normalized = fullPath.replace(/\\/g, "/");
  const rel = path.relative(baseDir, fullPath).replace(/\\/g, "/");

  if (isDir) {
    if (rel.startsWith("app")) return "app";
    if (rel.startsWith("components")) return "components";
    if (rel.startsWith("hooks")) return "hooks";
    if (rel.startsWith("providers")) return "providers";
    if (rel.startsWith("styles")) return "styles";
    if (rel.startsWith("lib")) return "lib";
    if (rel.startsWith("utils")) return "utils";
    if (rel.startsWith("services")) return "services";
    if (rel.startsWith("store")) return "store";
    if (rel.startsWith("types")) return "types";
    if (rel.startsWith("data")) return "data";
    if (rel.startsWith("config")) return "config";
    if (rel.startsWith("assets")) return "assets";
    if (rel.startsWith("public")) return "public";
    if (rel.startsWith("tests") || rel.startsWith("__tests__")) return "tests";
    return "folder";
  }

  const fileName = path.basename(normalized);
  if (normalized.includes("/app/")) {
    if (fileName.startsWith("page.")) return "route";
    if (fileName.startsWith("layout.")) return "layout";
    if (fileName.startsWith("template.")) return "template";
    if (fileName.startsWith("loading.")) return "loading";
    if (fileName.startsWith("error.")) return "error";
    if (fileName.startsWith("not-found.")) return "not-found";
    if (fileName.startsWith("route.")) return "api-route";
  }

  if (normalized.includes("/components/")) return "component";
  if (normalized.includes("/hooks/")) return "hook";
  if (normalized.includes("/providers/")) return "provider";
  if (normalized.includes("/styles/")) return "style";
  if (normalized.includes("/lib/")) return "lib";
  if (normalized.includes("/utils/")) return "util";
  if (normalized.includes("/services/")) return "service";
  if (normalized.includes("/store/")) return "store";
  if (normalized.includes("/types/")) return "type";
  if (normalized.includes("/data/")) return "data";
  if (normalized.includes("/config/")) return "config";
  if (normalized.includes("/public/")) return "public-asset";
  if (normalized.includes("/assets/")) return "asset";
  return "file";
};

const normalizePath = (ctx: JobContext, filePath: string) => {
  const rel = path.relative(ctx.workspace, filePath);
  return rel.startsWith("..") ? filePath : "/" + rel.replace(/\\/g, "/");
};

const resolveEntryPath = (workspace: string, entryPath: string): string => {
  if (!entryPath) return "";
  const rel = entryPath.replace(/^[\/\\]+/, "");
  return path.join(workspace, rel);
};

const extractDependencies = (content: string): string[] => {
  const deps = new Set<string>();
  const importRegex =
    /import\s+[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  const cssImportRegex = /@import\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content))) {
    const dep = match[1] || match[2] || match[3];
    if (dep) deps.add(dep);
  }
  while ((match = cssImportRegex.exec(content))) {
    if (match[1]) deps.add(match[1]);
  }
  return Array.from(deps);
};

const extractExports = (content: string): string[] => {
  const exports = new Set<string>();
  const exportRegex =
    /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*([A-Za-z0-9_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = exportRegex.exec(content))) {
    if (match[1]) exports.add(match[1]);
  }
  return Array.from(exports);
};

const summarizeFile = (
  filePath: string,
  content: string,
  kind: string | undefined,
  routePath: string | undefined,
) => {
  const desc = filterDescription(content);
  if (desc) return desc;
  if (kind === "route" && routePath) {
    return `Route file for ${routePath}.`;
  }
  const exports = extractExports(content);
  if (exports.length > 0) {
    return `Exports: ${exports.slice(0, 6).join(", ")}.`;
  }
  return `Source file: ${filePath}`;
};

const inferRoutePath = (filePath: string): string | undefined => {
  const normalized = filePath.replace(/\\/g, "/");
  const appIndex = normalized.indexOf("/app/");
  if (appIndex === -1) return undefined;
  const relative = normalized.slice(appIndex + "/app/".length);
  const segments = relative.split("/");
  const fileName = segments.pop() ?? "";
  if (!fileName.startsWith("page.")) return undefined;

  const routeSegments = segments
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .map((segment) => {
      if (segment.startsWith("[[...") && segment.endsWith("]]")) {
        const name = segment.slice(5, -2);
        return `:${name}?`;
      }
      if (segment.startsWith("[...") && segment.endsWith("]")) {
        const name = segment.slice(4, -1);
        return `:${name}*`;
      }
      if (segment.startsWith("[") && segment.endsWith("]")) {
        const name = segment.slice(1, -1);
        return `:${name}`;
      }
      return segment;
    });

  if (routeSegments.length === 0) return "/";
  return "/" + routeSegments.join("/");
};

const buildTags = (filePath: string, kind?: string): string[] => {
  const tags: string[] = [];
  if (kind) tags.push(kind);
  if (filePath.includes("/app/")) tags.push("app");
  if (filePath.includes("/app/api/")) tags.push("backend");
  if (filePath.endsWith(".tsx")) tags.push("tsx");
  if (filePath.endsWith(".ts")) tags.push("ts");
  if (filePath.endsWith(".css")) tags.push("css");
  if (filePath.endsWith(".md") || filePath.endsWith(".mdx")) tags.push("docs");
  return tags;
};

const enrichTree = async (
  ctx: JobContext,
  folderTree: TreeEntry[],
  baseDir: string,
): Promise<TreeEntry[]> => {
  const enriched: TreeEntry[] = [];

  for (const entry of folderTree) {
    if (entry.isDir) {
      enriched.push(entry);
      continue;
    }

    const filePath = resolveEntryPath(ctx.workspace, entry.path);
    const ext = path.extname(filePath).toLowerCase();
    if (!filePath || !TEXT_EXTENSIONS.has(ext)) {
      enriched.push(entry);
      continue;
    }

    const content = await readFile(filePath);
    if (!content) {
      enriched.push(entry);
      continue;
    }
    if (Buffer.byteLength(content, "utf-8") > MAX_FILE_BYTES) {
      enriched.push(entry);
      continue;
    }

    const indexPath = normalizePath(ctx, filePath);
    const kind = entry.kind || inferKindFromPath(filePath, baseDir, false);
    const routePath = kind === "route" ? inferRoutePath(indexPath) : undefined;

    enriched.push({
      ...entry,
      kind,
      summary: summarizeFile(indexPath, content, kind, routePath),
      dependencies: extractDependencies(content),
      exports: extractExports(content),
      tags: buildTags(indexPath, kind),
      route: routePath,
    });
  }

  return enriched;
};

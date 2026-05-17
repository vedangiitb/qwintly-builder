import fs from "node:fs/promises";
import path from "node:path";
import type { PageConfig, Snapshot } from "../../types/snapshot.js";

async function pathExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function isRouteGroupSegment(segment: string) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function routeFromAppDir(appRoot: string, dirAbsPath: string) {
  const rel = path.relative(appRoot, dirAbsPath);
  if (!rel || rel === ".") return "/";

  const parts = rel.split(path.sep).filter(Boolean).filter((seg) => {
    if (isRouteGroupSegment(seg)) return false;
    if (seg.startsWith("@")) return false; // parallel routes
    return true;
  });

  return `/${parts.join("/")}`;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function walkDirs(rootAbs: string): Promise<string[]> {
  const dirs: string[] = [];
  const queue: string[] = [rootAbs];

  while (queue.length) {
    const current = queue.shift()!;
    dirs.push(current);

    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      queue.push(path.join(current, entry.name));
    }
  }

  return dirs;
}

export async function buildSnapshotFromWorkspace(
  workspace: string,
): Promise<Snapshot> {
  const appRoot = path.join(workspace, "app");
  if (!(await pathExists(appRoot))) {
    throw new Error(`Missing Next.js app directory at "${appRoot}"`);
  }

  const routes: Record<string, PageConfig> = {};
  const allDirs = await walkDirs(appRoot);

  for (const dirAbs of allDirs) {
    const pageTsx = path.join(dirAbs, "page.tsx");
    const pageConfigJson = path.join(dirAbs, "pageConfig.json");

    const hasPage = await pathExists(pageTsx);
    const hasConfig = await pathExists(pageConfigJson);
    if (!hasPage || !hasConfig) continue;

    const routeKey = routeFromAppDir(appRoot, dirAbs);
    const pageConfig = await readJsonFile<PageConfig>(pageConfigJson);
    routes[routeKey] = pageConfig;
  }

  return { routes };
}

import fs from "fs";
import path from "path";
import ts from "typescript";
import { Snapshot } from "../../types/snapshot.js";
import { evalStaticTsExpression } from "./tsStaticEval.js";

function toPosixPath(p: string) {
  return p.replace(/\\/g, "/");
}

function isRouteGroupSegment(seg: string) {
  return seg.startsWith("(") && seg.endsWith(")");
}

function appFolderToRoutePath(appRelativeFolder: string): string | null {
  const rel = toPosixPath(appRelativeFolder).replace(/^\/+|\/+$/g, "");
  if (!rel) return "/";

  const rawSegments = rel.split("/").filter(Boolean);
  if (rawSegments.some((s) => s.startsWith("@"))) return null;

  const segments = rawSegments.filter((s) => !isRouteGroupSegment(s));
  const route = "/" + segments.join("/");
  return route === "/" ? "/" : route.replace(/\/+$/g, "");
}

function tryReadUtf8(filePath: string) {
  return fs.readFileSync(filePath, "utf-8");
}

function findExportedConfigInitializer(
  sourceFile: ts.SourceFile,
): ts.Expression | null {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const isExported = !!stmt.modifiers?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) continue;

    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== "config") continue;
      if (!decl.initializer) return null;
      return decl.initializer;
    }
  }

  return null;
}

function parsePageConfigTs(pageConfigPath: string) {
  const code = tryReadUtf8(pageConfigPath);
  const sourceFile = ts.createSourceFile(
    pageConfigPath,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const init = findExportedConfigInitializer(sourceFile);
  if (!init) {
    throw new Error(
      `Failed to build snapshot: missing exported "config" in ${pageConfigPath}`,
    );
  }

  const evaluated = evalStaticTsExpression(init, sourceFile);
  if (
    !evaluated ||
    typeof evaluated !== "object" ||
    !("elements" in (evaluated as Record<string, unknown>))
  ) {
    throw new Error(
      `Failed to build snapshot: exported "config" must be an object with "elements" in ${pageConfigPath}`,
    );
  }

  return evaluated as { elements: unknown };
}

function* walkDirs(rootDir: string): Generator<string> {
  const stack = [rootDir];

  while (stack.length) {
    const dir = stack.pop()!;
    yield dir;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name === "node_modules" || e.name === ".next") continue;
      stack.push(path.join(dir, e.name));
    }
  }
}

export async function buildSnapshotFromWorkspace(
  workspaceRoot: string,
): Promise<Snapshot> {
  const appRoot = path.join(workspaceRoot, "app");
  if (!fs.existsSync(appRoot)) {
    throw new Error(`Workspace missing "app" directory at "${appRoot}"`);
  }

  const routes: Snapshot["routes"] = {};

  for (const dir of walkDirs(appRoot)) {
    const pageTsx = path.join(dir, "page.tsx");
    const pageConfigTs = path.join(dir, "page.config.ts");

    if (!fs.existsSync(pageTsx) || !fs.existsSync(pageConfigTs)) continue;

    const relFolder = path.relative(appRoot, dir);
    const routePath = appFolderToRoutePath(relFolder);
    if (!routePath) continue;

    const parsed = parsePageConfigTs(pageConfigTs);
    routes[routePath] = { elements: parsed.elements as any };
  }

  return { routes };
}


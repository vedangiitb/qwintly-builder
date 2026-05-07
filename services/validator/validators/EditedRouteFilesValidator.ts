import fs from "fs";
import path from "path";
import { getJobContext } from "../../../job/jobContext.js";
import { PreflightErrorList } from "../../../types/preflightError.js";

function normalizeEditedPath(p: string): string {
  const trimmed = p.trim().replace(/\\/g, "/");
  if (trimmed.startsWith("./")) return trimmed.slice(2);
  return trimmed;
}

function isUnderAppDir(p: string): boolean {
  const normalized = normalizeEditedPath(p);
  return normalized === "app" || normalized.startsWith("app/");
}

function isPageConfig(p: string): boolean {
  return normalizeEditedPath(p).endsWith("/page.config.ts");
}

function isPageTsx(p: string): boolean {
  return normalizeEditedPath(p).endsWith("/page.tsx");
}

function workspacePathForEditedFile(workspaceRoot: string, editedPath: string) {
  const normalized = normalizeEditedPath(editedPath);
  return path.join(workspaceRoot, ...normalized.split("/"));
}

function hasOnlyRenderElementJsx(tsx: string): boolean {
  const tags = [...tsx.matchAll(/<\s*([A-Za-z][A-Za-z0-9]*)\b/g)].map(
    (m) => m[1],
  );
  return tags.every((tag) => tag === "RenderElement");
}

export const EditedRouteFilesValidator = async (
  editedFiles: string[],
): Promise<PreflightErrorList> => {
  const ctx = getJobContext();
  const errors: PreflightErrorList = [];

  const targets = (editedFiles ?? [])
    .map(normalizeEditedPath)
    .filter((p) => isUnderAppDir(p) && (isPageConfig(p) || isPageTsx(p)));

  for (const relPath of targets) {
    const absPath = workspacePathForEditedFile(ctx.workspace, relPath);
    if (!fs.existsSync(absPath)) continue;

    const code = fs.readFileSync(absPath, "utf-8");

    if (isPageConfig(relPath)) {
      if (!/import\s+type\s+\{\s*BuilderElement\s*\}\s+from\s+["']@\/types\/elements["']\s*;?/.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            'page.config.ts must include: import type { BuilderElement } from "@/types/elements";',
        });
      }

      if (!/export\s+const\s+config\s*=\s*\{/.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message: "page.config.ts must export: export const config = { ... }",
        });
      }

      if (!/elements\s*:\s*\[/.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message: "page.config.ts config must include: elements: [ ... ]",
        });
      }

      if (
        !/satisfies\s*\{\s*elements\s*:\s*BuilderElement\[\]\s*\}/m.test(code)
      ) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            "page.config.ts must end with: satisfies { elements: BuilderElement[] } (strict typing required).",
        });
      }

      if (/<\s*[A-Za-z]/.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            "page.config.ts must not include JSX. Define UI using structured config only.",
        });
      }

      if (/onClick\s*:\s*(\(|[^,}\n]*=>)/.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            "page.config.ts must not use function-style onClick handlers; use declarative OnClickAction objects.",
        });
      }
    }

    if (isPageTsx(relPath)) {
      if (
        !/import\s*\{\s*config\s*\}\s*from\s*["']\.\/page\.config["']\s*;?/.test(
          code,
        )
      ) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message: 'page.tsx must import config from "./page.config".',
        });
      }

      if (
        !/import\s*\{\s*RenderElement\s*\}\s*from\s*["']@\/lib\/renderer\/RenderElement["']\s*;?/.test(
          code,
        )
      ) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            'page.tsx must import RenderElement from "@/lib/renderer/RenderElement".',
        });
      }

      if (!/export\s+default\s+function\s+Page\s*\(\s*\)\s*\{/.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message: "page.tsx must export default function Page().",
        });
      }

      if (!/config\.elements\s*\.map\s*\(\s*\(\s*el\s*\)\s*=>\s*</m.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            "page.tsx must render config.elements via config.elements.map((el) => <RenderElement ... />).",
        });
      }

      if (
        !/config\.elements\s*\.map\s*\(\s*\(\s*el\s*\)\s*=>\s*<\s*RenderElement\b[\s\S]*?key\s*=\s*\{\s*el\.id\s*\}[\s\S]*?el\s*=\s*\{\s*el\s*\}[\s\S]*?\/>\s*\)\s*;?/m.test(
          code,
        )
      ) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            "page.tsx must exactly map elements to <RenderElement key={el.id} el={el} />.",
        });
      }

      if (!hasOnlyRenderElementJsx(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            "page.tsx must not include JSX other than <RenderElement ... />.",
        });
      }

      if (/\bfunction\s+RenderElement\s*\(|\bconst\s+RenderElement\s*=/.test(code)) {
        errors.push({
          type: "ui-config",
          filePath: relPath,
          message:
            "page.tsx must not define RenderElement locally; import it from the shared renderer.",
        });
      }
    }
  }

  return errors;
};


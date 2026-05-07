import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { setJobContext } from "../../job/jobContext.js";
import { EditedRouteFilesValidator } from "../../services/validator/validators/EditedRouteFilesValidator.js";

function write(workspace: string, rel: string, content: string) {
  const abs = path.join(workspace, ...rel.split("/"));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
}

test("EditedRouteFilesValidator: passes for valid page.tsx + page.config.ts", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));
  setJobContext({ workspace } as any);

  write(
    workspace,
    "app/x/page.config.ts",
    `
import type { BuilderElement } from "@/types/elements";

export const config = {
  elements: [
    {
      id: "root",
      type: "div",
      className: "p-4",
      children: [{ id: "t1", type: "text", props: { text: "Hello" } }],
    },
  ],
} satisfies { elements: BuilderElement[] };
    `.trim(),
  );

  write(
    workspace,
    "app/x/page.tsx",
    `
import { config } from "./page.config";
import { RenderElement } from "@/lib/renderer/RenderElement";

export default function Page() {
  return config.elements.map((el) => <RenderElement key={el.id} el={el} />);
}
    `.trim(),
  );

  const errors = await EditedRouteFilesValidator([
    "app/x/page.tsx",
    "app/x/page.config.ts",
  ]);
  assert.equal(errors.length, 0);
});

test("EditedRouteFilesValidator: flags missing satisfies in page.config.ts", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));
  setJobContext({ workspace } as any);

  write(
    workspace,
    "app/y/page.config.ts",
    `
import type { BuilderElement } from "@/types/elements";
export const config = { elements: [] };
    `.trim(),
  );

  const errors = await EditedRouteFilesValidator(["app/y/page.config.ts"]);
  assert.ok(errors.some((e) => e.message.includes("satisfies")));
});

test("EditedRouteFilesValidator: flags JSX in page.config.ts", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));
  setJobContext({ workspace } as any);

  write(
    workspace,
    "app/z/page.config.ts",
    `
import type { BuilderElement } from "@/types/elements";
export const config = { elements: [] } satisfies { elements: BuilderElement[] };
const x = <div />;
    `.trim(),
  );

  const errors = await EditedRouteFilesValidator(["app/z/page.config.ts"]);
  assert.ok(errors.some((e) => e.message.toLowerCase().includes("jsx")));
});

test("EditedRouteFilesValidator: flags non-template page.tsx", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));
  setJobContext({ workspace } as any);

  write(
    workspace,
    "app/w/page.tsx",
    `
export default function Page() {
  return <div>hi</div>;
}
    `.trim(),
  );

  const errors = await EditedRouteFilesValidator(["app/w/page.tsx"]);
  assert.ok(errors.length > 0);
});


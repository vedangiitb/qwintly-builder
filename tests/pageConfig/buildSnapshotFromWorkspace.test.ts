import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { buildSnapshotFromWorkspace } from "../../services/pageConfig/snapshotBuilder.js";

function write(workspace: string, rel: string, content: string) {
  const abs = path.join(workspace, ...rel.split("/"));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
}

const validConfig = `
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
`.trim();

const validPage = `
import { config } from "./page.config";
import { RenderElement } from "@/lib/renderer/RenderElement";

export default function Page() {
  return config.elements.map((el) => <RenderElement key={el.id} el={el} />);
}
`.trim();

test("buildSnapshotFromWorkspace: collects root and nested routes", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));

  write(workspace, "app/page.config.ts", validConfig);
  write(workspace, "app/page.tsx", validPage);
  write(workspace, "app/about/page.config.ts", validConfig);
  write(workspace, "app/about/page.tsx", validPage);

  const snapshot = await buildSnapshotFromWorkspace(workspace);
  assert.ok(snapshot.routes["/"]);
  assert.ok(snapshot.routes["/about"]);
  assert.equal(Array.isArray(snapshot.routes["/"].elements), true);
});

test("buildSnapshotFromWorkspace: ignores Next.js route groups in URL path", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));

  write(workspace, "app/(marketing)/pricing/page.config.ts", validConfig);
  write(workspace, "app/(marketing)/pricing/page.tsx", validPage);

  const snapshot = await buildSnapshotFromWorkspace(workspace);
  assert.ok(snapshot.routes["/pricing"]);
});

test("buildSnapshotFromWorkspace: skips parallel routes (@segment)", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));

  write(workspace, "app/@auth/signin/page.config.ts", validConfig);
  write(workspace, "app/@auth/signin/page.tsx", validPage);

  const snapshot = await buildSnapshotFromWorkspace(workspace);
  assert.equal(Object.keys(snapshot.routes).length, 0);
});

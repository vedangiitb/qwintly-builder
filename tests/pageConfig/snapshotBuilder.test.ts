import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { buildSnapshotFromWorkspace } from "../../services/pageConfig/snapshotBuilder.js";
import { defaultStyleConfigJson } from "../../types/styleConfig.js";

function write(workspace: string, rel: string, content: string) {
  const abs = path.join(workspace, ...rel.split("/"));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
}

test("buildSnapshotFromWorkspace: collects pageConfig.json for each route", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));

  write(
    workspace,
    "app/styleConfig.json",
    JSON.stringify(defaultStyleConfigJson),
  );
  write(workspace, "app/page.tsx", "export default function Page(){return null}");
  write(
    workspace,
    "app/pageConfig.json",
    JSON.stringify({ elements: [{ id: "root", type: "div" }] }),
  );

  write(
    workspace,
    "app/about/page.tsx",
    "export default function Page(){return null}",
  );
  write(
    workspace,
    "app/about/pageConfig.json",
    JSON.stringify({
      elements: [{ id: "about", type: "text", props: { text: "About" } }],
    }),
  );

  const snapshot = await buildSnapshotFromWorkspace(workspace);

  assert.deepEqual(Object.keys(snapshot.routes).sort((a, b) => a.localeCompare(b)), ["/", "/about"]);
  assert.equal(snapshot.routes["/"]?.elements?.[0]?.id, "root");
  assert.equal(snapshot.routes["/about"]?.elements?.[0]?.id, "about");
  assert.deepEqual(snapshot.styleConfig, defaultStyleConfigJson);
});

test("buildSnapshotFromWorkspace: ignores route groups (parentheses) in route key", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));

  write(
    workspace,
    "app/styleConfig.json",
    JSON.stringify(defaultStyleConfigJson),
  );
  write(
    workspace,
    "app/(marketing)/pricing/page.tsx",
    "export default function Page(){return null}",
  );
  write(
    workspace,
    "app/(marketing)/pricing/pageConfig.json",
    JSON.stringify({ elements: [{ id: "pricing", type: "div" }] }),
  );

  const snapshot = await buildSnapshotFromWorkspace(workspace);
  assert.ok(snapshot.routes["/pricing"]);
  assert.deepEqual(snapshot.styleConfig, defaultStyleConfigJson);
});

test("buildSnapshotFromWorkspace: only includes folders with both page.tsx and pageConfig.json", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "qwintly-"));

  write(
    workspace,
    "app/styleConfig.json",
    JSON.stringify(defaultStyleConfigJson),
  );
  write(
    workspace,
    "app/x/page.tsx",
    "export default function Page(){return null}",
  );
  write(
    workspace,
    "app/y/pageConfig.json",
    JSON.stringify({ elements: [] }),
  );

  const snapshot = await buildSnapshotFromWorkspace(workspace);
  assert.deepEqual(snapshot.routes, {});
  assert.deepEqual(snapshot.styleConfig, defaultStyleConfigJson);
});

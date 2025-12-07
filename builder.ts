process.on("SIGTERM", () => {
  console.log("🔌 Builder received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

import fs from "fs";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import child_process from "child_process";

console.log("🚀 Builder container started");

// Workspace folder
const WORKDIR = "/workspace";
fs.mkdirSync(WORKDIR, { recursive: true });

// Location where templates live inside builder container
// You will mount or bake these inside Docker later
const TEMPLATE_DIR = "/templates";

function safePath(p: string): string {
  const resolved = path.resolve(WORKDIR, p);
  if (!resolved.startsWith(WORKDIR)) {
    throw new Error("Path escape detected");
  }
  return resolved;
}

function applyPatch(filePath: string, diff: string) {
  const tempPatch = "/tmp/patch.diff";
  fs.writeFileSync(tempPatch, diff);

  try {
    child_process.execSync(`patch ${filePath} ${tempPatch}`, {
      stdio: "pipe",
    });
    return true;
  } catch (err) {
    console.error("❌ Patch failed:", err);
    return false;
  }
}

// Start MCP WebSocket server
const wss = new WebSocketServer({ port: 7777 });

console.log("🟢 Builder MCP running on ws://localhost:7777");

wss.on("connection", (socket: WebSocket) => {
  console.log("🔗 MCP client connected");

  socket.on("message", (msg: Buffer) => {
    try {
      const req = JSON.parse(msg.toString());
      console.log("📥 MCP request:", req);

      if (req.method !== "mcp.call") return;

      const tool = req.params.tool;
      const args = req.params.args;
      const id = req.id;

      let result: any = {};

      // ----------------------------------------------------------
      // TOOL: list_files
      // ----------------------------------------------------------
      if (tool === "list_files") {
        const folder = safePath(args.path || "/");
        result = { files: fs.readdirSync(folder) };
      }

      // ----------------------------------------------------------
      // TOOL: read_file
      // ----------------------------------------------------------
      else if (tool === "read_file") {
        const fp = safePath(args.path);
        result = { content: fs.readFileSync(fp, "utf-8") };
      }

      // ----------------------------------------------------------
      // TOOL: write_file
      // ----------------------------------------------------------
      else if (tool === "write_file") {
        const fp = safePath(args.path);
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, args.content, "utf-8");
        result = { ok: true };
      }

      // ----------------------------------------------------------
      // TOOL: mkdir
      // ----------------------------------------------------------
      else if (tool === "mkdir") {
        const fp = safePath(args.path);
        fs.mkdirSync(fp, { recursive: true });
        result = { ok: true };
      }

      // ----------------------------------------------------------
      // TOOL: delete_file
      // ----------------------------------------------------------
      else if (tool === "delete_file") {
        const fp = safePath(args.path);
        fs.unlinkSync(fp);
        result = { ok: true };
      }

      // ----------------------------------------------------------
      // TOOL: copy_template
      // Copies an entire Next.js template into workspace
      // ----------------------------------------------------------
      else if (tool === "copy_template") {
        const templateName = args.name;
        const sourceDir = path.join(TEMPLATE_DIR, templateName);

        if (!fs.existsSync(sourceDir)) {
          throw new Error(`Template not found: ${templateName}`);
        }

        child_process.execSync(`cp -R ${sourceDir}/* ${WORKDIR}/`, {
          stdio: "inherit",
        });

        result = { ok: true };
      }

      // ----------------------------------------------------------
      // TOOL: apply_patch
      // Applies LLM-generated diffs to a file
      // ----------------------------------------------------------
      else if (tool === "apply_patch") {
        const fp = safePath(args.path);
        const diff = args.diff;

        const ok = applyPatch(fp, diff);
        result = { ok };
      }

      else {
        throw new Error(`Unknown tool: ${tool}`);
      }

      const response = { id, result };
      console.log("📤 MCP response:", response);
      socket.send(JSON.stringify(response));
    } catch (err) {
      console.error("❌ MCP error:", err);
    }
  });

  socket.on("close", () => {
    console.log("🔌 MCP client disconnected");
    process.exit(0);
  });
});

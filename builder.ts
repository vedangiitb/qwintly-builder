process.on("SIGTERM", () => {
  console.log("🔌 Builder received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

import fs from "fs";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";

console.log("🚀 Builder container started");

// Workspace folder
const WORKDIR = "/workspace";
fs.mkdirSync(WORKDIR, { recursive: true });

// Start MCP WebSocket server
const wss = new WebSocketServer({ port: 7777 });

console.log("🟢 MCP server running on ws://localhost:7777");

wss.on("connection", (socket: WebSocket) => {
  console.log("🔗 MCP client connected");

  socket.on("message", (msg: Buffer) => {
    try {
      const req = JSON.parse(msg.toString());
      console.log("📥 MCP received:", req);

      if (req.method === "mcp.call") {
        if (req.params.tool === "list_files") {
          const folder = req.params.args.path || WORKDIR;
          const files = fs.readdirSync(folder);

          const response = {
            id: req.id,
            result: {
              files,
            },
          };

          console.log("📤 MCP sending:", response);
          socket.send(JSON.stringify(response));
        }
      }
    } catch (err) {
      console.error("❌ MCP error:", err);
    }
  });

  socket.on("close", () => {
    console.log("🔌 MCP client disconnected");
    process.exit(0);
  });
});

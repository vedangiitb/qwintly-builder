import WebSocket from "ws";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { templates } from "./data/templates.js";

const WORKER_WS = process.env.WORKER_WS!;
const SESSION_ID = process.env.SESSION_ID!;

const workerWs = new WebSocket(WORKER_WS);

function sendLog(msg: string) {
  workerWs.send(
    JSON.stringify({
      type: "log",
      sessionId: SESSION_ID,
      message: msg,
      ts: Date.now(),
    })
  );
}

workerWs.on("open", async () => {
  sendLog("Builder connected to worker for the session id: " + SESSION_ID);
  const workspace = `/workspace/${SESSION_ID}`;
  try {
    await fs.mkdir(workspace, { recursive: true });
    sendLog("Workspace created: " + workspace);

    // Clone default template into workspace
    await cloneDefaultTemplate(SESSION_ID, workspace);

    sendLog("Builder task complete. Exiting");
    process.exit(0);
  } catch (err: any) {
    sendLog(
      "Builder error: " + (err && err.message ? err.message : String(err))
    );
    process.exit(1);
  }
});

async function cloneDefaultTemplate(sessionId: string, workspacePath: string) {
  const repo = templates.default;
  sendLog(`Cloning default template ${repo} into ${workspacePath}`);

  // Helper to run a command and wait for completion
  function runCommand(cmd: string, args: string[], cwd?: string) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: "inherit", cwd });
      child.on("error", (err) => reject(err));
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${cmd} exited with code ${code}`));
      });
    });
  }

  // If the template is a git URL, use `git clone`.
  if (
    typeof repo === "string" &&
    (repo.startsWith("http") ||
      repo.endsWith(".git") ||
      repo.includes("github.com"))
  ) {
    // Clone into a temporary folder then move contents to workspacePath if necessary
    // If workspacePath is empty (just created) we can clone direct   ly into it by cloning into a subfolder and moving.
    const tmpFolder = path.join(
      path.dirname(workspacePath),
      `${sessionId}_tmp`
    );
    try {
      await fs.rm(tmpFolder, { recursive: true, force: true });
    } catch {
      // ignore
    }
    await fs.mkdir(tmpFolder, { recursive: true });

    // Clone repo into tmpFolder/repo
    await runCommand("git", ["clone", repo, tmpFolder]);

    // Move all files from tmpFolder into workspacePath
    const entries = await fs.readdir(tmpFolder);
    for (const entry of entries) {
      const src = path.join(tmpFolder, entry);
      const dest = path.join(workspacePath, entry);
      await fs.rename(src, dest);
    }
    // Cleanup
    try {
      await fs.rm(tmpFolder, { recursive: true, force: true });
    } catch {
      // ignore
    }
    sendLog(`Cloned template into ${workspacePath}`);
  } else {
    // If not a git URL, write the repo string into a README as fallback
    await fs.writeFile(
      path.join(workspacePath, "TEMPLATE_SOURCE.txt"),
      String(repo)
    );
    sendLog("Wrote TEMPLATE_SOURCE.txt as fallback (template not a git URL)");
  }
}

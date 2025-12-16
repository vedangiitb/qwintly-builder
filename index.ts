import fs from "fs/promises";
import { projectConstants } from "./data/constants.js";
import { initProjectStructure } from "./utils/ai/initProjectStructure.js";
import { cloneProjectTemplate } from "./utils/cloneProjectTemplate.js";
import { fetchProjectContents } from "./utils/fetchProjectContents.js";
import { getRequest } from "./utils/getRequest.js";
import { registerCleanup, safeExit } from "./utils/gracefulShutdown.js";
import { sendLog } from "./utils/sendLog.js";
import { uploadProjectToGCS } from "./utils/uploadProjectToGCS.js";
import { zipFolder } from "./utils/zipFolder.js";

export const SESSION_ID = process.env.SESSION_ID!;
export const REQUEST_TYPE = process.env.REQUEST_TYPE!;
export const BUCKET_NAME =
  process.env.BUCKET_NAME || "qwintly-builder-requests";
export const SNAPSHOT_BUCKET_NAME =
  process.env.SNAPSHOT_BUCKET_NAME || "qwintly-project-snapshots";

if (!SESSION_ID || !REQUEST_TYPE) {
  throw new Error("Missing required env vars");
}

async function main() {
  console.log("Builder connected to worker for the session id: " + SESSION_ID);
  const workspace = `/tmp/workspace/${SESSION_ID}`;
  const zipPath = `/tmp/${SESSION_ID}.zip`;
  try {
    await fs.mkdir(workspace, { recursive: true });
    console.log("Workspace created: " + workspace);

    registerCleanup(async () => {
      try {
        await fs.rm(workspace, { recursive: true, force: true });
        console.log("Workspace removed: " + workspace);
      } catch (e) {
        console.warn("Failed to remove workspace: " + e);
      }
    });

    console.log("Loading request for session id: " + SESSION_ID);
    const request = await getRequest(SESSION_ID);
    console.log("Request loaded: " + JSON.stringify(request));

    sendLog("Setting up your project");
    if (REQUEST_TYPE == projectConstants.projectRequestTypes.new) {
      console.log("New project request. Cloning project template");
      await cloneProjectTemplate(SESSION_ID);
      sendLog("Creating project structure");

      const sampleRequest =
        "Create a modern SaaS landing page for an AI resume matcher product";

      await initProjectStructure(REQUEST_TYPE, sampleRequest, workspace);

      console.log(
        "Workspace root contents: " +
          JSON.stringify(await fs.readdir(workspace))
      );
    } else if (REQUEST_TYPE == projectConstants.projectRequestTypes.update) {
      console.log("Update project request. Fetching project contents");
      await fetchProjectContents(SESSION_ID);
    } else {
      console.log("Unknown request type: " + REQUEST_TYPE);
      await safeExit(1, "Unknown request type: " + REQUEST_TYPE);
    }

    registerCleanup(async () => {
      try {
        await fs.rm(zipPath, { force: true });
      } catch (e) {
        console.error(e || "Error occured while cleaning up zip file");
      }
    });

    sendLog("Saving Changes");
    console.log("Zipping workspace");
    await zipFolder(workspace, zipPath);

    await uploadProjectToGCS(zipPath, SNAPSHOT_BUCKET_NAME, SESSION_ID);

    console.log("Builder task complete. Exiting");
    sendLog("SUCCESS");
    await safeExit(0, "Completed successfully");
  } catch (err: any) {
    console.error(
      "Builder error: " + (err && err.message ? err.message : String(err))
    );
    // TODO: Improve this log
    sendLog("Error Occured, please try again");
    await safeExit(
      1,
      err && err.message ? err.message : String(err ?? "Unknown error")
    );
  }
}

main();

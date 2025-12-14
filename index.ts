import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import { projectConstants } from "./data/constants.js";
import { cloneProjectTemplate } from "./utils/cloneProjectTemplate.js";
import { fetchProjectContents } from "./utils/fetchProjectContents.js";
import { getRequest } from "./utils/getRequest.js";
import { sendLog } from "./utils/sendLog.js";
import { uploadProjectToGCS } from "./utils/uploadProjectToGCS.js";
import { zipFolder } from "./utils/zipFolder.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY! });

export const SESSION_ID = process.env.SESSION_ID!;
export const REQUEST_TYPE = process.env.REQUEST_TYPE!;
export const BUCKET_NAME =
  process.env.BUCKET_NAME || "qwintly-builder-requests";
export const SNAPSHOT_BUCKET_NAME =
  process.env.SNAPSHOT_BUCKET_NAME || "qwintly-project-snapshots";

if (!SESSION_ID || !REQUEST_TYPE) {
  console.error("Missing required env vars");
  process.exit(1);
}

async function main() {
  sendLog("Builder connected to worker for the session id: " + SESSION_ID);
  const workspace = `/tmp/workspace/${SESSION_ID}`;
  try {
    await fs.mkdir(workspace, { recursive: true });
    sendLog("Workspace created: " + workspace);

    sendLog("Loading request for session id: " + SESSION_ID);
    const request = await getRequest(SESSION_ID);
    sendLog("Request loaded: " + JSON.stringify(request));

    if (REQUEST_TYPE == projectConstants.projectRequestTypes.new) {
      sendLog("New project request. Cloning project template");
      await cloneProjectTemplate(SESSION_ID);
    } else if (REQUEST_TYPE == projectConstants.projectRequestTypes.update) {
      sendLog("Update project request. Fetching project contents");
      await fetchProjectContents(SESSION_ID);
    } else {
      sendLog("Unknown request type: " + REQUEST_TYPE);
      process.exit(1);
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents:
        "This is a test prompt to see if my api is up. Please say hello along with a random word.",
    });
    console.log(response.text);

    const zipPath = `/tmp/${SESSION_ID}.zip`;

    sendLog("Zipping project workspace");
    await zipFolder(workspace, zipPath);

    await uploadProjectToGCS(zipPath, SNAPSHOT_BUCKET_NAME, SESSION_ID);

    sendLog("Builder task complete. Exiting");
    process.exit(0);
  } catch (err: any) {
    sendLog(
      "Builder error: " + (err && err.message ? err.message : String(err))
    );
    process.exit(1);
  }
}

main();

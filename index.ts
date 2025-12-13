import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import { cloneProjectTemplate } from "./cloneProjectTemplate.js";
import { projectConstants } from "./data/constants.js";
import { fetchProjectContents } from "./fetchProjectContents.js";
import { getRequest } from "./getRequest.js";
import { sendLog } from "./sendLog.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY! });

export const SESSION_ID = process.env.SESSION_ID!;
export const REQUEST_TYPE = process.env.REQUEST_TYPE!;
export const BUCKET_NAME = "qwintly-builder-requests";

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
      contents: "This is a test prompt to see if my api is up. Please say hello along with a random word.",
    });
    console.log(response.text);

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

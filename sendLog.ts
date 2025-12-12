import { SESSION_ID } from "./index.js";

export function sendLog(msg: string) {
  console.log(`[${SESSION_ID}]: ${msg}`);
}

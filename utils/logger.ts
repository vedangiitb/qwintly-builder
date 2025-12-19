import { SESSION_ID } from "../config/env.js";

export function sendLog(msg: string) {
  console.log(
    JSON.stringify({
      sessionId: SESSION_ID,
      type: "STATUS",
      message: msg,
    })
  );
}

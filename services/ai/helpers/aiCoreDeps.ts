import {
  createFile,
  createFolder,
  readFile,
  removeFile,
  safeReadDir,
  stat,
} from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../logger/logger.service.js";

export const createAiCoreWorkspaceDeps = () => {
  const ctx = getJobContext();

  return {
    workspaceRoot: ctx.workspace,
    logger,
    fs: {
      readFile,
      writeFile: createFile,
      mkdirp: createFolder,
      rmFile: removeFile,
      stat,
      safeReadDir,
    },
  };
};


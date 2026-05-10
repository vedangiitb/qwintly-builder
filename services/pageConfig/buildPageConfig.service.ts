import { getJobContext } from "../../job/jobContext.js";
import { GenSnapshotRepository } from "../../repository/genSnapshots.repository.js";
import { buildSnapshotFromWorkspace } from "./snapshotBuilder.js";

export const buildPageConfig = async () => {
  const ctx = getJobContext();
  const genSnapshotRepo = new GenSnapshotRepository();

  const snapshot = await buildSnapshotFromWorkspace(ctx.workspace);

  await genSnapshotRepo.uploadGenerationSnapshot(ctx.sessionId, snapshot);
};

import { getJobContext } from "../../job/jobContext.js";
import { GenSnapshotRepository } from "../../repository/genSnapshots.repository.js";
import type { Snapshot } from "../../types/snapshot.js";
import { buildSnapshotFromWorkspace } from "./snapshotBuilder.js";

export const buildPageConfig = async () => {
  const ctx = getJobContext();
  const genSnapshotRepo = new GenSnapshotRepository();

  let snapshot: Snapshot;
  try {
    snapshot = await buildSnapshotFromWorkspace(ctx.workspace);
  } catch {
    snapshot = { routes: {} };
  }

  await genSnapshotRepo.uploadGenerationSnapshot(ctx.sessionId, snapshot);
};

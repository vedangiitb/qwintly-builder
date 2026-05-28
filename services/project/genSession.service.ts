import { GenSessionRepo } from "../../repository/genSession.repository.js";

const assertNonEmpty = (value: string, field: string): void => {
  if (!value?.trim()) {
    throw new Error(`\`${field}\` must be a non-empty string`);
  }
};

export const finishGenerationSession = async (
  genId: string,
  success: boolean,
) => {
  assertNonEmpty(genId, "genId");

  const genSessionRepo = new GenSessionRepo();

  await genSessionRepo.finishGenerationSession(genId, success);
};

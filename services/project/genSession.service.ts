import { GenSessionRepo } from "../../repository/genSession.repository.js";

const assertNonEmpty = (value: string, field: string): void => {
  if (!value || !value.trim()) {
    throw new Error(`\`${field}\` must be a non-empty string`);
  }
};

export const finishGenerationSession = async (
  chatId: string,
  genId: string,
  planId: string,
  success: boolean,
) => {
  assertNonEmpty(chatId, "chatId");
  assertNonEmpty(genId, "genId");

  const genSessionRepo = new GenSessionRepo();

  await genSessionRepo.finishGenerationSession(chatId, genId, planId, success);
};

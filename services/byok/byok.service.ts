import { KeyManagementServiceClient } from "@google-cloud/kms";
import { GCP_PROJECT_ID_QWINTLY, GEMINI_API_KEY } from "../../config/env.js";
import { UserKeysRepository } from "../../repository/userKeys.repository.js";

const kmsClient = new KeyManagementServiceClient();

export const getKeyFromUserid = async (
  userId: string,
  provider: string = "gemini",
  byokEnabled: boolean,
): Promise<string> => {
  if (!byokEnabled) {
    return GEMINI_API_KEY;
  }

  const userKeysRepo = new UserKeysRepository();
  const encryptedKey = await userKeysRepo.fetchKeyByUserIdAndProvider(
    userId,
    provider,
  );

  if (!encryptedKey?.trim()) {
    throw new Error("API key not found");
  }

  const decryptedKey = await decryptApiKey(encryptedKey);
  if (!decryptedKey?.trim()) {
    throw new Error("API key not found");
  }
  return decryptedKey;
};

function resolveKeyName(): string {
  const projectId = GCP_PROJECT_ID_QWINTLY?.trim();

  if (!projectId) {
    throw new Error(
      "Missing env var GCP_PROJECT_ID_QWINTLY (required for KMS encryption)",
    );
  }

  return `projects/${projectId}/locations/global/keyRings/qwintly-keyring/cryptoKeys/user-api-keys`;
}

export async function decryptApiKey(encryptedKey: string) {
  const keyName = resolveKeyName();

  const [result] = await kmsClient.decrypt({
    name: keyName,
    ciphertext: Buffer.from(encryptedKey, "base64"),
  });

  return result.plaintext?.toString();
}

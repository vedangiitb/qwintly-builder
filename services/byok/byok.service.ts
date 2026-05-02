import { GCP_PROJECT_ID_QWINTLY } from "../../config/env.js";
import { UserKeysRepository } from "../../repository/userKeys.repository.js";
import { KeyManagementServiceClient } from "@google-cloud/kms";

const kmsClient = new KeyManagementServiceClient();

export const getKeyFromUserid = async (
  userId: string,
  provider: string = "gemini",
): Promise<string> => {
  const userKeysRepo = new UserKeysRepository();
  const encryptedKey = await userKeysRepo.fetchKeyByUserIdAndProvider(
    userId,
    provider,
  );
  const decryptedKey = await decryptApiKey(encryptedKey);
  if (!decryptedKey) {
    throw new Error("API key not found");
  }
  return decryptedKey;
};

function resolveKeyName(): string {
  const projectId = GCP_PROJECT_ID_QWINTLY?.trim();

  if (!projectId) {
    throw new Error(
      "Missing env var GCP_PROJECT_ID (required for KMS encryption)",
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

import { DBRepository } from "./repository.js";

export class UserKeysRepository extends DBRepository {
  /*
   * Table: user_api_keys
   * Use: Fetch api key for userId & Provider
   */
  async fetchKeyByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<string> {
    const supabase = this.client;

    const { data, error } = await supabase
      .from("user_api_keys")
      .select("encrypted_key")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single();

    if (error) throw error;
    if (!data) throw new Error("API key not found");

    return data.encrypted_key;
  }
}

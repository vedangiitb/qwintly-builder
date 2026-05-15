import { DBRepository } from "./repository.js";

export class GenSessionRepo extends DBRepository {
  async finishGenerationSession(
    genId: string,
    success: boolean,
  ): Promise<void> {
    const { error } = await this.client.rpc("finish_generation", {
      p_gen_id: genId,
      p_success: success,
    });

    if (error) {
      throw new Error(`Failed to finish generation session: ${error.message}`);
    }
  }
}

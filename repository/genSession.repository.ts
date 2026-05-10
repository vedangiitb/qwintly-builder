import { DBRepository } from "./repository.js";

export class GenSessionRepo extends DBRepository {
  async finishGenerationSession(
    chatId: string,
    genId: string,
    planId: string,
    success: boolean,
  ): Promise<void> {
    const { error } = await this.client.rpc("finish_generation_session", {
      p_conv_id: chatId,
      p_gen_id: genId,
      p_plan_id: planId,
      p_success: success,
    });

    if (error) {
      throw new Error(`Failed to finish generation session: ${error.message}`);
    }
  }
}

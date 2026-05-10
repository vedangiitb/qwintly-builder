import { DBRepository } from "./repository.js";

export class GenSnapshotRepository extends DBRepository {
  /*
   * Table: generation_snapshots
   * Use: Upload generation_snapshot Fetch)
   */

  async uploadGenerationSnapshot(sessionId: string, snapshot: any) {
    const supabase = this.client;

    const { data, error } = await supabase
      .from("generation_snapshots")
      .insert({
        id: sessionId,
        page_config: snapshot,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data;
  }
}

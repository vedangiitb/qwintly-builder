import { supabaseAdmin } from "../lib/supabase-admin.js";

export class DBRepository {
  protected get client() {
    return supabaseAdmin;
  }
}

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ENDPOINT, SUPABASE_SECRET } from "../config/env.js";

if (!SUPABASE_ENDPOINT || !SUPABASE_SECRET) {
  throw new Error(
    "Missing required environment variables NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SECRET_KEY",
  );
}

export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_ENDPOINT,
  SUPABASE_SECRET,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

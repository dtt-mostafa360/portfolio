import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseEnabled } from "@/lib/env";

export const supabase = isSupabaseEnabled
  ? createClient(env.supabaseUrl!, env.supabasePublishableKey!, {
      auth: { persistSession: false },
    })
  : null;

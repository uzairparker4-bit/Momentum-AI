import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Browser-safe client (anon key) */
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Server-only admin client (service role) */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseServiceKey &&
    !supabaseUrl.startsWith("REPLACE") &&
    !supabaseServiceKey.startsWith("REPLACE")
  );
}

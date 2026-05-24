import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. NEVER import this from any file that can
// be bundled into the browser — the `server-only` import above is the guard.
// All write paths (resume upsert, variant upsert/delete, PAT create/verify)
// must use this client; the anon client is read-only against public data.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for the server supabase client");
}
if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the server supabase client");
}

export const supabaseService = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

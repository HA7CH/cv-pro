import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { supabaseAnon } from "@/lib/supabase/client";

const PAT_PREFIX = "cv_pat_";

function hashToken(token: string): string {
  const secret = process.env.PAT_HASH_SECRET;
  if (!secret) throw new Error("PAT_HASH_SECRET missing");
  return createHmac("sha256", secret).update(token).digest("hex");
}

// LLM-safe: hex avoids 0/O, l/I/1, _/- confusion when an agent has to retype a token.
// 20 bytes = 160 bits of entropy, more than enough for a PAT.
function generateRawToken(): string {
  return PAT_PREFIX + randomBytes(20).toString("hex");
}

export async function createPat(
  username: string,
  name: string,
): Promise<{ token: string; id: string }> {
  const token = generateRawToken();
  const tokenHash = hashToken(token);
  const { data, error } = await supabaseAnon
    .from("cv_pat_tokens")
    .insert({ username, name, token_hash: tokenHash })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`createPat failed: ${error?.message ?? "no row"}`);
  }
  return { token, id: data.id };
}

export async function verifyPat(
  rawToken: string,
): Promise<{ username: string } | null> {
  if (!rawToken?.startsWith(PAT_PREFIX)) return null;
  const tokenHash = hashToken(rawToken);
  const { data, error } = await supabaseAnon
    .from("cv_pat_tokens")
    .select("id, username, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data || data.revoked_at) return null;

  void supabaseAnon
    .from("cv_pat_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);

  return { username: data.username };
}

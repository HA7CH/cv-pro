import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { getServiceClient } from "@/lib/supabase/server";

const PAT_PREFIX = "cv_pat_";

function hashToken(token: string): string {
  const secret = process.env.PAT_HASH_SECRET;
  if (!secret) throw new Error("PAT_HASH_SECRET missing");
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function generateRawToken(): string {
  return PAT_PREFIX + randomBytes(24).toString("base64url");
}

export async function createPat(
  username: string,
  name: string,
): Promise<{ token: string; id: string }> {
  const token = generateRawToken();
  const tokenHash = hashToken(token);
  const client = getServiceClient();
  const { data, error } = await client
    .from("cv_pat_tokens")
    .insert({ username, name, token_hash: tokenHash })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`createPat failed: ${error?.message ?? "no row"}`);
  }
  return { token, id: data.id };
}

export interface PatRow {
  id: string;
  username: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export async function listPats(username: string): Promise<PatRow[]> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("cv_pat_tokens")
    .select("id, username, name, created_at, last_used_at, revoked_at")
    .eq("username", username)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listPats failed: ${error.message}`);
  return data ?? [];
}

export async function revokePat(id: string): Promise<void> {
  const client = getServiceClient();
  const { error } = await client
    .from("cv_pat_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`revokePat failed: ${error.message}`);
}

export async function verifyPat(
  rawToken: string,
): Promise<{ username: string; tokenId: string } | null> {
  if (!rawToken || !rawToken.startsWith(PAT_PREFIX)) return null;
  const tokenHash = hashToken(rawToken);
  const client = getServiceClient();
  const { data, error } = await client
    .from("cv_pat_tokens")
    .select("id, username, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data || data.revoked_at) return null;

  void client
    .from("cv_pat_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);

  return { username: data.username, tokenId: data.id };
}

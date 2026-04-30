import "server-only";
import { supabaseAnon } from "@/lib/supabase/client";
import { getServiceClient } from "@/lib/supabase/server";
import { SEED_RESUME } from "@/lib/seed";
import type { ResumeData } from "@/types/resume";

export async function getResumeByUsername(
  username: string,
): Promise<ResumeData | null> {
  try {
    const { data, error } = await supabaseAnon
      .from("cv_resumes")
      .select("data")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.warn("[resume-store] supabase read failed:", error.message);
    }
    if (data?.data) {
      return data.data as ResumeData;
    }
  } catch (err) {
    console.warn("[resume-store] supabase unreachable:", err);
  }

  if (username === SEED_RESUME.username) {
    return SEED_RESUME;
  }
  return null;
}

export async function listUsernames(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAnon
      .from("cv_resumes")
      .select("username");
    if (error) {
      console.warn("[resume-store] list failed:", error.message);
      return [SEED_RESUME.username];
    }
    return (data ?? []).map((r) => r.username);
  } catch {
    return [SEED_RESUME.username];
  }
}

export async function upsertResume(data: ResumeData): Promise<ResumeData> {
  const client = getServiceClient();

  const { data: current } = await client
    .from("cv_resumes")
    .select("version, data")
    .eq("username", data.username)
    .maybeSingle();

  if (current) {
    await client.from("cv_resume_versions").insert({
      username: data.username,
      version: current.version,
      data: current.data,
    });
  }

  const nextVersion = (current?.version ?? 0) + 1;
  const next: ResumeData = {
    ...data,
    meta: {
      updatedAt: new Date().toISOString(),
      version: nextVersion,
    },
  };

  const { error } = await client.from("cv_resumes").upsert(
    {
      username: data.username,
      data: next,
      version: nextVersion,
      updated_at: next.meta.updatedAt,
    },
    { onConflict: "username" },
  );
  if (error) {
    throw new Error(`upsertResume failed: ${error.message}`);
  }

  await pruneOldVersions(data.username);

  return next;
}

export async function listVersions(
  username: string,
): Promise<{ version: number; created_at: string }[]> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("cv_resume_versions")
    .select("version, created_at")
    .eq("username", username)
    .order("version", { ascending: false })
    .limit(10);
  if (error) {
    throw new Error(`listVersions failed: ${error.message}`);
  }
  return data ?? [];
}

export async function rollbackResume(
  username: string,
  version: number,
): Promise<ResumeData> {
  const client = getServiceClient();
  const { data: target, error } = await client
    .from("cv_resume_versions")
    .select("data")
    .eq("username", username)
    .eq("version", version)
    .maybeSingle();

  if (error || !target) {
    throw new Error(
      `rollbackResume: version ${version} not found for ${username}`,
    );
  }
  return upsertResume(target.data as ResumeData);
}

async function pruneOldVersions(username: string) {
  const client = getServiceClient();
  const { data } = await client
    .from("cv_resume_versions")
    .select("id, version")
    .eq("username", username)
    .order("version", { ascending: false });

  if (!data || data.length <= 10) return;

  const toDelete = data.slice(10).map((r) => r.id);
  if (toDelete.length) {
    await client.from("cv_resume_versions").delete().in("id", toDelete);
  }
}

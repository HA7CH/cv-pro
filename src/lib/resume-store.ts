import "server-only";
import { cacheLife, cacheTag, revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { supabaseAnon } from "@/lib/supabase/client";
import {
  type ResumeData,
  contactLinkSchema,
  educationSchema,
  headerSchema,
  personalInfoSchema,
  projectDetailedSchema,
  projectShortSchema,
  resumeSchema,
  skillCategorySchema,
  workExperienceSchema,
} from "@/types/resume";

export async function getResumeByUsername(username: string): Promise<ResumeData | null> {
  "use cache";
  cacheTag("resume", username);
  cacheLife("hours");
  try {
    const { data, error } = await supabaseAnon
      .from("cv_resumes")
      .select("data")
      .eq("username", username)
      .maybeSingle();

    if (error) console.warn("[resume-store] read failed:", error.message);
    if (data?.data) return normalizeResume(data.data, username);
  } catch (err) {
    console.warn("[resume-store] unreachable:", err);
  }
  return null;
}

export async function upsertResume(data: ResumeData): Promise<ResumeData> {
  const next: ResumeData = {
    ...data,
    meta: { updatedAt: new Date().toISOString() },
  };

  const { error } = await supabaseAnon.from("cv_resumes").upsert(
    { username: data.username, data: next, updated_at: next.meta.updatedAt },
    { onConflict: "username" },
  );
  if (error) throw new Error(`upsertResume failed: ${error.message}`);

  revalidateTag("resume", data.username);
  revalidatePath(`/${data.username}`);
  return next;
}

export async function getVariantByAudience(username: string, audience: string): Promise<ResumeData | null> {
  "use cache";
  cacheTag("variant", `${username}:${audience}`);
  cacheLife("hours");
  try {
    const { data, error } = await supabaseAnon
      .from("cv_variants")
      .select("data")
      .eq("username", username)
      .eq("audience", audience)
      .maybeSingle();

    if (error) console.warn("[resume-store] variant read failed:", error.message);
    if (data?.data) return normalizeResume(data.data, username);
  } catch (err) {
    console.warn("[resume-store] variant unreachable:", err);
  }
  return null;
}

export async function getVariantsForAudiences(
  username: string,
  audiences: string[],
): Promise<Map<string, ResumeData>> {
  "use cache";
  const uniqueAudiences = [...new Set(audiences.filter((value) => value.length > 0))];
  if (uniqueAudiences.length === 0) return new Map();
  for (const audience of uniqueAudiences) cacheTag("variant", `${username}:${audience}`);
  cacheLife("hours");
  try {
    const { data, error } = await supabaseAnon
      .from("cv_variants")
      .select("audience, data")
      .eq("username", username)
      .in("audience", uniqueAudiences);

    if (error) console.warn("[resume-store] variants read failed:", error.message);

    const variants = new Map<string, ResumeData>();
    for (const row of data ?? []) {
      if (row.data) variants.set(row.audience, normalizeResume(row.data, username));
    }
    return variants;
  } catch (err) {
    console.warn("[resume-store] variants unreachable:", err);
  }
  return new Map();
}

export async function upsertVariant(username: string, audience: string, data: ResumeData): Promise<ResumeData> {
  const next: ResumeData = {
    ...data,
    meta: { updatedAt: new Date().toISOString() },
  };

  const { error } = await supabaseAnon.from("cv_variants").upsert(
    { username, audience, data: next, updated_at: next.meta.updatedAt },
    { onConflict: "username,audience" },
  );
  if (error) throw new Error(`upsertVariant failed: ${error.message}`);

  revalidateTag("variant", `${username}:${audience}`);
  revalidatePath(`/${username}`);
  return next;
}

export async function deleteVariant(username: string, audience: string): Promise<void> {
  const { error } = await supabaseAnon
    .from("cv_variants")
    .delete()
    .eq("username", username)
    .eq("audience", audience);

  if (error) throw new Error(`deleteVariant failed: ${error.message}`);

  revalidateTag("variant", `${username}:${audience}`);
  revalidatePath(`/${username}`);
}

export async function listVariants(username: string): Promise<{ audience: string; updatedAt: string }[]> {
  const { data, error } = await supabaseAnon
    .from("cv_variants")
    .select("audience, updated_at")
    .eq("username", username)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`listVariants failed: ${error.message}`);

  return (data ?? []).map((row) => ({ audience: row.audience, updatedAt: row.updated_at }));
}

// Render-side defense: coerces malformed DB rows into a renderable shape so the
// public page never white-screens on bad data. Drops invalid array entries
// item-by-item rather than rejecting the whole section.
export function normalizeResume(raw: unknown, username: string): ResumeData {
  const full = resumeSchema.safeParse(raw);
  if (full.success) return { ...full.data, username };

  const obj = isRecord(raw) ? raw : {};
  return {
    username,
    header: parseOr(headerSchema, obj.header, { name: "" }),
    personalInfo: parseOr(personalInfoSchema, obj.personalInfo, { email: "" }),
    experience: parseEntries(workExperienceSchema, obj.experience),
    education: parseEntries(educationSchema, obj.education),
    projectsRecent: parseEntries(projectShortSchema, obj.projectsRecent),
    projectsDetailed: parseEntries(projectDetailedSchema, obj.projectsDetailed),
    skills: parseEntries(skillCategorySchema, obj.skills),
    contact: parseEntries(contactLinkSchema, obj.contact),
    meta: {
      updatedAt:
        isRecord(obj.meta) && typeof obj.meta.updatedAt === "string"
          ? obj.meta.updatedAt
          : new Date().toISOString(),
    },
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseOr<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const r = schema.safeParse(value);
  return r.success ? r.data : fallback;
}

function parseEntries<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const r = schema.safeParse(item);
    if (r.success) out.push(r.data);
  }
  return out;
}

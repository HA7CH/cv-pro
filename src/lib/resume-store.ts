import "server-only";
import { revalidatePath, unstable_cache } from "next/cache";
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

export const getResumeByUsername = unstable_cache(
  async (username: string): Promise<ResumeData | null> => {
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
  },
  ["resume-by-username"],
  { revalidate: 300 },
);

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

  revalidatePath(`/${data.username}`);
  return next;
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

import { NextRequest, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/client";
import { createPat } from "@/lib/pat";
import { SEED_RESUME } from "@/lib/seed";
import type { ResumeData } from "@/types/resume";

const RESERVED = new Set([
  "admin", "api", "login", "register", "start", "me", "public", "static",
  "_next", "404", "500", "favicon", "index", "cv", "help", "about",
  "terms", "privacy", "support", "new",
]);

function validateHandle(handle: string): string | null {
  if (!handle) return "Handle is required.";
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(handle) && !/^[a-z0-9]{2,30}$/.test(handle)) {
    return "Handle must be 2–30 lowercase letters, numbers, or hyphens (no leading/trailing hyphens).";
  }
  if (RESERVED.has(handle)) return `"${handle}" is reserved. Pick something else.`;
  return null;
}

export async function POST(req: NextRequest) {
  let handle: string;
  try {
    const body = await req.json();
    handle = String(body.handle ?? "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const err = validateHandle(handle);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  // check uniqueness
  const { data: existing } = await supabaseAnon
    .from("cv_resumes")
    .select("username")
    .eq("username", handle)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `@${handle} is already taken. Pick a different handle.` },
      { status: 409 },
    );
  }

  // create empty resume
  const resume: ResumeData = {
    ...SEED_RESUME,
    username: handle,
    meta: { updatedAt: new Date().toISOString(), version: 1 },
  };

  const { error: insertErr } = await supabaseAnon.from("cv_resumes").insert({
    username: handle,
    data: resume,
    version: 1,
    updated_at: resume.meta.updatedAt,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: `@${handle} is already taken. Pick a different handle.` },
        { status: 409 },
      );
    }
    console.error("[register]", insertErr);
    return NextResponse.json({ error: "Server error. Try again." }, { status: 500 });
  }

  // generate PAT
  const { token } = await createPat(handle, "initial-token");

  return NextResponse.json({ handle, token }, { status: 201 });
}

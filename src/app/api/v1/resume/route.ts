import { NextRequest, NextResponse } from "next/server";
import { verifyPat } from "@/lib/pat";
import { getResumeByUsername, upsertResume } from "@/lib/resume-store";
import type { ResumeData } from "@/types/resume";

async function auth(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return verifyPat(header.slice(7).trim());
}

// GET /api/v1/resume
export async function GET(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const resume = await getResumeByUsername(user.username);
  if (!resume) return NextResponse.json({ error: "no resume yet" }, { status: 404 });

  return NextResponse.json(resume);
}

// PUT /api/v1/resume — replace entire resume
export async function PUT(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let data: ResumeData;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const saved = await upsertResume({ ...data, username: user.username });
  return NextResponse.json(saved);
}

// PATCH /api/v1/resume — update one section
export async function PATCH(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { section: string; value: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.section) {
    return NextResponse.json({ error: "missing 'section'" }, { status: 422 });
  }

  const current = await getResumeByUsername(user.username);
  if (!current) return NextResponse.json({ error: "no resume yet" }, { status: 404 });

  const saved = await upsertResume({
    ...current,
    [body.section]: body.value,
    username: user.username,
  } as ResumeData);

  return NextResponse.json(saved);
}

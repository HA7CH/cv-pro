import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPat } from "@/lib/pat";
import { getResumeByUsername, upsertResume } from "@/lib/resume-store";
import {
  type ResumeData,
  type SectionName,
  resumeSchema,
  SECTION_NAMES,
  SECTION_SCHEMAS,
} from "@/types/resume";

// 256 KB is comfortably larger than any realistic resume JSON; rejecting
// upstream of req.json() keeps a malicious 10 MB payload from being buffered.
const MAX_BODY_BYTES = 256 * 1024;

async function auth(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return verifyPat(header.slice(7).trim());
}

function checkBodySize(req: NextRequest): NextResponse | null {
  const lenHeader = req.headers.get("content-length");
  if (lenHeader) {
    const len = Number(lenHeader);
    if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 },
      );
    }
  }
  return null;
}

function issuesPayload(err: z.ZodError) {
  return err.issues.map((i) => ({
    path: i.path.map((p) => String(p)).join("."),
    message: i.message,
    code: i.code,
  }));
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

  const sizeErr = checkBodySize(req);
  if (sizeErr) return sizeErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const merged = {
    ...(body && typeof body === "object" ? (body as Record<string, unknown>) : {}),
    username: user.username,
    meta: { updatedAt: new Date().toISOString() },
  };

  const result = resumeSchema.safeParse(merged);
  if (!result.success) {
    return NextResponse.json(
      { error: "invalid resume", issues: issuesPayload(result.error) },
      { status: 422 },
    );
  }

  const saved = await upsertResume(result.data);
  return NextResponse.json(saved);
}

// PATCH /api/v1/resume — update one section
export async function PATCH(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sizeErr = checkBodySize(req);
  if (sizeErr) return sizeErr;

  let body: { section?: unknown; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const section = typeof body.section === "string" ? body.section : "";
  if (!isSectionName(section)) {
    return NextResponse.json(
      {
        error: `unknown section '${section}'`,
        allowed: SECTION_NAMES,
      },
      { status: 422 },
    );
  }

  const sectionResult = SECTION_SCHEMAS[section].safeParse(body.value);
  if (!sectionResult.success) {
    return NextResponse.json(
      {
        error: `invalid value for section '${section}'`,
        issues: issuesPayload(sectionResult.error),
      },
      { status: 422 },
    );
  }

  const current = await getResumeByUsername(user.username);
  if (!current) return NextResponse.json({ error: "no resume yet" }, { status: 404 });

  const next: ResumeData = {
    ...current,
    [section]: sectionResult.data,
    username: user.username,
  };
  const saved = await upsertResume(next);

  return NextResponse.json(saved);
}

function isSectionName(s: string): s is SectionName {
  return (SECTION_NAMES as readonly string[]).includes(s);
}

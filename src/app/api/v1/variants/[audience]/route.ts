import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPat } from "@/lib/pat";
import { getVariantByAudience, upsertVariant, deleteVariant } from "@/lib/resume-store";
import { resumeSchema } from "@/types/resume";

// Audience keys are user-supplied path segments that later become DB keys and
// URL slugs. Restrict to a conservative ASCII slug shape so they cannot smuggle
// SQL, path traversal, or query-string control characters.
const AUDIENCE_RE = /^[a-z0-9][a-z0-9-]{0,30}$/;

// 256 KB is comfortably larger than any realistic resume JSON; rejecting
// upstream of req.json() keeps a malicious 10 MB payload from being buffered.
const MAX_BODY_BYTES = 256 * 1024;

async function auth(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return verifyPat(header.slice(7).trim());
}

function validateAudience(audience: string): NextResponse | null {
  if (!AUDIENCE_RE.test(audience)) {
    return NextResponse.json(
      { error: "Invalid audience format" },
      { status: 400 },
    );
  }
  return null;
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

// GET /api/v1/variants/[audience] — get specific variant (full ResumeData JSON)
export async function GET(req: NextRequest, { params }: { params: Promise<{ audience: string }> }) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { audience } = await params;
  const audienceErr = validateAudience(audience);
  if (audienceErr) return audienceErr;

  const variant = await getVariantByAudience(user.username, audience);
  if (!variant) return NextResponse.json({ error: "variant not found" }, { status: 404 });

  return NextResponse.json(variant);
}

// PUT /api/v1/variants/[audience] — create/update variant
export async function PUT(req: NextRequest, { params }: { params: Promise<{ audience: string }> }) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { audience } = await params;
  const audienceErr = validateAudience(audience);
  if (audienceErr) return audienceErr;

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

  const saved = await upsertVariant(user.username, audience, result.data);
  return NextResponse.json(saved);
}

// DELETE /api/v1/variants/[audience] — delete variant
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ audience: string }> }) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { audience } = await params;
  const audienceErr = validateAudience(audience);
  if (audienceErr) return audienceErr;

  await deleteVariant(user.username, audience);
  return NextResponse.json({ ok: true });
}

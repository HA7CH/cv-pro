import { NextRequest, NextResponse } from "next/server";
import { applyResumeFilters } from "@/lib/resume-filter";
import { getResumeByUsername, getVariantByAudience } from "@/lib/resume-store";

type RouteParams = { username: string };
const VARIANT_PARAM_ORDER = ["company", "role", "focus", "lang"] as const;

async function resolveVariant(username: string, paramValues: string[]) {
  if (paramValues.length > 1) {
    const compoundKey = paramValues.join("-");
    const variant = await getVariantByAudience(username, compoundKey);
    if (variant) return variant;
  }

  if (paramValues.length === 0) return null;

  const variants = await Promise.all(
    paramValues.map((val) => getVariantByAudience(username, val)),
  );

  return variants.find(Boolean) ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  const { username } = await params;
  const resume = await getResumeByUsername(username);
  if (!resume) {
    return NextResponse.json(
      { error: "not_found", username },
      { status: 404 },
    );
  }

  const query = req.nextUrl.searchParams;
  const paramValues = VARIANT_PARAM_ORDER.map((k) => query.get(k)).filter(Boolean) as string[];
  const variant = await resolveVariant(username, paramValues);
  const output = variant ?? applyResumeFilters(resume, query).resume;

  return NextResponse.json(output, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

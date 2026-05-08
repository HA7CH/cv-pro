import { NextRequest, NextResponse } from "next/server";
import { applyResumeFilters } from "@/lib/resume-filter";
import { getResumeByUsername, getVariantsByAudiences } from "@/lib/resume-store";

type RouteParams = { username: string };
// Higher-priority query keys come first; this order controls fallback matching.
const VARIANT_PARAM_ORDER = ["company", "role", "focus", "lang"] as const;

/**
 * Variant resolution order:
 * 1) compound key built from all present params in VARIANT_PARAM_ORDER
 * 2) each individual param in VARIANT_PARAM_ORDER
 */
async function resolveVariant(username: string, paramValues: string[]) {
  if (paramValues.length === 0) return null;
  const compoundKey = paramValues.length > 1 ? paramValues.join("-") : null;
  const candidates = compoundKey ? [compoundKey, ...paramValues] : paramValues;
  const variants = await getVariantsByAudiences(username, candidates);
  if (compoundKey) {
    const compound = variants.get(compoundKey);
    if (compound) return compound;
  }
  for (const value of paramValues) {
    const variant = variants.get(value);
    if (variant) return variant;
  }
  return null;
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
  const paramValues = VARIANT_PARAM_ORDER.map((k) => query.get(k)).filter(
    (value): value is string => value !== null && value.length > 0,
  );
  const variant = await resolveVariant(username, paramValues);
  const output = variant ?? applyResumeFilters(resume, query).resume;

  return NextResponse.json(output, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

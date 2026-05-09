import { NextRequest, NextResponse } from "next/server";
import { applyResumeFilters } from "@/lib/resume-filter";
import { getResumeByUsername, getVariantsForAudiences } from "@/lib/resume-store";
import type { ResumeData } from "@/types/resume";

type RouteParams = { username: string };
// Precedence is company > role > focus > lang because links are typically shared with
// company targeting first, then role/focus/language as narrower fallback hints.
const VARIANT_PARAM_ORDER = ["company", "role", "focus", "lang"] as const;

/**
 * Variant resolution order:
 * 1) compound key built from all present params in VARIANT_PARAM_ORDER
 * 2) each individual param in VARIANT_PARAM_ORDER
 *
 * variantValues must be non-empty query values in VARIANT_PARAM_ORDER sequence.
 */
async function resolveVariant(username: string, variantValues: string[]): Promise<ResumeData | null> {
  if (variantValues.length === 0) return null;
  // Matches stored audience keys such as "company-role-focus" when multiple params are present.
  const compoundKey = variantValues.length > 1 ? variantValues.join("-") : null;
  const candidates = compoundKey ? [compoundKey, ...variantValues] : variantValues;
  const variants = await getVariantsForAudiences(username, candidates);
  if (compoundKey) {
    const compound = variants.get(compoundKey);
    if (compound) return compound;
  }
  for (const value of variantValues) {
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
  const variantValues = VARIANT_PARAM_ORDER.map((param) => query.get(param)).filter(
    (value): value is string => value !== null && value.length > 0,
  );
  const variant = await resolveVariant(username, variantValues);
  // Variants are pre-tailored payloads; only the base resume uses runtime tag filtering.
  const output = variant ?? applyResumeFilters(resume, query).resume;

  return NextResponse.json(output, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

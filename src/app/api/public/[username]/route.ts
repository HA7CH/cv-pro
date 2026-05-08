import { NextRequest, NextResponse } from "next/server";
import { applyResumeFilters } from "@/lib/resume-filter";
import { getResumeByUsername, getVariantByAudience } from "@/lib/resume-store";

type RouteParams = { username: string };
const VARIANT_PARAM_ORDER = ["company", "role", "focus", "lang"] as const;

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

  let output = resume;

  if (paramValues.length > 1) {
    const compoundKey = paramValues.join("-");
    const variant = await getVariantByAudience(username, compoundKey);
    if (variant) output = variant;
  }

  if (output === resume) {
    for (const val of paramValues) {
      const variant = await getVariantByAudience(username, val);
      if (variant) {
        output = variant;
        break;
      }
    }
  }

  if (output === resume) {
    output = applyResumeFilters(resume, query).resume;
  }

  return NextResponse.json(output, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { resolvePublicResume } from "@/lib/resume-public";
import { resumeToText } from "@/lib/resume-text";

type RouteParams = { username: string };

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" } as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  const { username } = await params;
  const resume = await resolvePublicResume(username, req.nextUrl.searchParams);
  if (!resume) {
    return new NextResponse(`Resume not found: ${username}\n`, {
      status: 404,
      headers: TEXT_HEADERS,
    });
  }

  return new NextResponse(resumeToText(resume), {
    headers: {
      ...TEXT_HEADERS,
      // Served inline like /:username.json; the on-page button forces a download.
      "Content-Disposition": `inline; filename="${username}.txt"`,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

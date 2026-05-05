import { NextResponse } from "next/server";
import { RESUME_SCHEMA_JSON, RESUME_SCHEMA_TEXT } from "@/lib/schema-doc";

// Public — no auth. Returns both the JSON Schema and a human-readable
// rendering. Consumed by the CLI (cv-pro schema) and any agent that wants to
// introspect the resume shape before writing.
export async function GET() {
  return NextResponse.json(
    { json: RESUME_SCHEMA_JSON, text: RESUME_SCHEMA_TEXT },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}

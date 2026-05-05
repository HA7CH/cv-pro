import "server-only";
import { z } from "zod";
import { resumeSchema, SECTION_NAMES } from "@/types/resume";

// JSON Schema (draft 2020-12) derived from the Zod source of truth — served at
// /api/v1/schema and returned by the get_schema MCP tool so agents can
// introspect the resume shape before writing.
export const RESUME_SCHEMA_JSON = z.toJSONSchema(resumeSchema) as JsonSchema;

export const RESUME_SCHEMA_TEXT = renderText(RESUME_SCHEMA_JSON);

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  default?: unknown;
}

function renderText(schema: JsonSchema): string {
  const lines: string[] = [];
  lines.push("Resume schema");
  lines.push("Live JSON form: https://cv.ha7ch.com/api/v1/schema");
  lines.push("");
  lines.push("Sections (top-level keys of the resume object):");
  lines.push("");

  const props = schema.properties ?? {};
  for (const sec of SECTION_NAMES) {
    const sub = props[sec];
    if (!sub) continue;
    lines.push(`  ${sec}  —  ${shape(sub)}`);
    const inner = sub.type === "array" ? sub.items : sub;
    if (inner?.type === "object") {
      const childProps = inner.properties ?? {};
      const required = new Set(inner.required ?? []);
      const keys = Object.keys(childProps);
      const w = Math.max(0, ...keys.map((k) => k.length));
      for (const k of keys) {
        const v = childProps[k];
        // A field listed in `required` but with a `default` is effectively
        // optional on input — Zod fills the default in if absent.
        const isRequired = required.has(k) && v.default === undefined;
        const flag = isRequired ? "  required" : "";
        lines.push(`      ${k.padEnd(w)}   ${shape(v)}${flag}`);
      }
    }
    lines.push("");
  }

  lines.push("Notes:");
  lines.push("  • Unknown keys are rejected. Common mistakes:");
  lines.push("      institution    →  use 'school'");
  lines.push("      description    →  use 'bullets' (array) on experience entries");
  lines.push("      jobTitle/title →  use 'role' on experience entries");
  lines.push("  • 'username' and 'meta' are auto-managed; do not send them.");
  lines.push("  • update_section / PATCH replaces a single section in one call;");
  lines.push("    send the full new array, not a delta.");
  lines.push("");
  lines.push("Tagging entries (filtered views via query params):");
  lines.push("  • experience / projectsRecent / projectsDetailed each accept");
  lines.push("    a 'tags' array of lowercase strings. Optional, default [].");
  lines.push("  • Visitors can request a tailored view via URL params:");
  lines.push("      cv.ha7ch.com/<user>?for=openai     → entries tagged 'openai'");
  lines.push("      cv.ha7ch.com/<user>?role=designer  → entries tagged 'designer'");
  lines.push("      cv.ha7ch.com/<user>?focus=ml       → entries tagged 'ml'");
  lines.push("      cv.ha7ch.com/<user>?at=2026        → entries active in 2026");
  lines.push("  • for / role / focus all match against the same 'tags' array");
  lines.push("    (OR semantics; comma-separates lists, e.g. ?for=openai,anthropic).");
  lines.push("  • Conventions: company tags = lowercase company name; role tags =");
  lines.push("    track ('ml', 'designer', 'frontend', 'product'); topic tags =");
  lines.push("    domain ('research', 'systems', 'infra').");
  lines.push("  • When you update a resume, ASK the user whether to tag entries");
  lines.push("    for a specific company / role. Tags enable shareable URLs like");
  lines.push("    cv.ha7ch.com/<user>?for=openai instead of separate PDFs.");

  return lines.join("\n");
}

function shape(s: JsonSchema): string {
  if (s.type === "array") return `array of ${shape(s.items ?? {})}`;
  if (s.type === "object") return "object";
  return s.type ?? "value";
}

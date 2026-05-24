import "server-only";
import { z } from "zod";
import { getResumeByUsername, upsertResume, getVariantByAudience, upsertVariant, deleteVariant, listVariants } from "@/lib/resume-store";
import { RESUME_SCHEMA_TEXT } from "@/lib/schema-doc";
import {
  type ResumeData,
  type SectionName,
  resumeSchema,
  SECTION_NAMES,
  SECTION_SCHEMAS,
} from "@/types/resume";

export const TOOLS = [
  {
    name: "get_schema",
    description:
      "Show the resume schema — section names and field shapes. Call this before update_resume / update_section if you're unsure about field names; unknown keys are rejected by the validator.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_resume",
    description: "Fetch the authenticated user's current resume as structured JSON.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_resume",
    description:
      "Replace the authenticated user's entire resume. Use after parsing a PDF, or for large rewrites. " +
      "The 'username' and 'meta' fields are auto-managed — do not send them. " +
      "Required top-level sections: header, personalInfo, experience, education, " +
      "projectsRecent, projectsDetailed, skills, contact. Unknown keys are rejected — call get_schema first if unsure. " +
      "\n\nAFTER saving the base resume, follow this workflow:\n" +
      "1. ASK the user: 'Do you have a job description? Paste it and I'll create a tailored version.'\n" +
      "2. Also ask: 'Which audience is this for? A specific company (e.g. OpenAI), a role (e.g. designer, ML engineer), a language (en/zh), or a combination?'\n" +
      "3. Call list_variants to show existing variants and offer them as a base.\n" +
      "4. Rewrite relevant bullets/descriptions based on the JD and target audience.\n" +
      "5. Call set_variant with the audience key and the full tailored ResumeData.\n" +
      "6. Tell the user their shareable URL:\n" +
      "   • company: cv.ha7ch.com/<user>?company=openai\n" +
      "   • role: cv.ha7ch.com/<user>?role=designer\n" +
      "   • language: cv.ha7ch.com/<user>?lang=en\n" +
      "One base resume, many tailored variants — one URL per company/role/language.",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "object", description: "Full ResumeData object (without username/meta)." },
      },
      required: ["data"],
      additionalProperties: false,
    },
  },
  {
    name: "update_section",
    description:
      "Replace a single top-level section of the resume. Use for targeted conversational edits. " +
      "Each section has a strict shape — call get_schema to see field names, or get_resume to inspect the live structure. " +
      "When updating experience / projectsRecent / projectsDetailed, REMEMBER 'tags' (lowercase string array). " +
      "After saving, suggest tags to the user when relevant (company name for ?for=, role/topic for ?role=/?focus=).",
    inputSchema: {
      type: "object",
      properties: {
        section: { type: "string", enum: SECTION_NAMES },
        value: { description: "The new value for that section." },
      },
      required: ["section", "value"],
      additionalProperties: false,
    },
  },
  {
    name: "list_variants",
    description: "List all stored resume variants for the authenticated user. Returns audience keys and their URLs. Call this to show users what targeted versions they have, and to offer base options when creating a new variant.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_variant",
    description: "Fetch a specific variant's full resume JSON by audience key (e.g. 'openai', 'designer', 'en'). Use this to read an existing variant before creating a derived one.",
    inputSchema: {
      type: "object",
      properties: {
        audience: { type: "string", description: "The variant key, e.g. 'openai', 'designer', 'ml', 'en', 'zh'" },
      },
      required: ["audience"],
      additionalProperties: false,
    },
  },
  {
    name: "set_variant",
    description:
      "Store a complete tailored resume as a named variant. Use after rewriting bullets/descriptions based on a JD or target audience.\n\n" +
      "audience: the variant key — lowercase, no spaces (e.g. 'openai', 'designer', 'ml', 'en', 'zh').\n" +
      "data: full ResumeData object (same schema as update_resume, without username/meta).\n\n" +
      "After saving, tell the user their shareable URL:\n" +
      "  • company variant → cv.ha7ch.com/<user>?company=openai\n" +
      "  • role variant → cv.ha7ch.com/<user>?role=designer\n" +
      "  • language variant → cv.ha7ch.com/<user>?lang=en",
    inputSchema: {
      type: "object",
      properties: {
        audience: { type: "string", description: "Variant key, e.g. 'openai', 'designer', 'en'" },
        data: { type: "object", description: "Full ResumeData (without username/meta)" },
      },
      required: ["audience", "data"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_variant",
    description: "Delete a stored variant by audience key.",
    inputSchema: {
      type: "object",
      properties: {
        audience: { type: "string" },
      },
      required: ["audience"],
      additionalProperties: false,
    },
  },
] as const;

export type ToolName = (typeof TOOLS)[number]["name"];

// Audience keys are user-supplied values that become DB keys + URL slugs.
// Restrict to a conservative ASCII slug shape to keep them safe everywhere.
const AUDIENCE_RE = /^[a-z0-9][a-z0-9-]{0,30}$/;

// 256 KB ceiling on the serialized resume payload; anything larger is
// almost certainly abuse rather than a real CV.
const MAX_RESUME_PAYLOAD_BYTES = 256 * 1024;

function payloadByteLength(data: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(data)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

interface ToolContext { username: string }

export async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    switch (name as ToolName) {
      case "get_schema": {
        return text(RESUME_SCHEMA_TEXT);
      }

      case "get_resume": {
        const resume = await getResumeByUsername(ctx.username);
        if (!resume) return text(`No resume yet for @${ctx.username}. Use update_resume to publish one.`);
        return text(JSON.stringify(resume, null, 2));
      }

      case "update_resume": {
        if (!args.data || typeof args.data !== "object") {
          return error("Missing 'data' object.");
        }
        if (payloadByteLength(args.data) > MAX_RESUME_PAYLOAD_BYTES) {
          return error("Resume payload too large (limit 256 KB).");
        }
        const merged = {
          ...(args.data as Record<string, unknown>),
          username: ctx.username,
          meta: { updatedAt: new Date().toISOString() },
        };
        const result = resumeSchema.safeParse(merged);
        if (!result.success) {
          return error(`Invalid resume:\n${formatIssues(result.error)}`);
        }
        const saved = await upsertResume(result.data);
        return text(
          `Resume saved. View at /${ctx.username}.\n\n` +
          variantReminder(ctx.username) +
          `\nStored data:\n${JSON.stringify(saved, null, 2)}`,
        );
      }

      case "update_section": {
        const section = String(args.section);
        if (!isSectionName(section)) {
          return error(
            `Unknown section '${section}'. Allowed: ${SECTION_NAMES.join(", ")}.`,
          );
        }
        const sectionResult = SECTION_SCHEMAS[section].safeParse(args.value);
        if (!sectionResult.success) {
          return error(
            `Invalid value for section '${section}':\n${formatIssues(sectionResult.error)}`,
          );
        }
        const current =
          (await getResumeByUsername(ctx.username)) ?? emptyResume(ctx.username);
        const next: ResumeData = {
          ...current,
          [section]: sectionResult.data,
          username: ctx.username,
        };
        await upsertResume(next);
        return text(`Section '${section}' updated.`);
      }

      case "list_variants": {
        const variants = await listVariants(ctx.username);
        if (variants.length === 0) {
          return text("No variants yet. Use set_variant to create a tailored version.");
        }
        const lines = variants.map(({ audience, updatedAt }) => {
          const url = `cv.ha7ch.com/${ctx.username}?company=${audience}`;
          return `  • ${audience} (updated ${updatedAt.slice(0, 10)}) — ${url}`;
        });
        return text(`Stored variants:\n${lines.join("\n")}`);
      }

      case "get_variant": {
        const audience = String(args.audience ?? "").toLowerCase().trim();
        if (!audience) return error("Missing 'audience'.");
        if (!AUDIENCE_RE.test(audience)) {
          return error("Invalid audience format.");
        }
        const variant = await getVariantByAudience(ctx.username, audience);
        if (!variant) return error(`No variant found for '${audience}'.`);
        return text(JSON.stringify(variant, null, 2));
      }

      case "set_variant": {
        const audience = String(args.audience ?? "").toLowerCase().trim();
        if (!audience) return error("Missing 'audience'.");
        if (!AUDIENCE_RE.test(audience)) {
          return error("Invalid audience format. Use 1–31 chars: a–z, 0–9, hyphen (must start with a–z or 0–9).");
        }
        if (!args.data || typeof args.data !== "object") return error("Missing 'data' object.");
        if (payloadByteLength(args.data) > MAX_RESUME_PAYLOAD_BYTES) {
          return error("Variant payload too large (limit 256 KB).");
        }
        const merged = {
          ...(args.data as Record<string, unknown>),
          username: ctx.username,
          meta: { updatedAt: new Date().toISOString() },
        };
        const result = resumeSchema.safeParse(merged);
        if (!result.success) return error(`Invalid resume:\n${formatIssues(result.error)}`);
        await upsertVariant(ctx.username, audience, result.data);
        const urlParam = audience.length === 2 ? `lang=${audience}` : `company=${audience}`;
        return text(
          `Variant '${audience}' saved.\n` +
          `Share at: cv.ha7ch.com/${ctx.username}?${urlParam}\n\n` +
          `(Use ?role=${audience} or ?focus=${audience} if this is a role/topic variant.)`
        );
      }

      case "delete_variant": {
        const audience = String(args.audience ?? "").toLowerCase().trim();
        if (!audience) return error("Missing 'audience'.");
        if (!AUDIENCE_RE.test(audience)) {
          return error("Invalid audience format.");
        }
        await deleteVariant(ctx.username, audience);
        return text(`Variant '${audience}' deleted.`);
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

function isSectionName(s: string): s is SectionName {
  return (SECTION_NAMES as readonly string[]).includes(s);
}

function formatIssues(err: z.ZodError): string {
  return err.issues
    .map((issue) => {
      const path = issue.path.length
        ? issue.path.map((p) => String(p)).join(".")
        : "(root)";
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");
}

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

function error(s: string) {
  return { content: [{ type: "text" as const, text: s }], isError: true };
}

function variantReminder(_username: string): string {
  return (
    `\nNext step: ask the user "Do you have a job description? I can create a tailored variant."\n` +
    `Then use set_variant to store a complete targeted resume.\n` +
    `Shareable URLs: ?company=<name>  ?role=<track>  ?focus=<topic>  ?lang=en|zh`
  );
}

function emptyResume(username: string): ResumeData {
  return {
    username,
    header: { name: username },
    personalInfo: { email: "" },
    experience: [], education: [], projectsRecent: [],
    projectsDetailed: [], skills: [], contact: [],
    meta: { updatedAt: new Date().toISOString() },
  };
}

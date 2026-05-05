import "server-only";
import { z } from "zod";
import { getResumeByUsername, upsertResume } from "@/lib/resume-store";
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
      "AFTER saving, ALWAYS ask the user: 'Want to tag any of these experiences/projects for a specific company or role? " +
      "Tagged entries enable shareable URLs like cv.ha7ch.com/<user>?for=openai or ?role=designer instead of maintaining separate PDFs.' " +
      "Each experience/project accepts a 'tags' array of lowercase strings (e.g. tags: ['openai', 'ml']).",
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
] as const;

export type ToolName = (typeof TOOLS)[number]["name"];

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
        return text(`Resume saved. View at /${ctx.username}.\n\nStored data:\n${JSON.stringify(saved, null, 2)}`);
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

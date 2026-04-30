import "server-only";
import { getResumeByUsername, upsertResume } from "@/lib/resume-store";
import type { ResumeData } from "@/types/resume";

export const TOOLS = [
  {
    name: "get_resume",
    description: "Fetch the authenticated user's current resume as structured JSON.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_resume",
    description:
      "Replace the authenticated user's entire resume. Use after parsing a PDF, or for large rewrites. The 'username' and 'meta' fields are auto-managed.",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "object", description: "Full ResumeData object." },
      },
      required: ["data"],
      additionalProperties: false,
    },
  },
  {
    name: "update_section",
    description:
      "Replace a single top-level section of the resume. Use for targeted conversational edits.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: [
            "header", "personalInfo", "experience", "education",
            "projectsRecent", "projectsDetailed", "skills", "contact",
          ],
        },
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
      case "get_resume": {
        const resume = await getResumeByUsername(ctx.username);
        if (!resume) return text(`No resume yet for @${ctx.username}. Use update_resume to publish one.`);
        return text(JSON.stringify(resume, null, 2));
      }

      case "update_resume": {
        const data = args.data as ResumeData;
        if (!data || typeof data !== "object") return error("Missing 'data' object.");
        await upsertResume({ ...data, username: ctx.username });
        return text(`Resume saved. View at /${ctx.username}.`);
      }

      case "update_section": {
        const section = String(args.section);
        const current = (await getResumeByUsername(ctx.username)) ?? emptyResume(ctx.username);
        const next = { ...current, [section]: args.value, username: ctx.username } as ResumeData;
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

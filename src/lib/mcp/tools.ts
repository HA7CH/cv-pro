import "server-only";
import {
  getResumeByUsername,
  upsertResume,
  listVersions,
  rollbackResume,
} from "@/lib/resume-store";
import type { ResumeData } from "@/types/resume";

export const TOOLS = [
  {
    name: "get_resume",
    description:
      "Fetch the authenticated user's current resume as a structured JSON object.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "update_resume",
    description:
      "Replace the authenticated user's entire resume. Use after parsing a PDF into the ResumeData shape, or for large rewrites.",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "object",
          description:
            "Full ResumeData object. The 'username' field is overridden by the authenticated user. The 'meta' field is auto-managed.",
        },
      },
      required: ["data"],
      additionalProperties: false,
    },
  },
  {
    name: "update_section",
    description:
      "Replace a single top-level section of the resume (e.g. experience, education, skills). Use for targeted edits in conversation.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: [
            "header",
            "personalInfo",
            "experience",
            "education",
            "projectsRecent",
            "projectsDetailed",
            "skills",
            "contact",
          ],
        },
        value: {
          description: "The new value for that section.",
        },
      },
      required: ["section", "value"],
      additionalProperties: false,
    },
  },
  {
    name: "list_versions",
    description: "List the most recent 10 historical versions of the resume.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "rollback",
    description:
      "Roll the resume back to a previous version (creating a new version on top).",
    inputSchema: {
      type: "object",
      properties: {
        version: { type: "integer", minimum: 1 },
      },
      required: ["version"],
      additionalProperties: false,
    },
  },
] as const;

export type ToolName = (typeof TOOLS)[number]["name"];

interface ToolContext {
  username: string;
}

export async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    switch (name as ToolName) {
      case "get_resume": {
        const resume = await getResumeByUsername(ctx.username);
        if (!resume) {
          return text(
            `No resume yet for @${ctx.username}. Use update_resume to publish one.`,
          );
        }
        return text(JSON.stringify(resume, null, 2));
      }

      case "update_resume": {
        const data = args.data as ResumeData;
        if (!data || typeof data !== "object") {
          return error("Missing 'data' object.");
        }
        const merged = { ...data, username: ctx.username };
        const next = await upsertResume(merged);
        return text(
          `Resume saved at version ${next.meta.version}. View at /${ctx.username}.`,
        );
      }

      case "update_section": {
        const section = String(args.section);
        const value = args.value;
        const current =
          (await getResumeByUsername(ctx.username)) ?? emptyResume(ctx.username);
        const next = {
          ...current,
          [section]: value,
        } as ResumeData;
        next.username = ctx.username;
        const saved = await upsertResume(next);
        return text(
          `Section '${section}' updated. Now at version ${saved.meta.version}.`,
        );
      }

      case "list_versions": {
        const versions = await listVersions(ctx.username);
        if (versions.length === 0) return text("No prior versions yet.");
        return text(
          versions
            .map(
              (v) =>
                `v${v.version} — ${new Date(v.created_at).toLocaleString()}`,
            )
            .join("\n"),
        );
      }

      case "rollback": {
        const version = Number(args.version);
        if (!Number.isInteger(version) || version < 1) {
          return error("Invalid 'version'.");
        }
        const next = await rollbackResume(ctx.username, version);
        return text(
          `Rolled back to v${version}. New current version is v${next.meta.version}.`,
        );
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return error(msg);
  }
}

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

function error(s: string) {
  return {
    content: [{ type: "text" as const, text: s }],
    isError: true,
  };
}

function emptyResume(username: string): ResumeData {
  return {
    username,
    header: { name: username },
    personalInfo: { email: "" },
    experience: [],
    education: [],
    projectsRecent: [],
    projectsDetailed: [],
    skills: [],
    contact: [],
    meta: { updatedAt: new Date().toISOString(), version: 0 },
  };
}

import type { ResumeData } from "@/types/resume";

/**
 * Render a resume as plain text — ATS-friendly and human-readable.
 *
 * Mirrors the section order of ResumeTemplate. Deliberately avoids tables,
 * columns, and box-drawing characters so applicant-tracking systems and
 * `curl`/agents parse it cleanly. Dates sit inline after each title rather
 * than right-aligned, because column alignment breaks on CJK-width glyphs.
 */
export function resumeToText(data: ResumeData): string {
  const lines: string[] = [];
  const underline = (s: string) => "=".repeat(Math.max(s.length, 3));

  // Header
  lines.push(data.header.name);

  // Contact — email · phone · location, then labelled links one per line
  const contactBits = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
  ].filter(Boolean);
  if (contactBits.length) lines.push("", contactBits.join("  ·  "));
  for (const c of data.contact) lines.push(`${c.label}: ${c.url}`);

  const section = (title: string) => {
    lines.push("", "", title.toUpperCase(), underline(title));
  };

  if (data.education.length) {
    section("Education");
    for (const e of data.education) {
      lines.push("", titleWithRange(e.school, formatRange(e.startDate, e.endDate)));
      const sub = [e.degree, e.major].filter(Boolean).join(", ");
      if (sub) lines.push(sub);
    }
  }

  if (data.experience.length) {
    section("Experience");
    for (const job of data.experience) {
      const head = [job.company, job.role].filter(Boolean).join(" — ");
      lines.push("", titleWithRange(head, formatRange(job.startDate, job.endDate)));
      for (const b of job.bullets) lines.push(`  - ${b}`);
    }
  }

  if (data.projectsDetailed.length || data.projectsRecent.length) {
    section("Projects");
    for (const p of data.projectsDetailed) {
      const head = [p.title, p.type].filter(Boolean).join(" — ");
      const range = p.endDate ? formatRange(p.startDate, p.endDate) : p.startDate;
      lines.push("", titleWithRange(head, range));
      if (p.award) lines.push(p.award);
      if (p.url) lines.push(p.url);
      for (const b of p.bullets) lines.push(`  - ${b}`);
    }
    for (const p of data.projectsRecent) {
      lines.push("", p.url ? `${p.title}  (${p.url})` : p.title);
      if (p.description) lines.push(p.description);
    }
  }

  if (data.skills.length) {
    section("Skills");
    lines.push("");
    for (const cat of data.skills) lines.push(`${cat.name}: ${cat.items.join(", ")}`);
  }

  lines.push("", "", `cv.ha7ch.com/${data.username}`);

  // Collapse any run of blank lines down to a single separator.
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function titleWithRange(title: string, range: string): string {
  return range ? `${title}   (${range})` : title;
}

function formatRange(start: string, end: string): string {
  if (!start && !end) return "";
  if (!end) return start;
  if (!start) return end;
  return `${start} - ${end}`;
}

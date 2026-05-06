import type { ResumeData } from "@/types/resume";

export interface AppliedFilters {
  /** Lowercase tag strings to match against entry.tags (OR semantics). */
  tags: string[];
}

export interface FilterResult {
  /** Resume with experience/projects filtered. Other sections unchanged. */
  resume: ResumeData;
  /** True iff at least one filter was applied (used to show the banner). */
  active: boolean;
  /** What got applied — for banner display and "Show all" reset. */
  filters: AppliedFilters;
  /** Counts before/after filter, for "Showing N of M" display. */
  totals: { before: number; after: number };
}


const TAG_KEYS = ["company", "role", "focus", "lang"] as const;

export function collectTagsFromParams(
  params: URLSearchParams | { get(k: string): string | null },
): Set<string> {
  const tags = new Set<string>();
  for (const key of TAG_KEYS) {
    const v = params.get(key);
    if (!v) continue;
    for (const t of v.split(",")) {
      const trimmed = t.trim().toLowerCase();
      if (trimmed) tags.add(trimmed);
    }
  }
  return tags;
}

interface DateBounded {
  startDate?: string;
  endDate?: string;
}

interface Tagged {
  tags?: string[];
}

export function applyResumeFilters(
  resume: ResumeData,
  params: URLSearchParams | { get(k: string): string | null },
): FilterResult {
  const wantedTags = collectTagsFromParams(params);

  const totalBefore =
    resume.experience.length +
    resume.projectsRecent.length +
    resume.projectsDetailed.length;

  if (!wantedTags.size) {
    return {
      resume,
      active: false,
      filters: { tags: [] },
      totals: { before: totalBefore, after: totalBefore },
    };
  }

  const matches = (entry: Tagged & DateBounded): boolean => {
    if (wantedTags.size) {
      const tags = new Set((entry.tags ?? []).map((s) => s.toLowerCase()));
      const tagHit = [...wantedTags].some((t) => tags.has(t));
      if (!tagHit) return false;
    }
    return true;
  };

  const filtered: ResumeData = {
    ...resume,
    experience: resume.experience.filter(matches),
    projectsRecent: resume.projectsRecent.filter(matches),
    projectsDetailed: resume.projectsDetailed.filter(matches),
  };

  const totalAfter =
    filtered.experience.length +
    filtered.projectsRecent.length +
    filtered.projectsDetailed.length;

  // Recipient safety: if the filter wiped out everything filterable
  // (sender mistyped a tag, or simply no entry matches), don't show
  // the recipient a broken stub. Fall back to the unfiltered resume —
  // the URL still acts as a private label for the sender, but the
  // recipient sees a complete page instead of a "skills only" husk.
  if (totalAfter === 0 && totalBefore > 0) {
    return {
      resume,
      active: false,
      filters: { tags: [] },
      totals: { before: totalBefore, after: totalBefore },
    };
  }

  return {
    resume: filtered,
    active: true,
    filters: { tags: [...wantedTags] },
    totals: { before: totalBefore, after: totalAfter },
  };
}


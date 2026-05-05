# Tagged resume views — `?for=` `?role=` `?at=`

Date: 2026-05-06
Status: in progress (Phase 1)

## Goal

Let visitors load a single resume URL with a query string that re-renders
the resume from a different angle:

- `cv.ha7ch.com/lawted?for=openai` — emphasize items relevant to OpenAI
- `cv.ha7ch.com/lawted?role=designer` — emphasize design-track items
- `cv.ha7ch.com/lawted?focus=ml` — emphasize ML-track items (alias of role)
- `cv.ha7ch.com/lawted?at=2026` — show only items active in/around 2026

This is the wedge — "one live URL, many tailored views" instead of
maintaining multiple PDFs per audience.

## Non-goals (explicitly punted)

- LLM-driven re-ranking on every request (cost). Tags are static metadata
  written once at edit time. LLM can *help* the user pick tags but never
  runs at view time.
- "Generate a cover-letter-style summary for `?for=stripe`" — this is the
  Phase 3 idea and stays out of Phase 1/2.
- Invite-only / private views. All views are public, just like the base URL.

## Architecture (Phase 1: tags-based filter, 0 runtime token cost)

### Schema change

Add an optional `tags?: string[]` field to entries that are filterable:

- `workExperienceSchema` → `tags`
- `projectShortSchema` → `tags`
- `projectDetailedSchema` → `tags`

Education / skills / contact / personalInfo do NOT get tags — they appear
in every view.

Tags are free-form lowercase strings. Conventional shapes:

- Company tags: `"openai"`, `"anthropic"`, `"stripe"` — match `?for=`
- Role tags: `"ml"`, `"designer"`, `"frontend"`, `"product"` — match `?role=` and `?focus=`
- Topic tags: `"research"`, `"systems"`, `"infra"` — match `?focus=`

Both `role` and `focus` query params share the same tag namespace
(`?role=designer` and `?focus=designer` are equivalent). This keeps the
mental model simple: one tag list per entry, multiple ways to query it.

### Filter logic (server-side, in `[username]/page.tsx`)

Pseudo:

```ts
function filterResume(resume, params) {
  const want = collectTags(params);  // set of lowercase tags from for/role/focus
  const yearFilter = params.get("at"); // string "2026" if present

  if (!want.size && !yearFilter) return { resume, active: false };

  const keepEntry = (entry) => {
    if (want.size) {
      const tags = new Set((entry.tags ?? []).map(s => s.toLowerCase()));
      const matchTag = [...want].some(t => tags.has(t));
      if (!matchTag) return false;
    }
    if (yearFilter) {
      if (!isActiveAtYear(entry.startDate, entry.endDate, yearFilter)) return false;
    }
    return true;
  };

  return {
    resume: {
      ...resume,
      experience: resume.experience.filter(keepEntry),
      projectsRecent: resume.projectsRecent.filter(keepEntry),
      projectsDetailed: resume.projectsDetailed.filter(keepEntry),
    },
    active: true,
    appliedFilters: { tags: [...want], year: yearFilter },
  };
}
```

`isActiveAtYear(start, end, year)`:

- If `start` parses to a year ≤ `year`, AND (`end` empty / `end === "Present"` /
  end-year ≥ `year`) → keep
- If neither parses → keep (be permissive — bad data shouldn't disappear)

### View change (`ResumeTemplate.tsx`)

Add an optional top banner that appears only when filters are active:

```
Showing 4 of 12 items · filter: for=openai, role=designer · [Show all]
```

- Banner is full-width below the header, before sections start.
- "Show all" links to the bare `/{username}` URL (resets all filters).
- Banner uses muted-foreground color, not loud.

If a section becomes empty after filtering, hide it entirely (don't show
"Experience" with no rows).

### URL → tag mapping (single helper)

```ts
function collectTags(params: URLSearchParams): Set<string> {
  const tags = new Set<string>();
  for (const key of ["for", "role", "focus"]) {
    const v = params.get(key);
    if (v) v.split(",").forEach(t => tags.add(t.trim().toLowerCase()));
  }
  return tags;
}
```

`?for=openai,anthropic` and `?role=ml,designer` are supported (comma
list = OR). Across keys it's also OR — match if entry has *any* listed tag.

## Architecture (Phase 2: agent-assisted tagging)

The CLI/MCP layer should make tags ergonomic. Two changes:

1. **MCP tool description hint** — when the agent calls `update_resume` or
   `update_section`, the tool description teaches it: "Each entry can carry
   a `tags` array. After saving, ask the user if they want to tag this
   entry for a specific company (e.g. `tags: ['openai']`) or role." This
   is a passive nudge, no new tool needed.

2. **schema-doc.ts** — surface the `tags` field in the human-readable
   schema doc that's exposed at `/api/v1/schema` and via `get_schema` MCP
   tool, so any AI agent reading the doc sees the field exists and what
   it's for.

3. **`llms.txt`** — add a "Tagging entries" section explaining the URL
   convention (`?for=openai`) so agents reading the site-level doc know
   to suggest tags during edits.

No new MCP tool, no new CLI command. Tags live inside `WorkExperience`
and `Project*` shapes — agents can already read/write them via existing
`update_resume` / `update_section`.

## Architecture (Phase 3: optional, post-MVP)

- Resume page UI: chip bar at the top auto-derived from all unique tags
  in the resume, letting visitors click to add/remove a filter without
  knowing the URL syntax.
- A `?lang=zh` view (separate from tags) — needs bilingual content support
  in the schema; out of scope here.

## Backward compatibility

`tags` is optional everywhere. Existing 9 resumes in the DB pass schema
validation as-is (their entries have no `tags` field; `tags?: string[]`
makes that legal). No DB migration needed.

When `?for=...` is used against a resume that has zero tags, every section
becomes empty — but that's the correct UX ("nothing matches"). The banner
makes it discoverable: "Showing 0 of 12 items · for=openai · [Show all]".

## Test plan

- Unit: filterResume with several fixture resumes — empty tags, partial
  tags, full tags, year matches/misses.
- Manual: visit `/lawted?for=openai`, `/lawted?role=designer`, `/lawted?at=2026`,
  `/lawted` (baseline) — confirm banner shows correctly and "Show all"
  resets.
- Type: tsc passes; new optional fields don't break existing usage.

## Phase ordering

- **Phase 1 (this iteration):** schema + filter + banner. Ship behind the
  scenes — no UI changes elsewhere. New URLs work immediately.
- **Phase 2 (next iteration):** schema-doc + MCP tool description + llms.txt
  updates. Lets agents discover/use tags during update flow.
- **Phase 3:** chip bar UI on resume page. Cosmetic / convenience.

The wedge ("Send `cv.ha7ch.com/lawted?for=openai`") works after Phase 1.
Phase 2 makes it self-explanatory to AI agents. Phase 3 makes it
clickable for end users.

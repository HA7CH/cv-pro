# PDF Export: Puppeteer-rendered with strict single-page (with floor)

**Status:** Draft for implementation
**Branch:** `pdf-puppeteer-onepage`
**Date:** 2026-05-08

---

## Problem

The current PDF export uses client-side `window.print()`. The output suffers from three concrete problems:

1. **Margins look unprofessional** — controlled by the user's print dialog, not by us.
2. **No single-page guarantee** — content overflows and breaks awkwardly.
3. **Font fallback risk** — depends on the user's locally installed fonts.

We want PDFs that are deterministic, professional-looking, and respect a strict single-page constraint when the user asks for industry-style export — but only down to a sensible floor, after which we surface the overflow back to the user instead of compressing forever.

## Goals

- Server-rendered PDF, identical visual output regardless of viewer's browser.
- Strict A4 single-page output for industry use cases (down to a `0.85` scale floor).
- Natural multi-page flow for academic use cases.
- When industry mode hits the floor, fall back to natural pagination and surface a toast explaining what to do.
- Professional margins, embedded fonts, vector text.

## Non-goals

- Production deployment of Puppeteer (local development only for this iteration). A wrapper interface is in scope so we can swap to `@sparticuz/chromium` or Browserless later without changing call sites.
- Server-side rendering of the React template directly. We render via Puppeteer hitting the live Next.js page, which is the simplest and most faithful path.
- Multi-language PDF copy (existing language variants continue to work; no PDF-specific copy changes).
- Auto-rewriting user content to fit. Floor is a hard stop; the user must edit content.

## Architecture

### Request flow

```
Browser
  │  user clicks PDF button → picks Industry or Academic
  │
  ▼
GET /api/pdf/[handle]?audience=industry|academic[&variant=<key>][&lang=<code>]
  │
  ▼
Next.js Route Handler (Node runtime)
  │
  │  1. launch Puppeteer (via lib/pdf/render.ts wrapper)
  │  2. open http://localhost:3000/{handle}?print=1[&variant=...][&lang=...]
  │  3. wait for fonts ready + body rendered
  │  4. measure document.body.scrollHeight
  │  5. compute ratio = (A4_content_height) / scrollHeight
  │  6. branch:
  │       - audience=industry & ratio < 0.85 → pdf({ scale: 1 }) [natural multi-page] + mark X-Page-Fit-Result: overflow
  │       - audience=industry & ratio ≥ 0.85 → pdf({ scale: clamp(ratio, 0.85, 1) }) [strict 1 page]
  │       - audience=academic                → pdf({ scale: 1 }) [natural multi-page, no scaling]
  │  7. attach PDF metadata (title / author / subject)
  │  8. close browser
  │
  ▼
Response: PDF bytes + headers
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="{Name}_Resume[_variant].pdf"
  - X-Page-Fit-Result: ok | overflow
  │
  ▼
Browser
  - triggers download
  - if header indicates overflow → toast: "Content exceeded one page. Saved as 2 pages. Trim ~{N} characters to force single-page."
```

### Files & boundaries

| File | Purpose | Why this boundary |
|---|---|---|
| `src/app/api/pdf/[handle]/route.ts` | Next.js Route Handler. Parses query params, invokes the render lib, returns PDF bytes + headers. | Thin transport layer; no Puppeteer specifics leak here. |
| `src/lib/pdf/render.ts` | Puppeteer wrapper: `launch()`, `measure()`, `renderPdf()`. Exposes `renderResumePdf({ url, audience }) → { pdf, fitResult }`. | All Puppeteer logic lives behind one interface so we can swap implementations (`@sparticuz/chromium`, Browserless) without touching the route. |
| `src/lib/pdf/constants.ts` | A4 dimensions in mm, content area minus margin, scale floor (`0.85`), margin (`12mm`). | Single source of truth for pagination math. |
| `src/components/resume/ResumeView.tsx` | Replace Concise/Full picker with Industry/Academic. Replace `window.print()` with `fetch('/api/pdf/...')` + blob download. Show toast on overflow. | Existing client; new download flow integrates cleanly. |
| `src/components/resume/ResumeTemplate.tsx` | Add `print` mode. When `?print=1`, hide nav, footer, PDF button. Skill is the same template otherwise. | Server-side renderer reuses the existing template; no second template to maintain. |
| `src/app/globals.css` | Update `@page` to A4 + 12mm. Add print-mode rules to hide chrome elements. | Keeps print stylesheet co-located with site styles. |
| `package.json` | Add `puppeteer` dependency. | Self-contained Chromium for local dev. |

### Print mode contract

When `?print=1` is on the URL, the rendered page must:

- Hide all elements with `print:hidden` Tailwind class (already in place)
- Render only `<ResumeTemplate>` content — no nav toggle, no PDF button, no footer
- Use `density="standard"` always (the audience knob is on the API side, not the template)
- Render against a white background, no decorative borders that bleed past A4

### Measurement and scaling

The math:

```ts
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 12;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - 2 * MARGIN_MM; // 273mm
const PX_PER_MM = 96 / 25.4; // ~3.78
const CONTENT_HEIGHT_PX = CONTENT_HEIGHT_MM * PX_PER_MM; // ~1031px

const scrollHeightPx = await page.evaluate(() => document.body.scrollHeight);
const ratio = CONTENT_HEIGHT_PX / scrollHeightPx;

const FLOOR = 0.85;
const fits = ratio >= FLOOR;
const scale = fits ? Math.min(ratio, 1) : 1; // ≥1 means already fits, no upscale
```

`page.pdf({ scale })` accepts values in `[0.1, 2.0]`. We clamp to `[FLOOR, 1]`.

We do not iterate. One measurement, one ratio, one scaled render. Re-measuring after scaling is unnecessary because Puppeteer's scale is applied at PDF generation time (after layout); line breaks do not change with `scale`. (This is different from CSS `transform: scale()`, which we explicitly do not use due to known Puppeteer issue #5162.)

### Audience semantics

| Audience | Compress to fit? | Floor enforced? | Pagination |
|---|---|---|---|
| `industry` | Yes (scale ≤ 1) | Yes (≥ 0.85) | Single page if fits, else 2+ pages with `X-Page-Fit-Result: overflow` |
| `academic` | No | n/a | Natural pagination, never scales |

The `audience` parameter replaces the existing `density: compact | standard` picker. The semantics are about **export intent**, not visual density.

### Toast copy (overflow path)

When `X-Page-Fit-Result: overflow`, show a non-blocking toast:

> Content exceeded one page. Saved as 2 pages. Edit your resume to trim it down for a single-page export.

We do not estimate "how many characters to trim" — the estimate is brittle and the toast works fine without a number.

### Filename and PDF metadata

| Field | Value | Source |
|---|---|---|
| `Content-Disposition` filename | `{Name}_Resume[_variant].pdf` | `data.header.name`, query `variant` |
| PDF Title | `{Name} — Resume` | `data.header.name` |
| PDF Author | `{Name}` | `data.header.name` |
| PDF Subject | `data.header.tagline` | tagline |
| PDF Creator | `cv.ha7ch.com` | constant |

**Filename sanitization**: `{Name}` is taken from `data.header.name` with spaces replaced by underscores. For non-ASCII characters (e.g., Chinese names), use RFC 5987 `filename*=UTF-8''<encoded>` syntax in `Content-Disposition` so modern browsers render the original characters; provide a `filename="..."` ASCII-only fallback (latin-1 transliterated or stripped) for older clients.

**ResumeView → API: how the client knows which `variant` to request**

The current resume page reads variant key from URL search params (`?company=`, `?role=`, `?focus=`, `?lang=`). The client passes whichever search param is present through to `/api/pdf/[handle]?audience=...&variant=<key>`. The route handler reuses the same matching logic that the public page uses (centralized in a helper, e.g. `resolveVariantFromSearchParams`) so client and server agree on which variant gets rendered.

## Error handling

| Failure | HTTP | Client behavior |
|---|---|---|
| Puppeteer launch failure | 503 | Toast: "PDF service unavailable, retry" |
| Page navigation timeout (>15s) | 504 | Toast: "Render timed out, retry" |
| Resume not found (404 from page) | 404 | Toast: "Resume not found" |
| Unknown error | 500 | Toast: "Something went wrong" |

Puppeteer browser instance is always closed in `finally`. We do not pool browsers in this iteration; cold-launch every request. Performance is acceptable for local dev (~2-3s per PDF).

## Font handling

Currently fonts are loaded via `next/font` variables. For Puppeteer to render with the correct fonts:

- `next/font` already self-hosts the WOFF2 files in production builds, so Puppeteer hitting the dev server gets the same files.
- We add `await page.evaluateHandle('document.fonts.ready')` before measurement to ensure fonts have loaded before we compute scrollHeight.

If any font fails to load (e.g., dev server not warmed up), we accept the default measurement; the visual fidelity loss is acceptable in dev.

## Testing strategy

- Manual smoke test: render `apple-eng` and `apple-pm` variants in industry mode, verify single-page output and clean margins.
- Manual edge case: render the `en` base resume in industry mode after artificially padding bullets to ~3 pages of content; verify floor triggers and overflow header surfaces.
- Manual academic test: render base resume in academic mode; verify natural multi-page output with no scaling.
- No automated tests in this iteration; PDF binary diffing is brittle.

## Open questions resolved during brainstorming

| Question | Decision |
|---|---|
| Deploy target | Local dev only; wrapper interface for future swap |
| Floor behavior | Natural multi-page + toast (Option D) |
| Density picker fate | Renamed to Industry/Academic with new semantics |
| Measurement algorithm | One-shot ratio + Puppeteer `page.pdf({ scale })` |
| Page size | A4 (replacing current Letter) |
| Margin | 12mm all sides |
| Floor value | 0.85 |

## Risk and rollback

- **Risk:** Puppeteer doesn't ship in production. Mitigation: this iteration is local-only by design; production deploy is explicitly a follow-up. The `lib/pdf/render.ts` wrapper means swapping to `@sparticuz/chromium` later is a one-file change.
- **Risk:** Font loading race condition. Mitigation: `document.fonts.ready` await; visual diff vs the live page during smoke test.
- **Rollback:** revert the branch. The old `window.print()` flow stays untouched on `main`.

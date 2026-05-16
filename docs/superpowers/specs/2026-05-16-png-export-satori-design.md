# PNG Export: Satori + Resvg with parallel image template

**Status:** Draft for implementation
**Branch:** TBD (likely `png-export-satori`)
**Date:** 2026-05-16

---

## Problem

cv.pro currently exports resumes only as PDF (via `window.print()`, with a Puppeteer-based replacement spec'd in `2026-05-08-pdf-puppeteer-onepage-design.md`). Users have a recurring need to share the resume as an image — pasted in Notion, Slack, social posts, recruiter DMs, OG-style previews — and a PDF does not cover those use cases.

PNG is the right primitive for those flows: it embeds anywhere, no viewer required, no offline-vs-online HTML asset problem (which has burnt the user with the current HTML export).

## Goals

- One-click PNG download from the resume page.
- Server-side rendering: deterministic output independent of the viewer's browser, fonts, and zoom level.
- Sharp output on retina screens (≥ 2× density).
- Same variant resolution as the live page (`?company=`, `?role=`, `?focus=`, `?lang=`).
- No density picker — single export action per format. (PDF export is also being simplified to drop the Concise/Full split; PNG mirrors that decision.)
- No new heavy runtime dependency (no Chromium) — the production deploy story stays simple.

## Non-goals

- SVG export. (Confirmed during brainstorming: high-DPI PNG covers all share/embed use cases.)
- Multi-page paginated PNG. Content taller than A4 yields a tall single image; we do not slice.
- Transparent background or theme variants.
- Client-side fallback path. PNG export is server-only.
- Code reuse with the planned PDF Puppeteer route. PDF uses Puppeteer for strict pagination and live-page parity; PNG uses Satori for serverless-friendly rendering. They are two independent pipelines.
- Auto-rewriting content to fit a single image height. We render natural flow.

## Approach

Render server-side via [Satori](https://github.com/vercel/satori) (JSX → SVG) and [@resvg/resvg-js](https://github.com/yisibl/resvg-js) (SVG → PNG). Both are pure JS / WASM, no Chromium binary, deploy unchanged to Vercel/serverless.

## Architecture

### Request flow

```
Browser
  │  user clicks PNG button (single action, no submenu)
  │
  ▼
GET /api/png/[handle][?company=<key> | ?role=<key> | ?focus=<key> | ?lang=<key>]
  │
  ▼
Next.js Route Handler (Node runtime)
  │
  │  1. resolve handle → fetch ResumeData (reuse existing data loader)
  │  2. resolve variant from search params (reuse resolveVariantFromSearchParams)
  │  3. call renderResumePng({ data }) → Buffer
  │  4. attach response headers (filename via Content-Disposition)
  │
  ▼
Response: PNG bytes
  - Content-Type: image/png
  - Content-Disposition: attachment; filename="{Name}_Resume[_variant].png"
  │
  ▼
Browser triggers download
```

### Render pipeline

```
ResumeData
  → <ResumeImageTemplate data={data} />                    // Satori-friendly JSX
  → satori(node, { width: 1240, fonts: loadedFonts })      // SVG string
  → new Resvg(svg, { fitTo: { mode: 'width', value: 1240 } })
  → resvg.render().asPng()                                 // PNG Buffer
```

Satori is given a fixed **width** (1240px). Height is left to flow with content via Satori's content sizing — Satori supports rendering with an unspecified height when `height` is omitted from options (it computes from the rendered tree). The output PNG is therefore A4-width-aspect with whatever height the content demands.

### Files & boundaries

| File | Purpose | Why this boundary |
|---|---|---|
| `src/app/api/png/[handle]/route.ts` | HTTP transport: parse params, call render lib, return PNG + headers. | Thin route, no Satori/Resvg specifics leak here. |
| `src/lib/image/render.ts` | Wraps Satori + Resvg. Exposes `renderResumePng({ data }) → Promise<Buffer>`. Owns the SVG → PNG conversion and the Satori options. | All image-rendering logic in one place; route handler stays declarative. |
| `src/lib/image/fonts.ts` | Loads TTF font files once at module init, returns `{ fonts: SatoriOptions['fonts'] }`. Cached across requests via module scope. | Font loading is async + slow on cold start; we never want to repeat it per request. |
| `src/lib/image/constants.ts` | `IMAGE_WIDTH_PX = 1240`, background color, default font weights mapping. | Single source of truth. |
| `src/components/resume/ResumeImageTemplate.tsx` | Satori-compatible parallel template. Takes `{ data }`. Uses inline `style` props (not `className`). | Live template uses Tailwind; Satori needs inline styles or its `tw` prop. Parallel template keeps the contract explicit. |
| `src/components/resume/ResumeView.tsx` | Add a "PNG" download button (single action, no submenu). Click → `fetch('/api/png/...')` → blob → trigger download. | Existing client surface; no new component file needed. |
| `public/fonts/*.ttf` | TTF source files (must be TTF or OTF for Satori; WOFF2 is unsupported). | Shipped alongside the app so font loading is filesystem-fast. |

### Why a parallel `ResumeImageTemplate`

Satori does not run Tailwind. It supports:
- Inline `style={{...}}` with a subset of CSS (flex, position, color, border, font, padding, margin, gap, basic transforms).
- Or its own `tw="..."` prop with a subset of Tailwind utilities.

The live `ResumeTemplate` uses Tailwind v4 via `className`. Today's classes (`flex`, `gap-*`, `text-zinc-*`, `border-t`, `mt-*`, `font-semibold`, etc.) are simple enough to translate, but:

- Coupling the live template to Satori's CSS subset locks Tailwind usage going forward — any future addition of a non-Satori-supported feature would silently break PNG output.
- Image rendering and document rendering have different constraints (e.g., pseudo-classes irrelevant in PNG; explicit pixel widths needed for Satori but not for the live page).

A parallel template makes the contract explicit:

> `ResumeImageTemplate` is the visual contract for image export. Its CSS vocabulary must remain Satori-compatible. It shares the `ResumeData` shape with the live template, so content changes propagate automatically; only styling is duplicated.

**Alternative considered:** rewrite `ResumeTemplate` to be Satori-safe inline-style. Rejected because the live page would lose Tailwind's full feature set and the constraint would propagate into every future template change.

**Alternative considered:** auto-translate classes via a build step. Rejected as YAGNI; the template is 226 lines and parallel maintenance is cheaper than a translation layer.

### Density

No density picker. PNG always renders the full resume content (equivalent to the live page's default rendering — every bullet, no truncation). This matches the simplified PDF export decision: one export action per format, no per-format style knobs.

### Image dimensions

| Param | Value | Reason |
|---|---|---|
| Width | 1240px | A4 (210mm) at ~150 DPI → sharp on retina, reasonable file size (~200KB-500KB) |
| Height | auto, follows content | Single image; no pagination. Content that exceeds A4 ratio → tall image. |
| Background | `#ffffff` | Matches live template. |
| DPR | 1 (rendered at native pixel width) | Satori + Resvg render to exact pixel count; no separate device-pixel-ratio handling. |

### Font handling

Satori requires TTF or OTF font data passed in at render time. `next/font` ships WOFF2.

Plan: copy the original TTF files into `public/fonts/` for the fonts used by the live template (likely Inter or the project's chosen stack — to be confirmed during implementation when the actual `next/font` config is inspected). `fonts.ts` reads them at module init using `node:fs/promises` and exports an array of `{ name, data, weight, style }` Satori font descriptors.

Cold-start font load is one filesystem read per font; subsequent requests reuse the module-scope cache.

If a glyph (e.g., Chinese punctuation) isn't covered by the loaded fonts, Satori renders a "tofu" box. The template uses primarily Latin + standard CJK; we include at least one CJK-capable font (e.g., Noto Sans SC) in the loaded set.

### URL contract

```
GET /api/png/[handle][?company=<key> | ?role=<key> | ?focus=<key> | ?lang=<key>]
```

- `handle` (path): resume username, same as the page route.
- `company` / `role` / `focus` / `lang` (query, optional): variant resolution. Reuses the same precedence logic as the live page via the shared `resolveVariantFromSearchParams` helper introduced by the PDF spec.

The client passes through whichever variant query param is on the current URL, so a user on `cv.ha7ch.com/lawted?company=openai` who clicks PNG gets `?company=openai` appended to the API call. No density parameter.

### Filename and Content-Disposition

| Case | Filename |
|---|---|
| No variant | `{Name}_Resume.png` |
| With variant `<key>` | `{Name}_Resume_{key}.png` |

Spaces in `{Name}` replaced by underscores. Non-ASCII names use RFC 5987 `filename*=UTF-8''<encoded>` syntax with an ASCII-only `filename="..."` fallback for legacy clients — same logic as the PDF spec.

## Error handling

| Failure | HTTP | Client behavior |
|---|---|---|
| Handle not found | 404 | Toast: "Resume not found" |
| Variant query references unknown key | 404 | Same as above (variant resolver returns null) |
| Satori render throws (unsupported CSS, font issue) | 500 | Toast: "PNG export failed — please retry. If this keeps happening, report it." Server logs the underlying error. |
| Resvg render throws | 500 | Same as above. |
| Font file missing on disk | 500 | Same; this is a deploy-time bug, surfaced loudly. |
| Render exceeds 10s | 504 | Toast: "PNG export timed out — retry." |

Errors are never silent. Server logs include enough context (handle, variant, error class) to debug.

## Testing strategy

Manual smoke tests (no automation in this iteration):

1. **Base resume** — render PNG for `lawted`, eyeball against the live page at `cv.ha7ch.com/lawted`. Verify all bullets present (no truncation).
2. **Variant** — render PNG for `lawted?company=openai`, verify filename includes `_openai`, content matches the OpenAI variant page.
3. **Long content** — manually pad bullets to push the resume past A4 ratio, verify a tall single PNG renders correctly (no clipping).
4. **CJK glyph coverage** — render with a name or tagline containing Chinese characters, verify no tofu boxes.
5. **Filename in browser** — verify Chrome / Safari / Firefox each receive a sensibly-named file (RFC 5987 path).

PNG binary diffing is brittle and not worth automating for this iteration.

## Performance expectations

- Cold start: ~300-800ms (font load + Satori + Resvg init).
- Warm: ~100-300ms per render (depends on content length).
- Output size: 200-500KB typical.
- Acceptable for an on-demand download triggered by a click.

## UI integration

The existing PDF dropdown in `ResumeView.tsx` (right side, "PDF" trigger with a Concise/Full submenu) is simplified into two sibling buttons — no submenus:

```
[ PDF ]  [ PNG ]
```

- Clicking PDF triggers PDF download (Puppeteer route from the PDF spec, once implemented; today's `window.print()` still works as fallback).
- Clicking PNG triggers `fetch('/api/png/[handle]' + variant_query)` → blob → download.

The Concise/Full picker UI is removed from `ResumeView.tsx` as part of this change. PDF and PNG each become single, no-options actions.

(Note: the PDF Puppeteer spec at `docs/superpowers/specs/2026-05-08-pdf-puppeteer-onepage-design.md` will need a corresponding amendment to drop its Industry/Academic picker — out of scope for this spec but flagged here so the two stay consistent.)

## Risk and rollback

- **Risk:** Satori's CSS subset misses something the parallel template needs. Mitigation: parallel template uses only inline styles from a known-safe vocabulary; the spec lists the allowed CSS surface. Smoke tests catch regressions.
- **Risk:** TTF font files are large and bloat the deploy bundle. Mitigation: ship only the weights actually used by the template; subset fonts if necessary.
- **Risk:** Resvg WASM cold start is slow on edge runtime. Mitigation: route runs on Node runtime, not Edge. Module-scope caching covers warm requests.
- **Rollback:** revert the branch. The PDF flow and live page are untouched.

## Open questions resolved during brainstorming

| Question | Decision |
|---|---|
| Client-side library vs server-side | Server-side, Satori-based (chosen over Puppeteer for zero-Chromium deploy) |
| SVG export alongside PNG | Out of scope; PNG only |
| Parallel template vs reuse live template | Parallel template (`ResumeImageTemplate`) |
| Output dimensions | Width 1240px, height auto |
| Density picker | Removed entirely — single PNG action, no submenu. PDF export is simplified the same way. |
| Multi-page handling | Out of scope — tall single PNG when content overflows |
| Background | White, matches live template |
| Font format | TTF (Satori requirement); copy from existing font sources into `public/fonts/` |
| Code sharing with planned PDF Puppeteer route | None; independent pipelines |

## Follow-ups (post this iteration)

- Optional density / background / theme toggles in the menu.
- OG image endpoint that reuses the same renderer (`/api/og/[handle]` → 1200×630).
- Edge runtime port if cold-start becomes a concern.
- Move PDF to Satori too if the parallel template proves robust and the Puppeteer route is found to be overkill.

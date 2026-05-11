# PDF Puppeteer One-Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `window.print()` with a server-side Puppeteer PDF route that targets strict A4 single-page output (with a 0.85 scale floor + overflow toast) for industry use, and natural multi-page for academic.

**Architecture:** Next.js Route Handler `/api/pdf/[handle]` launches local Puppeteer, navigates to the public resume URL with `?print=1` (which hides nav/footer via a `print` prop), measures `scrollHeight`, computes a scale factor, and emits a single PDF. Variant resolution piggybacks on PR #6 by forwarding query params through to the print URL.

**Tech Stack:** Next.js 16 (App Router, Node runtime), React 19, TypeScript, Tailwind v4, Puppeteer (full package, bundled Chromium), Vitest (new) for pure-helper unit tests.

**Spec:** `docs/superpowers/specs/2026-05-08-pdf-puppeteer-onepage-design.md`

**Out of scope for this iteration:** PDF metadata fields (title/author/subject inside the PDF dictionary). Puppeteer's `page.pdf()` does not expose them; adding `pdf-lib` post-processing is deferred to a follow-up. Filename + `Content-Disposition` carry the user-visible naming.

---

## Task 0: Vitest scaffolding

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` scripts and dev deps)

- [ ] **Step 1: Install vitest**

```bash
cd /Users/lawtedwu/dev/cv && pnpm add -D vitest@^2.1.0
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test scripts**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Sanity-check vitest runs**

Run: `cd /Users/lawtedwu/dev/cv && pnpm test`
Expected: exit 0 with "No test files found" (no tests yet is OK).

- [ ] **Step 5: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add vitest.config.ts package.json pnpm-lock.yaml && git commit -m "chore: add vitest for pure-helper unit tests"
```

---

## Task 1: Install Puppeteer

**Files:**
- Modify: `package.json` (add `puppeteer` dep)

- [ ] **Step 1: Install puppeteer (downloads bundled Chromium)**

```bash
cd /Users/lawtedwu/dev/cv && pnpm add puppeteer@^23.0.0
```

Expected: pnpm downloads Chromium (~150MB), takes 30-60s. If pnpm skips Chromium download, run `pnpm exec puppeteer browsers install chrome` after install.

- [ ] **Step 2: Verify Puppeteer imports**

```bash
cd /Users/lawtedwu/dev/cv && node --input-type=module -e "import('puppeteer').then(m => console.log('ok:', typeof m.launch))"
```
Expected: `ok: function`

- [ ] **Step 3: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add package.json pnpm-lock.yaml && git commit -m "chore: add puppeteer for server-side PDF rendering"
```

---

## Task 2: PDF constants module

**Files:**
- Create: `src/lib/pdf/constants.ts`

- [ ] **Step 1: Create constants**

Create `src/lib/pdf/constants.ts`:
```ts
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PAGE_MARGIN_MM = 12;

export const PX_PER_MM = 96 / 25.4;
export const A4_CONTENT_HEIGHT_PX =
  (A4_HEIGHT_MM - 2 * PAGE_MARGIN_MM) * PX_PER_MM;

export const SCALE_FLOOR = 0.85;
export const RENDER_TIMEOUT_MS = 15_000;

export type FitResult = "ok" | "overflow";
export type Audience = "industry" | "academic";
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add src/lib/pdf/constants.ts && git commit -m "feat(pdf): add A4 + floor constants module"
```

---

## Task 3: Scale measurement helper (TDD)

**Files:**
- Create: `src/lib/pdf/measure.ts`
- Test: `src/lib/pdf/measure.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pdf/measure.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeScale } from "./measure";
import { A4_CONTENT_HEIGHT_PX, SCALE_FLOOR } from "./constants";

describe("computeScale", () => {
  it("returns scale=1 + ok when content already fits", () => {
    const result = computeScale({ scrollHeightPx: A4_CONTENT_HEIGHT_PX - 50, audience: "industry" });
    expect(result).toEqual({ scale: 1, fitResult: "ok" });
  });

  it("returns ratio + ok when industry content scales within floor", () => {
    const overflow = A4_CONTENT_HEIGHT_PX * 1.05;
    const result = computeScale({ scrollHeightPx: overflow, audience: "industry" });
    expect(result.fitResult).toBe("ok");
    expect(result.scale).toBeCloseTo(A4_CONTENT_HEIGHT_PX / overflow, 4);
    expect(result.scale).toBeGreaterThan(SCALE_FLOOR);
    expect(result.scale).toBeLessThan(1);
  });

  it("returns scale=1 + overflow when industry content exceeds floor", () => {
    const tooMuch = A4_CONTENT_HEIGHT_PX / (SCALE_FLOOR - 0.05);
    const result = computeScale({ scrollHeightPx: tooMuch, audience: "industry" });
    expect(result).toEqual({ scale: 1, fitResult: "overflow" });
  });

  it("returns scale=1 + ok for academic regardless of size", () => {
    const huge = A4_CONTENT_HEIGHT_PX * 3;
    const result = computeScale({ scrollHeightPx: huge, audience: "academic" });
    expect(result).toEqual({ scale: 1, fitResult: "ok" });
  });

  it("guards against zero/negative scrollHeight", () => {
    expect(computeScale({ scrollHeightPx: 0, audience: "industry" })).toEqual({ scale: 1, fitResult: "ok" });
    expect(computeScale({ scrollHeightPx: -5, audience: "industry" })).toEqual({ scale: 1, fitResult: "ok" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/lawtedwu/dev/cv && pnpm test src/lib/pdf/measure.test.ts
```
Expected: FAIL with "Cannot find module './measure'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/pdf/measure.ts`:
```ts
import {
  A4_CONTENT_HEIGHT_PX,
  SCALE_FLOOR,
  type Audience,
  type FitResult,
} from "./constants";

export interface ComputeScaleInput {
  scrollHeightPx: number;
  audience: Audience;
}

export interface ComputeScaleResult {
  scale: number;
  fitResult: FitResult;
}

export function computeScale(input: ComputeScaleInput): ComputeScaleResult {
  const { scrollHeightPx, audience } = input;
  if (scrollHeightPx <= 0) return { scale: 1, fitResult: "ok" };
  if (audience === "academic") return { scale: 1, fitResult: "ok" };

  const ratio = A4_CONTENT_HEIGHT_PX / scrollHeightPx;
  if (ratio >= 1) return { scale: 1, fitResult: "ok" };
  if (ratio < SCALE_FLOOR) return { scale: 1, fitResult: "overflow" };
  return { scale: ratio, fitResult: "ok" };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/lawtedwu/dev/cv && pnpm test src/lib/pdf/measure.test.ts
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add src/lib/pdf/measure.ts src/lib/pdf/measure.test.ts && git commit -m "feat(pdf): add computeScale with industry floor + academic passthrough"
```

---

## Task 4: Filename + Content-Disposition helper (TDD)

**Files:**
- Create: `src/lib/pdf/filename.ts`
- Test: `src/lib/pdf/filename.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pdf/filename.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildContentDisposition, buildPdfFilename } from "./filename";

describe("buildPdfFilename", () => {
  it("joins name + Resume", () => {
    expect(buildPdfFilename("Mingze Wu", null)).toBe("Mingze_Wu_Resume.pdf");
  });

  it("appends variant key when present", () => {
    expect(buildPdfFilename("Mingze Wu", "apple-eng")).toBe("Mingze_Wu_Resume_apple-eng.pdf");
  });

  it("collapses repeat whitespace", () => {
    expect(buildPdfFilename("  Mingze   Wu  ", null)).toBe("Mingze_Wu_Resume.pdf");
  });

  it("preserves CJK characters in the raw filename", () => {
    expect(buildPdfFilename("吴明泽", null)).toBe("吴明泽_Resume.pdf");
  });
});

describe("buildContentDisposition", () => {
  it("emits both filename and filename* for plain names", () => {
    const header = buildContentDisposition("Mingze Wu", null);
    expect(header).toContain('filename="Mingze_Wu_Resume.pdf"');
    expect(header).toContain("filename*=UTF-8''Mingze_Wu_Resume.pdf");
  });

  it("encodes CJK as filename* per RFC 5987 and provides ASCII fallback", () => {
    const header = buildContentDisposition("吴明泽", "apple-pm");
    expect(header).toMatch(/filename="[A-Za-z0-9_.\-]+\.pdf"/);
    expect(header).toContain("filename*=UTF-8''%E5%90%B4%E6%98%8E%E6%B3%BD_Resume_apple-pm.pdf");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/lawtedwu/dev/cv && pnpm test src/lib/pdf/filename.test.ts
```
Expected: FAIL with "Cannot find module './filename'".

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/pdf/filename.ts`:
```ts
function sanitizeNameSegment(name: string): string {
  return name.trim().replace(/\s+/g, "_");
}

function asciiFallback(name: string): string {
  const stripped = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
  return stripped.trim().replace(/\s+/g, "_") || "Resume";
}

export function buildPdfFilename(name: string, variant: string | null): string {
  const base = sanitizeNameSegment(name);
  const suffix = variant ? `_${variant}` : "";
  return `${base}_Resume${suffix}.pdf`;
}

export function buildContentDisposition(name: string, variant: string | null): string {
  const utf8Filename = buildPdfFilename(name, variant);
  const asciiBase = asciiFallback(name);
  const asciiFilename = buildPdfFilename(asciiBase, variant);
  const encoded = encodeURIComponent(utf8Filename);
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encoded}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/lawtedwu/dev/cv && pnpm test src/lib/pdf/filename.test.ts
```
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add src/lib/pdf/filename.ts src/lib/pdf/filename.test.ts && git commit -m "feat(pdf): add filename + RFC 5987 Content-Disposition builder"
```

---

## Task 5: Print prop in ResumeTemplate + CSS @page A4

**Files:**
- Modify: `src/components/resume/ResumeTemplate.tsx`
- Modify: `src/app/globals.css`

This task adds a `print` prop to `ResumeTemplate` (so the footer can be gated by the parent), and switches CSS `@page` from Letter/0.5in to A4/12mm.

- [ ] **Step 1: Switch `@page` to A4 12mm**

In `src/app/globals.css`, replace the existing `@page` block:

Find:
```css
@page {
  size: Letter;
  margin: 0.5in;
}
```

Replace with:
```css
@page {
  size: A4;
  margin: 12mm;
}
```

Leave the `@media print { ... }` block as-is below it.

- [ ] **Step 2: Add `print` prop to ResumeTemplate**

In `src/components/resume/ResumeTemplate.tsx`:

Find the export signature (line ~9-15):
```tsx
export default function ResumeTemplate({
  data,
  density = "standard",
}: {
  data: ResumeData;
  density?: ResumeDensity;
}) {
```

Replace with:
```tsx
export default function ResumeTemplate({
  data,
  density = "standard",
  print = false,
}: {
  data: ResumeData;
  density?: ResumeDensity;
  print?: boolean;
}) {
```

Then find the footer block (line ~132-138):
```tsx
      <footer className="print:hidden mt-16 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        cv.ha7ch.com/{data.username} · agent tip: GET{" "}
        <a href={`/${data.username}.json`} className="hover:text-zinc-600">
          /{data.username}.json
        </a>{" "}
        · updated {new Date(data.meta.updatedAt).toLocaleDateString()}
      </footer>
```

Wrap it with `{!print && (...)}`:
```tsx
      {!print && (
        <footer className="print:hidden mt-16 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
          cv.ha7ch.com/{data.username} · agent tip: GET{" "}
          <a href={`/${data.username}.json`} className="hover:text-zinc-600">
            /{data.username}.json
          </a>{" "}
          · updated {new Date(data.meta.updatedAt).toLocaleDateString()}
        </footer>
      )}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add src/components/resume/ResumeTemplate.tsx src/app/globals.css && git commit -m "feat(resume): add print prop to template + switch @page to A4 12mm"
```

---

## Task 6: Puppeteer render wrapper

**Files:**
- Create: `src/lib/pdf/render.ts`

This is the only module that imports `puppeteer`. The rest of the system calls `renderResumePdf({ url, audience })`. To swap to `@sparticuz/chromium` or Browserless later, replace this file.

- [ ] **Step 1: Create the render wrapper**

Create `src/lib/pdf/render.ts`:
```ts
import "server-only";
import puppeteer, { type Browser } from "puppeteer";
import {
  RENDER_TIMEOUT_MS,
  type Audience,
  type FitResult,
} from "./constants";
import { computeScale } from "./measure";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export interface RenderResumePdfInput {
  url: string;
  audience: Audience;
}

export interface RenderResumePdfResult {
  pdf: Uint8Array;
  fitResult: FitResult;
  scrollHeightPx: number;
  scale: number;
}

export async function renderResumePdf(
  input: RenderResumePdfInput,
): Promise<RenderResumePdfResult> {
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);

    await page.setViewport({
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      deviceScaleFactor: 2,
    });

    await page.goto(input.url, {
      waitUntil: "networkidle0",
      timeout: RENDER_TIMEOUT_MS,
    });
    await page.evaluateHandle("document.fonts.ready");
    await page.emulateMediaType("print");

    const scrollHeightPx = await page.evaluate(() => document.body.scrollHeight);
    const { scale, fitResult } = computeScale({ scrollHeightPx, audience: input.audience });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale,
    });

    return {
      pdf: new Uint8Array(pdfBuffer),
      fitResult,
      scrollHeightPx,
      scale,
    };
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 2: Smoke test the wrapper via a one-shot script**

Add `tsx` for running the smoke script:
```bash
cd /Users/lawtedwu/dev/cv && pnpm add -D tsx
```

Create `scripts/test-pdf-render.mts`:
```ts
import { writeFileSync } from "node:fs";
import { renderResumePdf } from "../src/lib/pdf/render.ts";

const result = await renderResumePdf({
  url: "http://localhost:3000/lawted?print=1",
  audience: "industry",
});
writeFileSync("/tmp/smoke.pdf", result.pdf);
console.log("scrollHeight:", result.scrollHeightPx, "scale:", result.scale.toFixed(3), "fit:", result.fitResult);
console.log("wrote /tmp/smoke.pdf");
```

Start the dev server in a separate terminal: `cd /Users/lawtedwu/dev/cv && pnpm dev`. Wait for "Ready" log.

Then run the script:
```bash
cd /Users/lawtedwu/dev/cv && pnpm exec tsx scripts/test-pdf-render.mts
```

Expected: prints scrollHeight (somewhere in 700-1500px range), scale (between 0.85 and 1.0), fit "ok"; `/tmp/smoke.pdf` opens to a single-page A4 resume with clean margins.

Note: the URL hits `lawted?print=1`, but at this point the page does not yet read `print=1`. The footer is still rendered. We will close that gap in Task 7 (ResumeView wiring). For now, verify the PDF is generated and looks reasonable; the footer will be present in this smoke output, which is OK.

Open:
```bash
open /tmp/smoke.pdf
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add src/lib/pdf/render.ts scripts/test-pdf-render.mts package.json pnpm-lock.yaml && git commit -m "feat(pdf): add Puppeteer render wrapper with scale measurement"
```

---

## Task 7: PDF API route

**Files:**
- Create: `src/app/api/pdf/[handle]/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/pdf/[handle]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getResumeByUsername } from "@/lib/resume-store";
import { renderResumePdf } from "@/lib/pdf/render";
import { buildContentDisposition } from "@/lib/pdf/filename";
import type { Audience } from "@/lib/pdf/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VARIANT_KEYS = ["company", "role", "focus", "lang"] as const;

function parseAudience(value: string | null): Audience {
  return value === "academic" ? "academic" : "industry";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const search = req.nextUrl.searchParams;
  const audience = parseAudience(search.get("audience"));

  const resume = await getResumeByUsername(handle);
  if (!resume) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const printParams = new URLSearchParams();
  printParams.set("print", "1");
  for (const key of VARIANT_KEYS) {
    const value = search.get(key);
    if (value) printParams.set(key, value);
  }

  const origin = req.nextUrl.origin;
  const printUrl = `${origin}/${handle}?${printParams.toString()}`;

  let pdf: Uint8Array;
  let fitResult: "ok" | "overflow";
  try {
    const result = await renderResumePdf({ url: printUrl, audience });
    pdf = result.pdf;
    fitResult = result.fitResult;
  } catch (err) {
    console.error("[pdf] render failed:", err);
    return NextResponse.json({ error: "render_failed" }, { status: 503 });
  }

  const variantKey =
    VARIANT_KEYS.map((k) => search.get(k)).find((v) => v && v.length > 0) ?? null;
  const contentDisposition = buildContentDisposition(resume.header.name, variantKey);

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition,
      "Content-Length": String(pdf.byteLength),
      "X-Page-Fit-Result": fitResult,
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 2: Smoke test the route with curl**

Ensure dev server is running. In another terminal:
```bash
curl -i "http://localhost:3000/api/pdf/lawted?audience=industry" -o /tmp/route.pdf 2>&1 | head -20
file /tmp/route.pdf
open /tmp/route.pdf
```

Expected:
- HTTP 200
- `Content-Type: application/pdf`
- `Content-Disposition` contains `Mingze_Wu_Resume.pdf`
- `X-Page-Fit-Result` is `ok` or `overflow`
- `file` reports "PDF document"
- PDF opens to a resume (footer present until Task 8 wires `?print=1` properly)

Variant route:
```bash
curl -i "http://localhost:3000/api/pdf/lawted?audience=industry&company=apple-eng" -o /tmp/route-eng.pdf 2>&1 | head -20
open /tmp/route-eng.pdf
```
Expected: PDF reflects the apple-eng variant (different tagline + bullets).

Academic mode:
```bash
curl -i "http://localhost:3000/api/pdf/lawted?audience=academic&company=apple-eng" -o /tmp/route-acad.pdf 2>&1 | head -20
open /tmp/route-acad.pdf
```
Expected: scale=1, may flow to 2 pages naturally, `X-Page-Fit-Result: ok`.

- [ ] **Step 3: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add "src/app/api/pdf/[handle]/route.ts" && git commit -m "feat(pdf): add /api/pdf/[handle] route with Industry/Academic + variant forwarding"
```

---

## Task 8: ResumeView UI rewrite (Industry/Academic + isPrint + toast)

**Files:**
- Modify: `src/components/resume/ResumeView.tsx`

This is one task because the state, JSX, and prop-passing changes are tightly coupled and a partial change would leave the component in a broken intermediate state.

- [ ] **Step 1: Replace ResumeView with the new structure**

Open `src/components/resume/ResumeView.tsx` and replace the **entire default export function** (lines 9-153 in the current file, ending before `function ResumeJSON`) with this block. The helper functions `ResumeJSON`, `CopyButton`, `Highlighted` at the bottom of the file remain untouched.

```tsx
export default function ResumeView({ data }: { data: ResumeData }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const isJSON = params.get("view") === "json";
  const isPrint = params.get("print") === "1";
  const baseParams = new URLSearchParams(params.toString());
  baseParams.delete("view");
  const humanQuery = baseParams.toString();
  const humanHref = humanQuery ? `${pathname}?${humanQuery}` : pathname;
  const agentParams = new URLSearchParams(baseParams.toString());
  agentParams.set("view", "json");
  const agentHref = `${pathname}?${agentParams.toString()}`;

  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState<null | "industry" | "academic">(null);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!pdfMenuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPdfMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPdfMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pdfMenuOpen]);

  async function downloadPdf(audience: "industry" | "academic") {
    setPdfMenuOpen(false);
    setDownloading(audience);
    try {
      const qs = new URLSearchParams();
      qs.set("audience", audience);
      for (const k of ["company", "role", "focus", "lang"]) {
        const v = params.get(k);
        if (v) qs.set(k, v);
      }
      const res = await fetch(`/api/pdf/${data.username}?${qs.toString()}`);
      if (!res.ok) {
        setToast("PDF service unavailable. Please retry.");
        return;
      }
      const fit = res.headers.get("X-Page-Fit-Result");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] ?? `${data.header.name}_Resume.pdf`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (audience === "industry" && fit === "overflow") {
        setToast(
          "Content exceeded one page. Saved as 2 pages. Edit your resume to trim it down for single-page export.",
        );
      }
    } catch (err) {
      console.error("[pdf] download failed", err);
      setToast("Download failed. Please retry.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="relative">
      {!isPrint && (
        <>
          <nav
            aria-label="View toggle"
            className="print:hidden absolute left-6 top-6 z-10 flex items-baseline gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-400 sm:left-10 sm:top-10"
          >
            <Link
              href={humanHref}
              scroll={false}
              aria-current={!isJSON ? "page" : undefined}
              className={
                !isJSON ? "font-medium text-zinc-900" : "transition hover:text-zinc-700"
              }
            >
              for human
            </Link>
            <span aria-hidden className="text-zinc-300">
              /
            </span>
            <Link
              href={agentHref}
              scroll={false}
              aria-current={isJSON ? "page" : undefined}
              className={
                isJSON ? "font-medium text-zinc-900" : "transition hover:text-zinc-700"
              }
            >
              for agent
            </Link>
          </nav>

          {!isJSON && (
            <div
              ref={menuRef}
              className="print:hidden absolute right-6 top-6 z-10 sm:right-10 sm:top-10"
            >
              <button
                type="button"
                onClick={() => setPdfMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={pdfMenuOpen}
                aria-label="Download as PDF"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition hover:text-zinc-900"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                PDF
              </button>

              {pdfMenuOpen && (
                <div
                  role="menu"
                  aria-label="PDF audience"
                  className="absolute right-0 top-full mt-3 w-56 rounded-md border border-zinc-200 bg-white p-1.5 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={downloading !== null}
                    onClick={() => downloadPdf("industry")}
                    className="block w-full rounded px-3 py-2 text-left transition hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <div className="text-[13px] font-medium text-zinc-900">Industry</div>
                    <div className="text-[11px] text-zinc-500">Single page, auto-fit (down to 85%)</div>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={downloading !== null}
                    onClick={() => downloadPdf("academic")}
                    className="block w-full rounded px-3 py-2 text-left transition hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <div className="text-[13px] font-medium text-zinc-900">Academic</div>
                    <div className="text-[11px] text-zinc-500">Natural pagination, no compression</div>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isJSON ? (
        <ResumeJSON data={data} />
      ) : (
        <ResumeTemplate data={data} print={isPrint} />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="print:hidden fixed bottom-6 left-1/2 z-20 max-w-md -translate-x-1/2 rounded-md bg-zinc-900 px-4 py-3 text-[13px] text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Drop the unused `ResumeDensity` import**

At the top of `src/components/resume/ResumeView.tsx`, change the import:

Find:
```tsx
import ResumeTemplate, { type ResumeDensity } from "./ResumeTemplate";
```

Replace with:
```tsx
import ResumeTemplate from "./ResumeTemplate";
```

- [ ] **Step 3: Run typecheck and lint**

```bash
cd /Users/lawtedwu/dev/cv && pnpm exec tsc --noEmit
cd /Users/lawtedwu/dev/cv && pnpm lint
```
Expected: zero errors. If `ResumeDensity` is still referenced elsewhere (it shouldn't be), remove that reference too.

- [ ] **Step 4: Smoke test the full UI flow**

Run: `cd /Users/lawtedwu/dev/cv && pnpm dev`

1. Open `http://localhost:3000/lawted` — see nav + PDF button + footer normally.
2. Click PDF button. Menu shows **Industry** and **Academic** options (not Concise/Full).
3. Click **Industry**. PDF downloads as `Mingze_Wu_Resume.pdf`. Open it: single A4 page, no nav, no footer, 12mm margins.
4. Open `http://localhost:3000/lawted?print=1` directly. The page renders only the resume content (no nav, no PDF button, no footer).
5. Open `http://localhost:3000/lawted?company=apple-eng`. Click PDF → Industry. File downloads as `Mingze_Wu_Resume_apple-eng.pdf`, contents are the apple-eng variant.
6. Click PDF → Academic from any URL. File downloads, may be 2 pages naturally.
7. Verify overflow toast: edit a variant via `cv-pro set-variant` to have very long bullets that overflow even at 0.85 scale, then click Industry. A dark toast should appear at the bottom: "Content exceeded one page. Saved as 2 pages..."

- [ ] **Step 5: Commit**

```bash
cd /Users/lawtedwu/dev/cv && git add src/components/resume/ResumeView.tsx && git commit -m "feat(resume): Industry/Academic PDF picker hits /api/pdf with overflow toast"
```

---

## Task 9: Final smoke matrix

Verification pass before branch handoff. No commits in this task.

- [ ] **Step 1: Unit tests**

```bash
cd /Users/lawtedwu/dev/cv && pnpm test
```
Expected: all tests pass (5 in measure + 6 in filename = 11 total).

- [ ] **Step 2: Typecheck + lint**

```bash
cd /Users/lawtedwu/dev/cv && pnpm exec tsc --noEmit
cd /Users/lawtedwu/dev/cv && pnpm lint
```
Expected: zero errors.

- [ ] **Step 3: Render matrix**

With dev server up:
```bash
curl -s "http://localhost:3000/api/pdf/lawted?audience=industry" -o /tmp/base-industry.pdf
curl -s "http://localhost:3000/api/pdf/lawted?audience=academic" -o /tmp/base-academic.pdf
curl -s "http://localhost:3000/api/pdf/lawted?audience=industry&company=apple-eng" -o /tmp/eng-industry.pdf
curl -s "http://localhost:3000/api/pdf/lawted?audience=industry&company=apple-pm" -o /tmp/pm-industry.pdf
open /tmp/base-industry.pdf /tmp/base-academic.pdf /tmp/eng-industry.pdf /tmp/pm-industry.pdf
```

Verify:
- Base/Industry: single A4 page, fits cleanly, 12mm margins
- Base/Academic: scale=1, may flow to 2 pages naturally
- apple-eng/Industry: single page, correct Apple-eng tagline + bullets
- apple-pm/Industry: single page, correct Apple-pm tagline + bullets
- All four: no nav/footer, vector text (zoom in: still sharp), Inter/Playfair/Noto Serif SC font fidelity

- [ ] **Step 4: Cleanup temp PDFs**

```bash
rm -f /tmp/base-industry.pdf /tmp/base-academic.pdf /tmp/eng-industry.pdf /tmp/pm-industry.pdf /tmp/smoke.pdf /tmp/route.pdf /tmp/route-eng.pdf /tmp/route-acad.pdf
```

- [ ] **Step 5: Status report**

Branch is ready for user review. Do not push (per user instruction). Surface anything off-spec for user decision (e.g., scale floor needs tuning, font fallback observed, etc.).

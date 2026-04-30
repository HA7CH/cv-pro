# cv

Your PDF resume, as a living site — [cv.ha7ch.com](https://cv.ha7ch.com)

Claim a handle at cv.ha7ch.com, get a token, then paste one prompt into Claude Code. It installs the CLI, reads your PDF, and publishes your resume to `cv.ha7ch.com/{handle}`.

## How it works

1. Register at [cv.ha7ch.com](https://cv.ha7ch.com) → get a token
2. Paste the generated prompt into Claude Code (CLI tab) or configure MCP directly
3. Drop a PDF, paste text, or describe changes — Claude figures out the rest

## CLI (`npx @lawtedwu/aicv@latest`)

```bash
npx @lawtedwu/aicv@latest --help
CV_TOKEN=cv_pat_... npx @lawtedwu/aicv@latest get
CV_TOKEN=cv_pat_... npx @lawtedwu/aicv@latest update resume.json
CV_TOKEN=cv_pat_... npx @lawtedwu/aicv@latest update-section experience data.json
CV_TOKEN=cv_pat_... npx @lawtedwu/aicv@latest open
```

npm: [`@lawtedwu/aicv`](https://www.npmjs.com/package/@lawtedwu/aicv)

## MCP (direct)

```bash
claude mcp add cv --transport http https://cv.ha7ch.com/api/mcp \
  --header "Authorization: Bearer cv_pat_..."
```

Tools: `get_resume` · `update_resume` · `update_section`

## Repo layout

```
cv/
├── cli/                    npm package @lawtedwu/aicv
├── plugin/                 Claude Code plugin (marketplace)
├── src/
│   ├── app/
│   │   ├── api/mcp/        MCP HTTP server
│   │   ├── api/v1/         REST API (used by CLI)
│   │   ├── api/register/   handle registration
│   │   └── [username]/     public resume page
│   └── components/resume/  resume template
└── supabase/migrations/    DB schema
```

## Dev

```bash
pnpm install
cp .env.example .env.local   # fill NEXT_PUBLIC_SUPABASE_URL/ANON_KEY + PAT_HASH_SECRET
pnpm dev
```

The root `.mcp.json` connects Claude Code to the Supabase official MCP — useful for running migrations directly.

## Stack

Next.js 16 · Tailwind 4 · shadcn/ui · Supabase · Vercel

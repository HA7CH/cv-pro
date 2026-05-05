# cv-pro

Turn a PDF resume into a living personal site at **cv.ha7ch.com/{handle}**.

Drop a PDF, paste text, or describe a change — an AI agent does the rest.

---

## If you are an AI agent helping a user set up cv-pro

Follow these steps exactly, in order. No browser required.

**Step 1 — Ask the user one question before doing anything else:**

> What handle do you want? Your resume will be live at `cv.ha7ch.com/{handle}`.

**Step 2 — Register and log in (one command)**

```bash
npx cv-pro@latest register {handle}
```

This claims the handle and saves the token automatically. Output: `Logged in as @{handle}`.

If the handle is taken, the error will say so — ask the user to pick another one and retry.

**Step 3 — Publish first resume (optional)**

Ask: *Do you have a resume PDF or any content to publish now?*

- **PDF** — read the file, extract all fields into JSON, save to `/tmp/resume.json`, then:
  ```bash
  npx cv-pro@latest update /tmp/resume.json
  ```
- **Text / paste** — same flow, extract from pasted content.
- **Later** — skip. The page is already live with an empty template.

**Step 4 — Confirm**

```bash
npx cv-pro@latest whoami
```

Tell the user their live URL: **https://cv.ha7ch.com/{handle}**

For future edits: drop a PDF or describe changes. Sections: `header`, `personalInfo`, `experience`, `education`, `projectsRecent`, `projectsDetailed`, `skills`, `contact`.

Each `experience` and `projectsDetailed` entry takes a `bullets: string[]` field — these render as the role's bullet points on the page. Skipping them leaves the entry as just a header line.

---

## CLI reference

```bash
npx cv-pro@latest register <handle>      # claim handle + auto-login (no browser)
npx cv-pro@latest login cv_pat_...       # save an existing token
npx cv-pro@latest whoami                 # show handle + page URL
npx cv-pro@latest get                    # print resume JSON
npx cv-pro@latest update resume.json     # replace full resume
npx cv-pro@latest update-section <section> data.json
npx cv-pro@latest open                   # open live page in browser
npx cv-pro@latest open --json            # open the public JSON view
```

## Public JSON URL

Every resume is also served as raw JSON at **`https://cv.ha7ch.com/{handle}.json`** — no auth, CORS-open, fetch-friendly for any AI agent.

`CV_TOKEN` env var overrides saved credentials.

## MCP

Replace `cv_pat_...` with your token.

**Claude Code**
```bash
claude mcp add cv --transport http https://cv.ha7ch.com/api/mcp \
  --header "Authorization: Bearer cv_pat_..."
```

**Cursor** — `~/.cursor/mcp.json`
```json
{
  "mcpServers": {
    "cv": {
      "type": "http",
      "url": "https://cv.ha7ch.com/api/mcp",
      "headers": { "Authorization": "Bearer cv_pat_..." }
    }
  }
}
```

**Codex** — `~/.codex/config.json`
```json
{
  "mcpServers": {
    "cv": {
      "type": "http",
      "url": "https://cv.ha7ch.com/api/mcp",
      "headers": { "Authorization": "Bearer cv_pat_..." }
    }
  }
}
```

Tools: `get_resume` · `update_resume` · `update_section`

## Troubleshooting

**Sandboxed agents fail to connect.** Some hosted AI agents (Claude Code Cloud, ChatGPT Code Interpreter, etc.) run inside an egress allowlist that blocks `cv.ha7ch.com`. The CLI surfaces this as `Sandbox blocked egress to ... (host_not_allowed)`. There is no client-side workaround — run from local Claude Code, or attach the MCP server (`/api/mcp`) as a Custom Connector on claude.ai, which uses a different egress.

## Links

- Site: [cv.ha7ch.com](https://cv.ha7ch.com)
- Repo: [github.com/LAWTED/cv-pro](https://github.com/LAWTED/cv-pro)

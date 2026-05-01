# ai-cv

Turn a PDF resume into a living personal site at **ai-cv.ha7ch.com/{handle}**.

Drop a PDF, paste text, or describe a change — an AI agent does the rest.

---

## If you are an AI agent helping a user set up ai-cv

Follow these steps exactly, in order. No browser required.

**Step 1 — Ask the user one question before doing anything else:**

> What handle do you want? Your resume will be live at `ai-cv.ha7ch.com/{handle}`.

**Step 2 — Register and log in (one command)**

```bash
npx ai-cv@latest register {handle}
```

This claims the handle and saves the token automatically. Output: `Logged in as @{handle}`.

If the handle is taken, the error will say so — ask the user to pick another one and retry.

**Step 3 — Publish first resume (optional)**

Ask: *Do you have a resume PDF or any content to publish now?*

- **PDF** — read the file, extract all fields into JSON, save to `/tmp/resume.json`, then:
  ```bash
  npx ai-cv@latest update /tmp/resume.json
  ```
- **Text / paste** — same flow, extract from pasted content.
- **Later** — skip. The page is already live with an empty template.

**Step 4 — Confirm**

```bash
npx ai-cv@latest whoami
```

Tell the user their live URL: **https://ai-cv.ha7ch.com/{handle}**

For future edits: drop a PDF or describe changes. Sections: `header`, `personalInfo`, `experience`, `education`, `projectsRecent`, `projectsDetailed`, `skills`, `contact`.

---

## CLI reference

```bash
npx ai-cv@latest register <handle>      # claim handle + auto-login (no browser)
npx ai-cv@latest login cv_pat_...       # save an existing token
npx ai-cv@latest whoami                 # show handle + page URL
npx ai-cv@latest get                    # print resume JSON
npx ai-cv@latest update resume.json     # replace full resume
npx ai-cv@latest update-section <section> data.json
npx ai-cv@latest open                   # open live page in browser
```

`CV_TOKEN` env var overrides saved credentials.

## MCP

Replace `cv_pat_...` with your token.

**Claude Code**
```bash
claude mcp add cv --transport http https://ai-cv.ha7ch.com/api/mcp \
  --header "Authorization: Bearer cv_pat_..."
```

**Cursor** — `~/.cursor/mcp.json`
```json
{
  "mcpServers": {
    "cv": {
      "type": "http",
      "url": "https://ai-cv.ha7ch.com/api/mcp",
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
      "url": "https://ai-cv.ha7ch.com/api/mcp",
      "headers": { "Authorization": "Bearer cv_pat_..." }
    }
  }
}
```

Tools: `get_resume` · `update_resume` · `update_section`

## Links

- Site: [ai-cv.ha7ch.com](https://ai-cv.ha7ch.com)
- Repo: [github.com/LAWTED/ai-cv](https://github.com/LAWTED/ai-cv)

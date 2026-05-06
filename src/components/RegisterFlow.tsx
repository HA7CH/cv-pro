"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SavedData { handle: string; token: string }
const LS_KEY = "cv_registration";

type McpClient = "claude" | "cursor" | "codex";

const MCP_CLIENTS: { id: McpClient; label: string; icon: string }[] = [
  { id: "claude", label: "Claude Code", icon: "/mcp/claude.svg" },
  { id: "cursor", label: "Cursor", icon: "/mcp/cursor.svg" },
  { id: "codex", label: "Codex", icon: "/mcp/openai.svg" },
];

const MCP_URL = "https://cv.ha7ch.com/api/mcp";

// Placeholder shown in Step 2/3 before the user has registered. The
// `cv_pat_` prefix matches real tokens so the format is recognizable;
// the asterisks make it obvious this is a preview, not a usable token.
const PLACEHOLDER_TOKEN = "cv_pat_********************************";

function cursorDeeplink(token: string): string {
  const config = btoa(
    JSON.stringify({
      url: MCP_URL,
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=cv&config=${encodeURIComponent(config)}`;
}

function claudeCommand(token: string): string {
  return (
    `claude mcp add cv --transport http ${MCP_URL} \\\n` +
    `  --header "Authorization: Bearer ${token}"`
  );
}

function codexCommand(token: string): string {
  return (
    `export CV_TOKEN=${token}\n` +
    `codex mcp add cv --url ${MCP_URL} --bearer-token-env-var CV_TOKEN`
  );
}

function mcpJson(token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        cv: {
          url: MCP_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );
}

function buildCliPrompt(token: string): string {
  return (
    `Update my resume at cv.ha7ch.com.\n\n` +
    `Run first: npx cv-pro@latest login ${token}\n\n` +
    `Then help me update my resume — I'll give you a PDF, paste text, or describe changes.\n\n` +
    `After saving, ask if I have a job description. If yes, create a tailored variant for that company or role and give me the shareable link.`
  );
}

export default function RegisterFlow() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SavedData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [mcpClient, setMcpClient] = useState<McpClient>("claude");
  const [takenHandle, setTakenHandle] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as SavedData;
        if (p.handle && p.token) setResult(p);
      }
    } catch {}
  }, []);

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const h = handle.toLowerCase().trim();
    if (!h) return;
    setLoading(true);
    setError("");
    setTakenHandle(null);
    setTokenError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: h }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error");
      if (res.status === 409) setTakenHandle(h);
      return;
    }
    const saved = { handle: data.handle, token: data.token };
    try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch {}
    setResult(saved);
  }

  async function loginWithToken(e?: React.SyntheticEvent) {
    e?.preventDefault();
    const t = token.trim();
    if (!t || !takenHandle) return;
    setTokenLoading(true);
    setTokenError("");
    const res = await fetch("/api/v1/resume", {
      headers: { Authorization: `Bearer ${t}` },
    });
    setTokenLoading(false);
    if (res.status === 401 || res.status === 403) {
      setTokenError("Invalid token.");
      return;
    }
    if (!res.ok) {
      setTokenError("Server error. Try again.");
      return;
    }
    const data = (await res.json()) as { username?: string };
    if (!data.username) {
      setTokenError("Invalid token.");
      return;
    }
    if (data.username !== takenHandle) {
      setTokenError(`This token belongs to @${data.username}, not @${takenHandle}.`);
      return;
    }
    const saved = { handle: takenHandle, token: t };
    try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch {}
    setResult(saved);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const tokenDisplay = result?.token ?? PLACEHOLDER_TOKEN;
  const cliPrompt = buildCliPrompt(tokenDisplay);

  const clientSelector = (
    <div className="flex items-center gap-0.5">
      {MCP_CLIENTS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setMcpClient(id)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
            mcpClient === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
          )}
          title={label}
          aria-label={label}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} alt="" className="size-3" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Step 1 */}
      {result ? (
        <div className="space-y-2">
          <h2 className="font-serif text-2xl tracking-tight">
            Step 1 · Create your online CV
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href={`/${result.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 min-w-0 flex-1 items-center gap-1 rounded-md border bg-muted px-3 py-2 text-base hover:brightness-95 transition-all"
            >
              <span className="select-none font-mono text-foreground">cv.ha7ch.com/</span>
              <span className="font-mono text-foreground">{result.handle}</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
            <button
              onClick={() => {
                try { localStorage.removeItem(LS_KEY); } catch {}
                setResult(null);
                setHandle("");
              }}
              className="h-10 rounded-md px-4 text-sm text-muted-foreground border border-input hover:text-foreground transition-colors w-full sm:w-auto"
            >
              switch account
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h2 className="font-serif text-2xl tracking-tight">
            Step 1 · Create your online CV
          </h2>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-md border border-input bg-background px-3 text-base transition focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/30">
                <span className="select-none font-mono text-muted-foreground">
                  cv.ha7ch.com/
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setError("");
                    setTakenHandle(null);
                    setTokenError("");
                  }}
                  placeholder="yourname"
                  maxLength={30}
                  required
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent font-mono outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !handle}
                className="h-10 w-full sm:w-auto"
              >
                {loading ? "Claiming…" : "Get token →"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {takenHandle ? "taken · yours?" : "Choose a username for your page."}
            </p>
          </div>

          {error && !takenHandle && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}

      {/* Step 2 - Save your token */}
      <div className="space-y-2">
        <h3 className="font-serif text-2xl tracking-tight">
          {takenHandle && !result ? "Back already?" : "Step 2 · Save your token"}
        </h3>
        {takenHandle && !result ? (
          <>
            <div className="overflow-hidden rounded-md border bg-muted">
              <div className="flex items-center justify-end gap-0.5 px-1.5 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  onClick={() => loginWithToken()}
                  disabled={tokenLoading || !token.trim()}
                >
                  {tokenLoading ? "Verifying…" : "Log in →"}
                </Button>
              </div>
              <input
                value={token}
                onChange={(e) => { setToken(e.target.value); setTokenError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loginWithToken(); } }}
                placeholder="cv_pat_..."
                className="w-full bg-transparent px-4 pb-3 pt-0 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>
            {tokenError && <p className="text-sm text-destructive">{tokenError}</p>}
          </>
        ) : (
          <>
            <CodeBlock value={tokenDisplay} id="token" copied={copied} onCopy={copy} />
            {!result && (
              <p className="text-xs text-muted-foreground">
                Your real token appears here after Step 1.
              </p>
            )}
          </>
        )}
      </div>

      {/* Step 3 - Update your resume */}
      <div className="space-y-3">
        <h3 className="font-serif text-2xl tracking-tight">
          Step 3 · Update your resume
        </h3>
        <Tabs defaultValue="cli">
          <TabsList className="w-fit">
            <TabsTrigger value="cli">Quick start</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
          </TabsList>

          <TabsContent value="cli" className="mt-4 space-y-2">
            <CodeBlock value={cliPrompt} id="cli" copied={copied} onCopy={copy} wrap />
            <p className="text-xs text-muted-foreground">
              Copy and paste into Claude Code, Codex, or Cursor — no setup needed.
            </p>
          </TabsContent>

          <TabsContent value="mcp" className="mt-4 space-y-2">
            {result && mcpClient === "cursor" && (
              <a
                href={cursorDeeplink(result.token)}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MCP_CLIENTS[1].icon} alt="" className="size-4 invert" />
                Add to Cursor
              </a>
            )}
            <CodeBlock
              value={
                mcpClient === "claude"
                  ? claudeCommand(tokenDisplay)
                  : mcpClient === "codex"
                    ? codexCommand(tokenDisplay)
                    : mcpJson(tokenDisplay)
              }
              id={`mcp-${mcpClient}`}
              copied={copied}
              onCopy={copy}
              selector={clientSelector}
            />
            <p className="text-xs text-muted-foreground">
              {mcpClient === "claude" && "Run once in your terminal, then restart Claude Code."}
              {mcpClient === "cursor" && "Or add to ~/.cursor/mcp.json, then reload Cursor."}
              {mcpClient === "codex" && "Run in your terminal. Add the export to ~/.zshrc so the token persists."}
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Step 4 - Dashboard */}
      <div className="space-y-2">
        <h3 className="font-serif text-2xl tracking-tight">
          Step 4 · View your dashboard{" "}
          <span className="text-muted-foreground text-xl">(optional)</span>
        </h3>
        {result ? (
          <Link
            href={`/${result.handle}/dashboard`}
            className="flex min-h-10 min-w-0 w-fit items-center gap-1 rounded-md border bg-muted px-3 py-2 text-base hover:brightness-95 transition-all"
          >
            <span className="select-none font-mono text-foreground">cv.ha7ch.com/</span>
            <span className="font-mono text-foreground">{result.handle}/dashboard</span>
            <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <div className="flex min-h-10 min-w-0 w-fit items-center gap-1 rounded-md border bg-muted px-3 py-2 text-base opacity-50 cursor-not-allowed select-none">
            <span className="font-mono text-foreground">cv.ha7ch.com/</span>
            <span className="font-mono text-muted-foreground">yourname/dashboard</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          See all your targeted variants and their shareable links.
        </p>
      </div>

    </div>
  );
}

function CodeBlock({ value, id, copied, onCopy, selector, wrap = false }: {
  value: string;
  id: string;
  copied: string | null;
  onCopy: (t: string, k: string) => void;
  selector?: React.ReactNode;
  wrap?: boolean;
}) {
  const isCopied = copied === id;
  return (
    <div className="overflow-hidden rounded-md border bg-muted">
      <div className="flex items-center justify-end gap-0.5 px-1.5 py-1">
        {selector}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:bg-background/60 hover:text-foreground"
          onClick={() => onCopy(value, id)}
          aria-label={isCopied ? "Copied" : "Copy"}
        >
          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre
        className={cn(
          "overflow-x-auto px-4 pb-3 pt-0 font-mono text-sm leading-relaxed",
          wrap ? "whitespace-pre-wrap" : "whitespace-pre",
        )}
      >
        <code>{value}</code>
      </pre>
    </div>
  );
}

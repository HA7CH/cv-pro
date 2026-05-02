"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SavedData { handle: string; token: string }
const LS_KEY = "cv_registration";

type McpClient = "claude" | "cursor" | "codex";

const MCP_CLIENTS: { id: McpClient; label: string; icon: string }[] = [
  { id: "claude", label: "Claude Code", icon: "/mcp/claude.svg" },
  { id: "cursor", label: "Cursor", icon: "/mcp/cursor.svg" },
  { id: "codex", label: "Codex", icon: "/mcp/openai.svg" },
];

const MCP_URL = "https://ai-cv.ha7ch.com/api/mcp";

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

export default function RegisterFlow() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SavedData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [mcpClient, setMcpClient] = useState<McpClient>("claude");

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
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: h }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    const saved = { handle: data.handle, token: data.token };
    try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch {}
    setResult(saved);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  if (result) {
    const cliPrompt =
      `Update my resume at ai-cv.ha7ch.com.\n\n` +
      `Run first: npx ai-cv@latest login ${result.token}\n\n` +
      `Then update based on whatever I provide — PDF, pasted text, or described changes. ` +
      `Run npx ai-cv@latest --help if needed. Ask if unclear.`;

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
            <img src={icon} alt="" className="size-3" />
          </button>
        ))}
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Claimed handle */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">ai-cv.ha7ch.com/{result.handle}</span>{" "}
            is yours
          </span>
          <button
            onClick={() => { try { localStorage.removeItem(LS_KEY); } catch {} setResult(null); setHandle(""); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            switch handle
          </button>
        </div>

        {/* Token */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Token</p>
          <CodeBlock value={result.token} id="token" copied={copied} onCopy={copy} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cli">
          <TabsList className="w-fit">
            <TabsTrigger value="cli">CLI</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
          </TabsList>

          <TabsContent value="cli" className="mt-4 space-y-2">
            <CodeBlock value={cliPrompt} id="cli" copied={copied} onCopy={copy} wrap />
            <p className="text-xs text-muted-foreground">
              Paste into <span className="font-medium">local</span> Claude Code — works with PDF, text, or plain conversation.
              Sandboxed agents (Claude Code Cloud, ChatGPT Code Interpreter) often block this host;
              use the MCP tab from claude.ai instead.
            </p>
          </TabsContent>

          <TabsContent value="mcp" className="mt-4 space-y-2">
            {mcpClient === "cursor" && (
              <a
                href={cursorDeeplink(result.token)}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <img src={MCP_CLIENTS[1].icon} alt="" className="size-4 invert" />
                Add to Cursor
              </a>
            )}
            <CodeBlock
              value={
                mcpClient === "claude"
                  ? claudeCommand(result.token)
                  : mcpClient === "codex"
                    ? codexCommand(result.token)
                    : mcpJson(result.token)
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

        {/* Live page */}
        <Link
          href={`/${result.handle}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ai-cv.ha7ch.com/{result.handle}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Your resume will live at{" "}
        <span className="font-mono text-foreground">ai-cv.ha7ch.com/{handle || "handle"}</span>
      </p>
      <div className="flex gap-2">
        <Input
          value={handle}
          onChange={(e) => { setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setError(""); }}
          placeholder="your-handle"
          maxLength={30}
          required
          autoFocus
          className="font-mono"
        />
        <Button type="submit" disabled={loading || !handle}>
          {loading ? "…" : "Get token →"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
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

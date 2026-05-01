"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SavedData { handle: string; token: string }
const LS_KEY = "cv_registration";

type McpClient = "claude" | "cursor" | "codex";

const MCP_CLIENTS: { id: McpClient; label: string; icon: React.ReactNode }[] = [
  {
    id: "claude",
    label: "Claude Code",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
        {/* Anthropic logo — 6 rounded bars radiating from center */}
        <rect x="11" y="2" width="2" height="7" rx="1" />
        <rect x="11" y="15" width="2" height="7" rx="1" />
        <rect x="11" y="2" width="2" height="7" rx="1" transform="rotate(60 12 12)" />
        <rect x="11" y="15" width="2" height="7" rx="1" transform="rotate(60 12 12)" />
        <rect x="11" y="2" width="2" height="7" rx="1" transform="rotate(120 12 12)" />
        <rect x="11" y="15" width="2" height="7" rx="1" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  {
    id: "cursor",
    label: "Cursor",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
        {/* Cursor arrow */}
        <path d="M4 2v18l5-5 3 7 2.5-1-3-7h6L4 2z" />
      </svg>
    ),
  },
  {
    id: "codex",
    label: "Codex",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
        {/* OpenAI bloom — simplified swirl */}
        <path d="M21.4 8.6a6 6 0 0 0-.5-4.9 6.1 6.1 0 0 0-6.5-2.9 6 6 0 0 0-4.5-2A6.1 6.1 0 0 0 4 4.3a6 6 0 0 0-4 2.9 6.1 6.1 0 0 0 .7 7.2 6 6 0 0 0 .5 4.9 6.1 6.1 0 0 0 6.5 2.9 6 6 0 0 0 4.5 2 6.1 6.1 0 0 0 5.8-4.2 6 6 0 0 0 4-2.9 6.1 6.1 0 0 0-.7-7.2zM12 20.6a4.5 4.5 0 0 1-2.9-1l.1-.1 4.8-2.8a.8.8 0 0 0 .4-.7V9.7l2 1.2v5.6a4.5 4.5 0 0 1-4.4 4.1zM3.6 17a4.5 4.5 0 0 1-.5-3l.1.1 4.8 2.8a.8.8 0 0 0 .8 0l5.8-3.4v2.3l-4.8 2.8A4.5 4.5 0 0 1 3.6 17zm-.9-9.5a4.5 4.5 0 0 1 2.4-2V11a.8.8 0 0 0 .4.7l5.8 3.3-2 1.2-4.8-2.8A4.5 4.5 0 0 1 2.7 7.5zm15.1 3.9-5.8-3.4 2-1.2a.1.1 0 0 1 .1 0L18.9 9.6a4.5 4.5 0 0 1-.7 8.1v-5.6a.8.8 0 0 0-.4-.7zm2-3-.1-.1-4.8-2.8a.8.8 0 0 0-.8 0L8.4 8.9V6.6l4.8-2.8a4.5 4.5 0 0 1 6.7 4.6zM7.3 12.5 5.4 11.4a.1.1 0 0 1 0-.1V6.1A4.5 4.5 0 0 1 12.7 3l-.1.1-4.8 2.8a.8.8 0 0 0-.4.7zm1 2.3 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z" />
      </svg>
    ),
  },
];

function mcpCommand(client: McpClient, token: string): string {
  const json = JSON.stringify(
    {
      mcpServers: {
        cv: {
          type: "http",
          url: "https://ai-cv.ha7ch.com/api/mcp",
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );

  if (client === "claude") {
    return (
      `claude mcp add cv --transport http https://ai-cv.ha7ch.com/api/mcp \\\n` +
      `  --header "Authorization: Bearer ${token}"`
    );
  }
  if (client === "cursor") {
    return `// ~/.cursor/mcp.json\n${json}`;
  }
  return `// ~/.codex/config.json\n${json}`;
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

    const mcpCmd = mcpCommand(mcpClient, result.token);

    const clientSelector = (
      <div className="flex items-center gap-0.5">
        {MCP_CLIENTS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setMcpClient(id)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              mcpClient === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={label}
            aria-label={label}
          >
            {icon}
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
            <CodeBlock value={cliPrompt} id="cli" copied={copied} onCopy={copy} />
            <p className="text-xs text-muted-foreground">
              Paste into Claude Code — works with PDF, text, or plain conversation.
            </p>
          </TabsContent>

          <TabsContent value="mcp" className="mt-4 space-y-2">
            <CodeBlock
              value={mcpCmd}
              id={`mcp-${mcpClient}`}
              copied={copied}
              onCopy={copy}
              selector={clientSelector}
            />
            <p className="text-xs text-muted-foreground">
              {mcpClient === "claude" && "Run once in your terminal, then restart Claude Code."}
              {mcpClient === "cursor" && "Add to ~/.cursor/mcp.json, then reload Cursor."}
              {mcpClient === "codex" && "Add to ~/.codex/config.json, then restart Codex."}
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

function CodeBlock({ value, id, copied, onCopy, selector }: {
  value: string;
  id: string;
  copied: string | null;
  onCopy: (t: string, k: string) => void;
  selector?: React.ReactNode;
}) {
  const isCopied = copied === id;
  return (
    <div className="relative">
      <pre className={cn(
        "overflow-x-auto rounded-md border bg-muted px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap",
        selector ? "pr-28" : "pr-14",
      )}>
        <code>{value}</code>
      </pre>
      <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
        {selector}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onCopy(value, id)}
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

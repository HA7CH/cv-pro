"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SavedData { handle: string; token: string }
const LS_KEY = "cv_registration";

export default function RegisterFlow() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SavedData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

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
      `Update my resume at cv.ha7ch.com using the aicv CLI.\n` +
      `CLI: npx @lawtedwu/aicv@latest\n` +
      `CV_TOKEN=${result.token}`;

    const mcpCmd =
      `claude mcp add cv --transport http https://cv.ha7ch.com/api/mcp \\\n` +
      `  --header "Authorization: Bearer ${result.token}"`;

    return (
      <div className="space-y-6">
        {/* Claimed handle */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">cv.ha7ch.com/{result.handle}</span>{" "}
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
            <CodeBlock value={mcpCmd} id="mcp" copied={copied} onCopy={copy} />
            <p className="text-xs text-muted-foreground">
              Run once in your terminal, then restart Claude Code.
            </p>
          </TabsContent>
        </Tabs>

        {/* Live page */}
        <Link
          href={`/${result.handle}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          cv.ha7ch.com/{result.handle}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Your resume will live at{" "}
        <span className="font-mono text-foreground">cv.ha7ch.com/{handle || "handle"}</span>
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

function CodeBlock({ value, id, copied, onCopy }: {
  value: string;
  id: string;
  copied: string | null;
  onCopy: (t: string, k: string) => void;
}) {
  const isCopied = copied === id;
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border bg-muted px-4 py-3 pr-14 font-mono text-sm leading-relaxed whitespace-pre-wrap">
        <code>{value}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1.5 h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => onCopy(value, id)}
      >
        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

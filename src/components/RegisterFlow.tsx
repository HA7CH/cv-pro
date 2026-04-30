"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SavedData { handle: string; token: string }
type Mode = "cli" | "mcp";
const LS_KEY = "cv_registration";

export default function RegisterFlow() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SavedData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<Mode>("cli");
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
    setErrorMsg("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: h }),
    });
    const data = await res.json();
    if (!res.ok) { setLoading(false); setErrorMsg(data.error ?? "Error"); return; }
    const saved = { handle: data.handle, token: data.token };
    try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch {}
    setResult(saved);
    setLoading(false);
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
        {/* Handle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            <span className="font-medium text-zinc-900">cv.ha7ch.com/{result.handle}</span>
            {" "}is yours
          </span>
          <button
            onClick={() => { try { localStorage.removeItem(LS_KEY); } catch {} setResult(null); setHandle(""); }}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            switch handle
          </button>
        </div>

        {/* Token */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400">Token</p>
          <Code value={result.token} id="token" copied={copied} onCopy={copy} />
        </div>

        {/* Switcher + content */}
        <div>
          <div className="mb-4 flex w-fit rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            {(["cli", "mcp"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          {mode === "cli" && (
            <div className="space-y-2">
              <Code value={cliPrompt} id="cli" copied={copied} onCopy={copy} />
              <p className="text-xs text-zinc-400">
                Paste into Claude Code. It installs the CLI and updates your resume — PDF, text, or just describe the change.
              </p>
            </div>
          )}

          {mode === "mcp" && (
            <div className="space-y-2">
              <Code value={mcpCmd} id="mcp" copied={copied} onCopy={copy} />
              <p className="text-xs text-zinc-400">
                Run once in your terminal, then restart Claude Code.
              </p>
            </div>
          )}
        </div>

        {/* Live page */}
        <Link
          href={`/${result.handle}`}
          target="_blank"
          className="inline-block text-sm text-zinc-500 hover:text-zinc-900"
        >
          cv.ha7ch.com/{result.handle} ↗
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-zinc-500">
        Your resume will live at{" "}
        <span className="font-mono text-zinc-900">cv.ha7ch.com/{handle || "handle"}</span>
      </p>
      <div className="flex gap-2">
        <input
          value={handle}
          onChange={(e) => { setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setErrorMsg(""); }}
          placeholder="your-handle"
          maxLength={30}
          required
          autoFocus
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 font-mono text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
        />
        <button
          type="submit"
          disabled={loading || !handle}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
        >
          {loading ? "…" : "Get token →"}
        </button>
      </div>
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}

function Code({ value, id, copied, onCopy }: {
  value: string; id: string; copied: string | null; onCopy: (t: string, k: string) => void;
}) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 pr-16 font-mono text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
        <code>{value}</code>
      </pre>
      <button
        onClick={() => onCopy(value, id)}
        className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
      >
        {copied === id ? "✓" : "Copy"}
      </button>
    </div>
  );
}

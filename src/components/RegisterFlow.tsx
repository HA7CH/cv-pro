"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Step = "idle" | "loading" | "success" | "error";

interface SavedData {
  handle: string;
  token: string;
}

const LS_KEY = "cv_registration";

export default function RegisterFlow() {
  const [handle, setHandle] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<SavedData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedData;
        if (parsed.handle && parsed.token) {
          setResult(parsed);
          setStep("success");
        }
      }
    } catch {}
  }, []);

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const h = handle.toLowerCase().trim();
    if (!h) return;
    setStep("loading");
    setErrorMsg("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: h }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStep("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    const saved: SavedData = { handle: data.handle, token: data.token };
    try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch {}
    setResult(saved);
    setStep("success");
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function reset() {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setResult(null);
    setStep("idle");
    setHandle("");
  }

  if (step === "success" && result) {
    const cliPrompt =
      `请你用 npx cvhatch 帮我更新简历：\n` +
      `1. npx cvhatch help — 查看文档\n` +
      `2. npx cvhatch login ${result.token}\n` +
      `3. 读取我这份 PDF，提取简历信息，调用 npx cvhatch update 更新到 cv.ha7ch.com`;

    const mcpCmd =
      `claude mcp add cv --transport http https://cv.ha7ch.com/api/mcp \\\n` +
      `  --header "Authorization: Bearer ${result.token}"`;

    return (
      <div className="space-y-8">
        {/* Claim */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-semibold text-green-900">
            ✓ cv.ha7ch.com/{result.handle} is yours
          </p>
          <p className="mt-1 text-xs text-green-700">
            Token saved in your browser.{" "}
            <button onClick={reset} className="underline underline-offset-2 hover:text-green-900">
              Use a different handle
            </button>
          </p>
        </div>

        {/* Token */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-700">Your token</p>
          <CodeBlock value={result.token} id="token" copied={copied} onCopy={copy} />
        </div>

        {/* Primary: CLI prompt */}
        <div>
          <p className="mb-1 text-sm font-semibold text-zinc-800">
            Use it in Claude Code
          </p>
          <p className="mb-2 text-sm text-zinc-500">
            Copy this prompt into Claude Code — no setup, no restart needed:
          </p>
          <CodeBlock value={cliPrompt} id="cli" copied={copied} onCopy={copy} />
          <p className="mt-2 text-xs text-zinc-400">
            Claude will install the CLI automatically, log in, and update your resume from the PDF.
          </p>
        </div>

        {/* Secondary: MCP */}
        <details className="group">
          <summary className="cursor-pointer list-none text-sm text-zinc-400 hover:text-zinc-600">
            <span className="group-open:hidden">▸ </span>
            <span className="hidden group-open:inline">▾ </span>
            Prefer MCP (for repeated use)
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-zinc-500">
              Run once in your terminal, then restart Claude Code:
            </p>
            <CodeBlock value={mcpCmd} id="mcp" copied={copied} onCopy={copy} />
          </div>
        </details>

        {/* Live page */}
        <div className="border-t border-zinc-100 pt-5">
          <p className="text-sm text-zinc-500">
            Your live page:{" "}
            <Link
              href={`/${result.handle}`}
              target="_blank"
              className="font-medium text-zinc-900 hover:underline underline-offset-4"
            >
              cv.ha7ch.com/{result.handle} ↗
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="mb-3 text-sm text-zinc-500">
          Your resume will live at{" "}
          <span className="font-mono text-zinc-700">
            cv.ha7ch.com/
            <span className="text-zinc-900">{handle || "your-handle"}</span>
          </span>
        </p>
        <div className="flex gap-2">
          <input
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              setStep("idle");
              setErrorMsg("");
            }}
            placeholder="your-handle"
            maxLength={30}
            required
            autoFocus
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 font-mono text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
          <button
            type="submit"
            disabled={step === "loading" || !handle}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
          >
            {step === "loading" ? "Claiming…" : "Get token →"}
          </button>
        </div>
        {step === "error" && (
          <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
        )}
      </div>
    </form>
  );
}

function CodeBlock({
  value,
  id,
  copied,
  onCopy,
}: {
  value: string;
  id: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 pr-20 font-mono text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
        <code>{value}</code>
      </pre>
      <button
        onClick={() => onCopy(value, id)}
        className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
      >
        {copied === id ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

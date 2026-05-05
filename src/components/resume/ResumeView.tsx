"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import ResumeTemplate from "./ResumeTemplate";
import type { ResumeData } from "@/types/resume";
import type { ResumeViewBanner } from "@/lib/resume-filter";

export default function ResumeView({
  data,
  banner,
}: {
  data: ResumeData;
  banner?: ResumeViewBanner | null;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const isJSON = params.get("view") === "json";

  return (
    <div className="relative">
      <nav
        aria-label="View toggle"
        className="absolute left-6 top-6 z-10 flex items-baseline gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-400 sm:left-10 sm:top-10"
      >
        <Link
          href={pathname}
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
          href={`${pathname}?view=json`}
          scroll={false}
          aria-current={isJSON ? "page" : undefined}
          className={
            isJSON ? "font-medium text-zinc-900" : "transition hover:text-zinc-700"
          }
        >
          for agent
        </Link>
      </nav>

      {isJSON ? <ResumeJSON data={data} /> : <ResumeTemplate data={data} banner={banner} />}
    </div>
  );
}

function ResumeJSON({ data }: { data: ResumeData }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <main className="mx-auto max-w-3xl px-10 pb-16 pt-24 text-zinc-900">
      <p className="mb-4 text-[13px] leading-relaxed text-zinc-500">
        Machine-readable resume — fetched and edited by AI agents (Claude,
        Cursor, ChatGPT) through the cv-pro CLI or MCP. Also served as raw JSON
        at{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700">
          /{data.username}.json
        </code>
        .
      </p>
      <div className="relative">
        <CopyButton text={json} />
        <pre className="overflow-x-auto rounded-md bg-zinc-50 p-5 pr-20 font-mono text-[12px] leading-[1.7]">
          <Highlighted json={json} />
        </pre>
      </div>
    </main>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // ignore — older browsers / insecure contexts
        }
      }}
      className="absolute right-3 top-3 z-10 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Highlighted({ json }: { json: string }) {
  const tokenRe =
    /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(json))) {
    if (m.index > last) parts.push(json.slice(last, m.index));
    let cls = "";
    if (m[1]) cls = "text-zinc-900 font-semibold";
    else if (m[2]) cls = "text-emerald-700";
    else if (m[3]) cls = "text-violet-700";
    else if (m[4]) cls = "text-amber-600";
    else if (m[5]) cls = "text-zinc-400";
    parts.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = tokenRe.lastIndex;
  }
  if (last < json.length) parts.push(json.slice(last));
  return <>{parts}</>;
}

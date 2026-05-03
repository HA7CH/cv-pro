"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import ResumeTemplate from "./ResumeTemplate";
import type { ResumeData } from "@/types/resume";

export default function ResumeView({ data }: { data: ResumeData }) {
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

      {isJSON ? <ResumeJSON data={data} /> : <ResumeTemplate data={data} />}
    </div>
  );
}

function ResumeJSON({ data }: { data: ResumeData }) {
  return (
    <main className="mx-auto max-w-3xl px-10 pb-16 pt-24 text-zinc-900">
      <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">
        Machine-readable resume — fetched and edited by AI agents (Claude,
        Cursor, ChatGPT) through the ai-cv CLI or MCP.
      </p>
      <pre className="overflow-x-auto rounded-md bg-zinc-50 p-5 font-mono text-[12px] leading-[1.7] text-zinc-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}

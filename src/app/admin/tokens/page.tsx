import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listPats } from "@/lib/pat";
import TokensClient from "./TokensClient";

export default async function TokensPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const tokens = await listPats(session.username);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-zinc-900">Personal access tokens</h1>
        <Link
          href="/admin"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to dashboard
        </Link>
      </div>

      <p className="mb-8 text-sm text-zinc-600">
        Use a PAT to authenticate the cv plugin in Claude Code or Codex.
        Configure your MCP client with{" "}
        <code className="rounded bg-zinc-100 px-1 font-mono text-xs">
          Authorization: Bearer cv_pat_…
        </code>
        .
      </p>

      <TokensClient initialTokens={tokens} />
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import { createTokenAction, revokeTokenAction } from "../actions";
import type { PatRow } from "@/lib/pat";

export default function TokensClient({
  initialTokens,
}: {
  initialTokens: PatRow[];
}) {
  const [tokens] = useState(initialTokens);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleCreate(formData: FormData) {
    const result = await createTokenAction(formData);
    if ("token" in result) {
      setCreated(result.token);
    } else {
      alert(result.error);
    }
  }

  return (
    <>
      {created && (
        <div className="mb-6 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-900">
            Copy this token now — it won&apos;t be shown again.
          </p>
          <code className="block break-all rounded bg-white px-3 py-2 font-mono text-xs text-zinc-900">
            {created}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(created);
            }}
            className="text-xs font-medium text-amber-900 underline-offset-4 hover:underline"
          >
            Copy
          </button>{" "}
          ·{" "}
          <button
            onClick={() => setCreated(null)}
            className="text-xs text-amber-900/70"
          >
            Dismiss
          </button>
        </div>
      )}

      <form
        action={(fd) => startTransition(() => handleCreate(fd))}
        className="mb-10 flex gap-2"
      >
        <input
          name="name"
          required
          placeholder="Token name (e.g. claude-code-mac)"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating…" : "Generate token"}
        </button>
      </form>

      {tokens.length === 0 ? (
        <p className="text-sm text-zinc-500">No tokens yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {tokens.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-zinc-900">{t.name}</p>
                <p className="text-xs text-zinc-500">
                  Created {new Date(t.created_at).toLocaleDateString()} ·{" "}
                  {t.last_used_at
                    ? `Last used ${new Date(t.last_used_at).toLocaleDateString()}`
                    : "Never used"}
                  {t.revoked_at && " · Revoked"}
                </p>
              </div>
              {!t.revoked_at && (
                <form action={revokeTokenAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 hover:underline"
                  >
                    Revoke
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

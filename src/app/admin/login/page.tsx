import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginAction } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
      <form
        action={loginAction}
        className="w-full space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="font-serif text-2xl text-zinc-900">cv admin</h1>
        <p className="text-sm text-zinc-500">
          v1 uses a hardcoded admin account. Configure via{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs">
            ADMIN_USERNAME
          </code>{" "}
          /{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs">
            ADMIN_PASSWORD
          </code>
          .
        </p>

        <label className="block text-sm">
          <span className="text-zinc-700">Username</span>
          <input
            name="username"
            required
            autoComplete="username"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        <label className="block text-sm">
          <span className="text-zinc-700">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600">Wrong username or password.</p>
        )}

        <button
          type="submit"
          className="block w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}

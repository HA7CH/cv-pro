import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getResumeByUsername } from "@/lib/resume-store";
import ResumeTemplate from "@/components/resume/ResumeTemplate";
import { logoutAction } from "./actions";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const resume = await getResumeByUsername(session.username);

  return (
    <>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3 text-sm">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif text-zinc-900">
              cv admin
            </Link>
            <span className="text-zinc-500">@{session.username}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/${session.username}`}
              target="_blank"
              className="text-zinc-700 hover:text-zinc-900"
            >
              View public page →
            </Link>
            <Link
              href="/admin/tokens"
              className="text-zinc-700 hover:text-zinc-900"
            >
              Tokens
            </Link>
            <form action={logoutAction}>
              <button className="text-zinc-500 hover:text-zinc-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {resume ? (
        <ResumeTemplate data={resume} />
      ) : (
        <main className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-zinc-500">
            No resume found for @{session.username}. Use the cv plugin in
            Claude Code to publish one.
          </p>
        </main>
      )}
    </>
  );
}

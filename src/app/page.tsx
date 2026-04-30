import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-16 md:py-24">
      <div className="flex-1">
        <h1 className="font-serif text-4xl tracking-tight text-zinc-900 md:text-5xl">
          cv
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600">
          Turn your PDF resume into a living personal site. Drop a PDF in
          Claude Code or Codex — your page at{" "}
          <span className="font-mono text-zinc-900">
            cv.ha7ch.com/{"{your-handle}"}
          </span>{" "}
          updates instantly.
        </p>

        <section className="mt-12 space-y-3 text-zinc-700">
          <h2 className="font-serif text-xl text-zinc-900">How it works</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Install the cv plugin in your AI assistant:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm">
                /plugin install ha7ch/cv
              </code>
            </li>
            <li>Sign in at cv.ha7ch.com and generate a personal access token.</li>
            <li>
              Drop your PDF in Claude Code and say <em>&ldquo;update my resume&rdquo;</em>.
              Claude reads the PDF and pushes the structured content here.
            </li>
            <li>
              Your live page at{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm">
                cv.ha7ch.com/your-handle
              </code>{" "}
              updates within seconds.
            </li>
          </ol>
        </section>

        <section className="mt-12 space-y-3">
          <h2 className="font-serif text-xl text-zinc-900">Live demo</h2>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-zinc-900 underline-offset-4 hover:underline"
          >
            View Lawted&apos;s page →
          </Link>
        </section>
      </div>

      <footer className="mt-16 text-sm text-zinc-500">
        Built by ha7ch · A living-resume product
      </footer>
    </main>
  );
}

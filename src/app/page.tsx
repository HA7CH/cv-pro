import RegisterFlow from "@/components/RegisterFlow";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 md:py-24">
      <h1 className="font-serif text-5xl tracking-tight text-zinc-900">cv</h1>
      <p className="mt-2 text-zinc-500">Your PDF resume, as a living site.</p>

      <div className="mt-10">
        <RegisterFlow />
      </div>

      <footer className="mt-14 text-xs text-zinc-400">
        <a href="https://github.com/LAWTED/cv" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600">
          github.com/LAWTED/cv
        </a>
      </footer>
    </main>
  );
}

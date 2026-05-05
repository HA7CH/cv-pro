import RegisterFlow from "@/components/RegisterFlow";
import { TextLoop } from "@/components/core/text-loop";

const FUNDING_RAISED = 0.20;
const FUNDING_TARGET = 2500.20;

export default function Home() {
  const fundingPercent = Math.min(
    100,
    Math.max(0, (FUNDING_RAISED / FUNDING_TARGET) * 100),
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[1.1]">
        Stop sending different PDFs.
      </h1>
      <div className="mt-6 inline-flex whitespace-pre-wrap font-mono text-base md:text-xl text-muted-foreground">
        Send cv.pro/lawted
        <TextLoop
          className="overflow-y-clip"
          interval={2.8}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 28,
            mass: 1,
          }}
          variants={{
            initial: { y: 8, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: -8, opacity: 0 },
          }}
        >
          <span>?for=openai</span>
          <span>?role=designer</span>
          <span>?at=2026</span>
          <span>?focus=research</span>
        </TextLoop>
      </div>

      <div className="mt-10">
        <RegisterFlow />
      </div>

      <section
        aria-labelledby="funding-title"
        className="mt-16 rounded-lg border border-border bg-muted/30 p-5 md:p-6"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p id="funding-title" className="text-sm font-medium">
            Help us claim <span className="font-mono">cv.pro</span>
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            ${FUNDING_RAISED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${FUNDING_TARGET.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(fundingPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-foreground transition-[width] duration-700 ease-out"
            style={{ width: `${fundingPercent}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          We&rsquo;d rather live at <span className="font-mono">cv.pro</span>{" "}
          than on a subdomain. Chip in and we&rsquo;ll buy it openly. I&rsquo;ll
          check my inbox daily and sync the progress by hand{" "}
          <span aria-hidden>:)</span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <a
            href="https://buymeacoffee.com/lawted"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Buy me a coffee
          </a>
          <a
            href="https://domains.cloudflare.com/?domain=cv.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Check current price on Cloudflare →
          </a>
        </div>
      </section>

      <footer className="mt-14">
        <a href="https://github.com/LAWTED/cv-pro" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-label="GitHub">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </footer>
    </main>
  );
}

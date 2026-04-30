import type { ProjectShort, ProjectDetailed } from "@/types/resume";
import { ChevronRight, ExternalLink } from "lucide-react";

export default function Projects({
  recent,
  detailed,
}: {
  recent: ProjectShort[];
  detailed: ProjectDetailed[];
}) {
  return (
    <section className="p-6">
      <h2 className="font-serif mb-4 text-2xl">Recent Projects</h2>
      <div className="space-y-6">
        {recent.map((p) => (
          <div key={p.title}>
            <a
              href={p.url}
              target={p.url.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              data-cursor="a"
              className="text-zinc-900"
            >
              <h3
                data-cursor="block"
                data-voice={p.voice}
                className="w-fit text-xl"
              >
                {p.title}
              </h3>
            </a>
            <p className="text-zinc-500">{p.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-serif mb-4 text-2xl">Projects</h2>
        <div className="space-y-6">
          {detailed.map((p) => (
            <div key={p.title}>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="a"
                >
                  <h3
                    data-cursor="block"
                    data-voice={p.titleVoice}
                    className="w-fit text-xl text-zinc-900"
                  >
                    {p.title}
                  </h3>
                </a>
              ) : (
                <h3
                  data-cursor="block"
                  data-voice={p.titleVoice}
                  className="w-fit text-xl text-zinc-900"
                >
                  {p.title}
                </h3>
              )}
              <div className="flex items-center justify-between text-zinc-500">
                <span>{p.type}</span>
                <span className="text-xs tabular-nums sm:text-sm">
                  {p.endDate ? `${p.startDate} — ${p.endDate}` : p.startDate}
                </span>
              </div>
              {p.award && (
                <p className="flex items-center justify-between gap-3 text-zinc-500">
                  <span>{p.award}</span>
                  {p.externalLink && (
                    <a
                      href={p.externalLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="a"
                      className="inline-flex shrink-0 items-center gap-1 text-zinc-700"
                    >
                      {p.externalLink.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </p>
              )}
              <details className="group mt-2">
                <summary
                  className="flex w-fit cursor-pointer list-none items-center gap-1 text-zinc-500"
                  data-cursor="block"
                >
                  Details
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <ul className="mt-2 list-outside list-disc space-y-1 pl-4 text-zinc-500">
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

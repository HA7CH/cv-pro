import type { ResumeData } from "@/types/resume";

export default function ResumeTemplate({ data }: { data: ResumeData }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-zinc-900">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-serif text-4xl">{data.header.name}</h1>
        {data.header.tagline && (
          <p className="mt-1 text-zinc-600">{data.header.tagline}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
          {data.personalInfo.email && (
            <a href={`mailto:${data.personalInfo.email}`} className="hover:text-zinc-900">
              {data.personalInfo.email}
            </a>
          )}
          {data.personalInfo.phone && (
            <a href={`tel:${data.personalInfo.phone}`} className="hover:text-zinc-900">
              {data.personalInfo.phone}
            </a>
          )}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
          {data.personalInfo.pronouns && <span>{data.personalInfo.pronouns}</span>}
          {data.personalInfo.mbti && <span>{data.personalInfo.mbti}</span>}
          {data.personalInfo.birthday && <span>b. {data.personalInfo.birthday}</span>}
        </div>
      </header>

      {/* Work Experience */}
      {data.experience.length > 0 && (
        <Section title="Experience">
          {data.experience.map((job, i) => (
            <div key={i} className="mb-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{job.company}</span>
                <span className="shrink-0 text-sm tabular-nums text-zinc-500">
                  {job.startDate} — {job.endDate}
                </span>
              </div>
              <div className="text-sm text-zinc-500">{job.role}</div>
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <Section title="Education">
          {data.education.map((e, i) => (
            <div key={i} className="mb-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{e.school}</span>
                <span className="shrink-0 text-sm tabular-nums text-zinc-500">
                  {e.startDate} — {e.endDate}
                </span>
              </div>
              <div className="text-sm text-zinc-500">{e.major}</div>
              <div className="text-sm text-zinc-500">{e.degree}</div>
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <Section title="Skills">
          <div className="space-y-3">
            {data.skills.map((cat) => (
              <div key={cat.name} className="flex gap-3 text-sm">
                <span className="w-40 shrink-0 text-zinc-500">{cat.name}</span>
                <span>{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {(data.projectsDetailed.length > 0 || data.projectsRecent.length > 0) && (
        <Section title="Projects">
          {data.projectsDetailed.map((p, i) => (
            <div key={i} className="mb-5">
              <div className="flex items-baseline justify-between gap-4">
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline underline-offset-4"
                  >
                    {p.title}
                  </a>
                ) : (
                  <span className="font-medium">{p.title}</span>
                )}
                <span className="shrink-0 text-sm tabular-nums text-zinc-500">
                  {p.endDate ? `${p.startDate} — ${p.endDate}` : p.startDate}
                </span>
              </div>
              <div className="text-sm text-zinc-500">{p.type}</div>
              {p.award && <div className="text-sm text-zinc-500">{p.award}</div>}
              {p.bullets.length > 0 && (
                <ul className="mt-1.5 list-disc pl-4 text-sm text-zinc-600 space-y-0.5">
                  {p.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {data.projectsRecent.length > 0 && data.projectsDetailed.length > 0 && (
            <div className="mb-3 mt-4 text-sm font-medium text-zinc-500">Recent</div>
          )}
          {data.projectsRecent.map((p, i) => (
            <div key={i} className="mb-3 flex items-baseline gap-2 text-sm">
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline underline-offset-4"
              >
                {p.title}
              </a>
              <span className="text-zinc-500">— {p.description}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Contact */}
      {data.contact.length > 0 && (
        <Section title="Links">
          <div className="flex flex-wrap gap-4 text-sm">
            {data.contact.map((c) => (
              <a
                key={c.label}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 hover:text-zinc-900 hover:underline underline-offset-4"
              >
                {c.label}
              </a>
            ))}
          </div>
        </Section>
      )}

      <footer className="mt-12 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        ai-cv.ha7ch.com/{data.username} · updated {new Date(data.meta.updatedAt).toLocaleDateString()}
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

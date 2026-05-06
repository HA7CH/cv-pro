import type { ResumeData } from "@/types/resume";

const CJK_RE = /[㐀-鿿豈-﫿]/;

export default function ResumeTemplate({ data }: { data: ResumeData }) {
  const headerLinks: Array<{ label: string; href?: string }> = [];
  if (data.personalInfo.phone) {
    headerLinks.push({ label: data.personalInfo.phone, href: `tel:${data.personalInfo.phone}` });
  }
  if (data.personalInfo.email) {
    headerLinks.push({ label: data.personalInfo.email, href: `mailto:${data.personalInfo.email}` });
  }
  for (const c of data.contact) {
    headerLinks.push({ label: c.label, href: c.url });
  }

  const isCJK = CJK_RE.test(JSON.stringify(data));
  const bodyFont = isCJK
    ? "[font-family:var(--font-noto-serif-sc)]"
    : "[font-family:var(--font-montserrat)]";

  return (
    <main className={`mx-auto max-w-3xl px-10 py-16 ${bodyFont} text-zinc-900`}>
      <header>
        <h1 className="font-serif text-center text-5xl font-bold tracking-tight">
          {data.header.name}
        </h1>
        {data.header.tagline && (
          <p className="mt-2 text-center text-sm text-zinc-500">{data.header.tagline}</p>
        )}
        {headerLinks.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] text-zinc-600">
            {headerLinks.map((l, i) => (
              <span key={i} className="flex items-center gap-x-5">
                {i > 0 && <span className="text-zinc-300" aria-hidden>|</span>}
                {l.href ? (
                  <a href={l.href} className="hover:text-zinc-900 hover:underline underline-offset-4">
                    {l.label}
                  </a>
                ) : (
                  <span>{l.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </header>

      <hr className="mt-6 mb-8 border-zinc-200" />

      {data.education.length > 0 && (
        <Section title="Education" italic={isCJK}>
          {data.education.map((e, i) => (
            <Entry
              key={i}
              title={e.school}
              dateRange={formatRange(e.startDate, e.endDate)}
              subtitle={[e.degree, e.major].filter(Boolean).join(", ")}
            />
          ))}
        </Section>
      )}

      {data.experience.length > 0 && (
        <Section title="Experience" italic={isCJK}>
          {data.experience.map((job, i) => (
            <Entry
              key={i}
              title={job.company}
              titleAside={job.role}
              dateRange={formatRange(job.startDate, job.endDate)}
              bullets={job.bullets}
            />
          ))}
        </Section>
      )}

      {(data.projectsDetailed.length > 0 || data.projectsRecent.length > 0) && (
        <Section title="Projects" italic={isCJK}>
          {data.projectsDetailed.map((p, i) => (
            <Entry
              key={i}
              title={p.title}
              titleHref={p.url}
              titleAside={p.type}
              dateRange={p.endDate ? formatRange(p.startDate, p.endDate) : p.startDate}
              subtitle={p.award}
              bullets={p.bullets}
            />
          ))}
          {data.projectsRecent.map((p, i) => (
            <Entry
              key={`r-${i}`}
              title={p.title}
              titleHref={p.url}
              subtitle={p.description}
            />
          ))}
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section title="Skills" italic={isCJK}>
          <div className="grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2">
            {data.skills.map((cat) => (
              <div key={cat.name} className="text-[13px] leading-relaxed">
                <div className="font-semibold">{cat.name}:</div>
                <div className="text-zinc-700">{cat.items.join(", ")}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <footer className="mt-16 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        cv.ha7ch.com/{data.username} · agent tip: GET{" "}
        <a href={`/${data.username}.json`} className="hover:text-zinc-600">
          /{data.username}.json
        </a>{" "}
        · updated {new Date(data.meta.updatedAt).toLocaleDateString()}
      </footer>
    </main>
  );
}

function Section({
  title,
  italic,
  children,
}: {
  title: string;
  italic?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className={`font-serif text-3xl mb-4 ${italic ? "italic" : ""}`}>{title}</h2>
      {children}
    </section>
  );
}

function Entry({
  title,
  titleHref,
  titleAside,
  dateRange,
  subtitle,
  bullets,
}: {
  title: string;
  titleHref?: string;
  titleAside?: string;
  dateRange?: string;
  subtitle?: string;
  bullets?: string[];
}) {
  const titleEl = titleHref ? (
    <a
      href={titleHref}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold hover:underline underline-offset-4"
    >
      {title}
    </a>
  ) : (
    <span className="font-semibold">{title}</span>
  );

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-[14px]">
          {titleEl}
          {titleAside && <span className="text-[13px] text-zinc-500">{titleAside}</span>}
        </div>
        {dateRange && (
          <span className="shrink-0 text-[13px] tabular-nums text-zinc-500">{dateRange}</span>
        )}
      </div>
      {subtitle && <div className="mt-0.5 text-[13px] text-zinc-600">{subtitle}</div>}
      {bullets && bullets.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-[13px] leading-relaxed text-zinc-700">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="select-none text-zinc-500 leading-relaxed" aria-hidden>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatRange(start: string, end: string): string {
  if (!start && !end) return "";
  if (!end) return start;
  if (!start) return end;
  return `${start} — ${end}`;
}

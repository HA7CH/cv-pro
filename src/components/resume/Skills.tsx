import type { SkillCategory } from "@/types/resume";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

export default function Skills({ skills }: { skills: SkillCategory[] }) {
  return (
    <section className="p-6">
      <h2 className="font-serif mb-4 text-2xl">Skills</h2>
      <ul className="space-y-6">
        {skills.map((cat) => (
          <li key={cat.name}>
            <div
              className="mb-2 w-fit"
              data-cursor={cat.voice ? "block" : undefined}
              data-voice={cat.voice}
            >
              {cat.name}
            </div>
            <div className="flex flex-wrap gap-1">
              {cat.items.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

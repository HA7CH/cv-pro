import type { ContactLink } from "@/types/resume";

export default function Contact({ contact }: { contact: ContactLink[] }) {
  return (
    <section className="p-6">
      <h2 className="font-serif mb-4 text-2xl">
        Personal Accounts and Websites
      </h2>
      <ul className="space-y-2">
        {contact.map((c) => (
          <li key={c.label}>
            <a
              href={c.url}
              className="w-fit text-zinc-900"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="a"
            >
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

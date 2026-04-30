import type { PersonalInfo as PI } from "@/types/resume";

export default function PersonalInfo({ info }: { info: PI }) {
  return (
    <section className="p-6">
      <h2 className="font-serif mb-4 text-2xl">Personal Information</h2>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
        {info.pronouns && (
          <li>
            <span data-cursor="block" data-voice={info.pronounsVoice}>
              Pronouns
            </span>
            {": "}
            {info.pronouns}
          </li>
        )}
        {info.mbti && (
          <li>
            <span>MBTI:</span>{" "}
            <span data-cursor="block" data-voice={info.mbtiVoice}>
              {info.mbti}
            </span>
          </li>
        )}
        {info.birthday && (
          <li>
            <span>Birthday:</span>{" "}
            <span data-cursor="block">{info.birthday}</span>
          </li>
        )}
        <li className="flex items-center gap-1">
          <span data-cursor="block" data-voice={info.emailVoice}>
            Email:
          </span>{" "}
          <a
            href={`mailto:${info.email}`}
            className="text-zinc-900 underline-offset-4 hover:underline"
            data-cursor="a"
          >
            {info.email}
          </a>
        </li>
      </ul>
    </section>
  );
}

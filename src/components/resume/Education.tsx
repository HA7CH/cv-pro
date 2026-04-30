import type { Education as Edu } from "@/types/resume";

export default function Education({ education }: { education: Edu[] }) {
  return (
    <section className="p-6">
      <h2
        className="font-serif mb-4 w-fit text-2xl"
        data-cursor="block"
        data-voice="Education never really stops, right?"
      >
        Education
      </h2>
      <div className="space-y-6">
        {education.map((e, i) => (
          <div key={`${e.school}-${i}`}>
            <div className="flex items-center justify-between gap-4">
              <h3
                className="w-fit text-xl text-zinc-900"
                data-cursor="block"
                data-voice={e.schoolVoice}
              >
                {e.school}
              </h3>
              <p
                className="w-fit shrink-0 text-right text-xs tabular-nums text-zinc-500 sm:text-sm"
                data-cursor="block"
                data-voice={e.dateVoice}
              >
                {e.startDate}—{e.endDate}
              </p>
            </div>
            <p
              className="w-fit text-zinc-500"
              data-cursor="block"
              data-voice={e.majorVoice}
            >
              {e.major}
            </p>
            <p
              className="w-fit text-zinc-500"
              data-cursor="block"
              data-voice={e.degreeVoice}
            >
              {e.degree}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

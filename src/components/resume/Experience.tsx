import type { WorkExperience } from "@/types/resume";

export default function Experience({
  experience,
}: {
  experience: WorkExperience[];
}) {
  return (
    <section className="p-6">
      <h2
        className="font-serif mb-4 w-fit text-2xl"
        data-cursor="block"
        data-voice="As someone who used to work at top2 IT companies in China, I have a lot to say."
      >
        Work Experience
      </h2>
      <div className="space-y-6">
        {experience.map((job, i) => (
          <div key={`${job.company}-${i}`}>
            <div className="flex items-center justify-between">
              <h3
                className="w-fit text-xl text-zinc-900"
                data-cursor="block"
                data-voice={job.companyVoice ?? job.stockVoice}
              >
                {job.company}
                {job.stockSymbol ? (
                  <span className="ml-2 text-xs font-normal text-zinc-500 tabular-nums">
                    {job.stockCurrency}
                    {job.stockSymbol}
                  </span>
                ) : null}
              </h3>
              <p
                className="w-fit text-right text-xs tabular-nums text-zinc-500 sm:text-sm"
                data-cursor="block"
                data-voice={job.dateVoice}
              >
                {job.startDate}—{job.endDate}
              </p>
            </div>
            <p
              className="w-fit text-zinc-500"
              data-cursor="block"
              data-voice={job.roleVoice}
            >
              {job.role}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ResumeTemplate from "@/components/resume/ResumeTemplate";
import { getResumeByUsername } from "@/lib/resume-store";
import type { ResumeData } from "@/types/resume";

type RouteParams = { username: string };

const BASE_URL = "https://ai-cv.ha7ch.com";

function buildDescription(resume: ResumeData): string {
  const parts: string[] = [];
  const exp = resume.experience[0];
  if (exp) parts.push(`${exp.role} at ${exp.company}.`);
  const topSkills = resume.skills.flatMap((c) => c.items).slice(0, 5);
  if (topSkills.length) parts.push(`Skills: ${topSkills.join(", ")}.`);
  if (resume.personalInfo.location) parts.push(`Based in ${resume.personalInfo.location}.`);
  return parts.join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { username } = await params;
  const resume = await getResumeByUsername(username);
  if (!resume) {
    return { title: `${username} — ai-cv` };
  }

  const exp = resume.experience[0];
  const title = exp
    ? `${resume.header.name} — ${exp.role} at ${exp.company} | ai-cv`
    : `${resume.header.name} | ai-cv`;
  const description = buildDescription(resume);
  const url = `${BASE_URL}/${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function buildPersonSchema(resume: ResumeData) {
  const exp = resume.experience[0];
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: resume.header.name,
    url: `${BASE_URL}/${resume.username}`,
    email: resume.personalInfo.email,
    ...(exp && {
      jobTitle: exp.role,
      worksFor: { "@type": "Organization", name: exp.company },
    }),
    alumniOf: resume.education.map((e) => ({
      "@type": "CollegeOrUniversity",
      name: e.school,
    })),
    knowsAbout: resume.skills.flatMap((c) => c.items),
    sameAs: resume.contact.map((c) => c.url),
  };
}

export default async function UserResumePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { username } = await params;
  const resume = await getResumeByUsername(username);
  if (!resume) notFound();
  const schema = buildPersonSchema(resume);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <ResumeTemplate data={resume} />
    </>
  );
}

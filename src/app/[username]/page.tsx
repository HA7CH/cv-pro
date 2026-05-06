import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import ResumeTemplate from "@/components/resume/ResumeTemplate";
import ResumeView from "@/components/resume/ResumeView";
import { getResumeByUsername, getVariantByAudience } from "@/lib/resume-store";
import { applyResumeFilters } from "@/lib/resume-filter";
import type { ResumeData } from "@/types/resume";

type RouteParams = { username: string };
type SearchParams = { [key: string]: string | string[] | undefined };

const BASE_URL = "https://cv.ha7ch.com";


function searchParamsToURLSearchParams(sp: SearchParams): URLSearchParams {
  const url = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") url.set(k, v);
    else if (Array.isArray(v) && v.length) url.set(k, v[0]);
  }
  return url;
}

function buildDescription(resume: ResumeData, username: string): string {
  const parts: string[] = [`${username}'s resume on cv-pro — ${resume.header.name}.`];
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
    return { title: `${username} — cv-pro` };
  }

  const exp = resume.experience[0];
  const title = exp
    ? `${resume.header.name} (${username}) — ${exp.role} at ${exp.company} | cv-pro`
    : `${resume.header.name} (${username}) | cv-pro`;
  const description = buildDescription(resume, username);
  const url = `${BASE_URL}/${username}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: {
        "application/json": `/${username}.json`,
      },
    },
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

function renderResume(resume: ResumeData) {
  const schema = buildPersonSchema(resume);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <Suspense fallback={<ResumeTemplate data={resume} />}>
        <ResumeView data={resume} />
      </Suspense>
    </>
  );
}

const VARIANT_PARAM_ORDER = ["company", "role", "focus", "lang"] as const;

export default function UserResumePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={null}>
      <ResumePageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ResumePageContent({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const resume = await getResumeByUsername(username);
  if (!resume) notFound();

  const url = searchParamsToURLSearchParams(sp);

  // Collect present param values in priority order
  const paramValues = VARIANT_PARAM_ORDER.map((k) => url.get(k)).filter(Boolean) as string[];

  // Try compound key first (e.g. "designer-en" for ?role=designer&lang=en)
  if (paramValues.length > 1) {
    const compoundKey = paramValues.join("-");
    const variant = await getVariantByAudience(username, compoundKey);
    if (variant) return renderResume(variant);
  }

  // Fall back to individual keys in priority order
  for (const val of paramValues) {
    const variant = await getVariantByAudience(username, val);
    if (variant) return renderResume(variant);
  }

  const result = applyResumeFilters(resume, url);
  return renderResume(result.resume);
}

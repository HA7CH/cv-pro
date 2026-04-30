import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ResumeTemplate from "@/components/resume/ResumeTemplate";
import { getResumeByUsername } from "@/lib/resume-store";

type RouteParams = { username: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { username } = await params;
  const resume = await getResumeByUsername(username);
  if (!resume) {
    return { title: `${username} — cv` };
  }
  return {
    title: `${resume.header.name} — cv`,
    description: `${resume.header.name}'s living resume on cv.ha7ch.com`,
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
  return <ResumeTemplate data={resume} />;
}

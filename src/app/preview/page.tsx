import { Suspense } from "react";
import ResumeTemplate from "@/components/resume/ResumeTemplate";
import ResumeView from "@/components/resume/ResumeView";
import type { ResumeData } from "@/types/resume";

const sample: ResumeData = {
  username: "janedoe",
  header: { name: "Jane Doe" },
  personalInfo: {
    email: "jane@example.com",
    phone: "+1 555-010-2046",
  },
  contact: [
    { label: "www.janedoe.dev", url: "https://www.janedoe.dev" },
    { label: "github.com/janedoe", url: "https://github.com/janedoe" },
  ],
  education: [
    {
      school: "Stanford University",
      degree: "M.S. in Human-Computer Interaction",
      major: "",
      startDate: "Sep 2024",
      endDate: "Expected Jun 2026",
    },
    {
      school: "University of Michigan",
      degree: "B.S. in Computer Science, minor in Cognitive Science",
      major: "",
      startDate: "Sep 2019",
      endDate: "May 2023",
    },
  ],
  experience: [
    {
      company: "Acme Research Lab",
      role: "Research Assistant",
      startDate: "Jan 2025",
      endDate: "Present",
      bullets: [
        "Studying how multimodal AI agents collaborate with users on long-form writing tasks.",
        "Designed and ran two controlled experiments with 60+ participants to evaluate agent proactivity.",
        "Co-authoring a paper targeted at ACM CHI 2026.",
      ],
    },
    {
      company: "Northwind Labs",
      role: "Product Design Intern",
      startDate: "Jun 2024",
      endDate: "Sep 2024",
      bullets: [
        "Owned the IA and visual design for a new agent-orchestration product surface.",
        "Built a Figma component system used by 12 designers across 3 product teams.",
        "Shipped onboarding flow that lifted day-7 retention by 14%.",
      ],
    },
    {
      company: "Globex",
      role: "Front End Engineer",
      startDate: "Aug 2023",
      endDate: "May 2024",
      bullets: [
        "Built the dashboard front end for an internal data labeling platform used by 200+ annotators.",
        "Migrated the legacy SCSS layer to a Tailwind-based design system; cut bundle size by 38%.",
        "Mentored two junior engineers through onboarding and first production releases.",
      ],
    },
  ],
  projectsDetailed: [
    {
      title: "Wizard-of-Oz Platform for Proactive AI Writing",
      type: "Research Project",
      startDate: "Jan 2025",
      bullets: [
        "Built an end-to-end study platform: writing UI, experimenter console, and instrumentation pipeline.",
        "Currently powering an n=40 lab study on agent timing and trust calibration.",
      ],
    },
    {
      title: "janedoe.dev — Personal Portfolio",
      type: "Independent Project",
      startDate: "Mar 2024",
      url: "https://www.janedoe.dev",
      award: "Featured on Awwwards Sites of the Day, Jul 2024.",
      bullets: [
        "Designed and built a 3D interactive portfolio with WebGL and procedural motion.",
        "Wrote the accompanying long-form case studies in MDX with custom typographic components.",
      ],
    },
  ],
  projectsRecent: [],
  skills: [
    { name: "AI & Programming", items: ["Python", "TypeScript", "OpenAI API", "LangChain"] },
    { name: "Design & Prototyping", items: ["Figma", "Blender", "Rive", "WebGL"] },
    { name: "Full-Stack Development", items: ["React", "Next.js", "Three.js", "Node.js", "Supabase"] },
    { name: "Research & Methods", items: ["Human-Centered Design", "Prototyping", "Usability Testing"] },
  ],
  meta: { updatedAt: new Date().toISOString() },
};

export default function PreviewPage() {
  return (
    <Suspense fallback={<ResumeTemplate data={sample} />}>
      <ResumeView data={sample} />
    </Suspense>
  );
}

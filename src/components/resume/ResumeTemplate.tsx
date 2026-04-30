"use client";

import { motion } from "framer-motion";
import type { ResumeData } from "@/types/resume";
import Header from "./Header";
import PersonalInfo from "./PersonalInfo";
import Experience from "./Experience";
import Education from "./Education";
import Projects from "./Projects";
import Skills from "./Skills";
import Contact from "./Contact";
import Footer from "./Footer";
import Cursor from "./Cursor";
import Island from "./Island";

export default function ResumeTemplate({ data }: { data: ResumeData }) {
  const sections = [
    <Header key="header" name={data.header.name} />,
    <PersonalInfo key="personal" info={data.personalInfo} />,
    <Experience key="experience" experience={data.experience} />,
    <Education key="education" education={data.education} />,
    <Projects
      key="projects"
      recent={data.projectsRecent}
      detailed={data.projectsDetailed}
    />,
    <Skills key="skills" skills={data.skills} />,
    <Contact key="contact" contact={data.contact} />,
    <Footer key="footer" name={data.header.name} />,
  ];

  return (
    <div className="resume-page">
      <Cursor />
      <Island />
      <main className="container mx-auto max-w-[805px] px-0 py-8 md:px-4">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, filter: "blur(4px)", y: 50 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{
              duration: 1,
              delay: 0.1 + 0.15 * index,
              type: "spring",
              bounce: 0.2,
            }}
          >
            {section}
          </motion.div>
        ))}
      </main>
    </div>
  );
}

import type { ResumeData } from "@/types/resume";

export const SEED_RESUME: ResumeData = {
  username: "admin",
  header: { name: "Mingze Wu" },
  personalInfo: {
    pronouns: "He/Him",
    pronounsVoice: "It seems more modern to say that, right?",
    mbti: "ENTJ",
    mbtiVoice: "Extraverted, intuitive, thinking, and judging",
    birthday: "July 2000",
    email: "lawtedwu@gmail.com",
    emailVoice:
      "Hey, you can send me an email, or it'll just be full of spam.",
  },
  experience: [
    {
      company: "Stanford University",
      companyVoice: "Who can say no to that little 🌲 ?",
      role: "Research Assistant",
      roleVoice: "Working on cutting-edge research projects.",
      startDate: "Apr 2025",
      endDate: "Present",
      dateVoice: "Chill, I quit my job at Alibaba to do research at Stanford.",
    },
    {
      company: "Alibaba",
      stockSymbol: "BABA",
      stockCurrency: "$",
      stockVoice:
        "Yep, I'm an engineer at Alibaba when the stock price was 80.",
      role: "Lingyang - Frontend Intern & Engineer",
      roleVoice: "Something about data management platform. and also AI.",
      startDate: "Dec 2022",
      endDate: "Jun 2025",
      dateVoice: "Intern for 6 months, then be a full-time engineer.",
    },
    {
      company: "MiniMax",
      stockSymbol: "0100.HK",
      stockCurrency: "HK$",
      stockVoice:
        "Really impressive startup. If I accepted the return offer, I would be a millionaire now.",
      role: "Business System Group - Frontend Intern",
      roleVoice:
        "Miss the time when I was code 12 hours a day. And Publish a mini program on WeChat.",
      startDate: "Oct 2022",
      endDate: "Dec 2022",
      dateVoice: "In the world of startups, one year feels like three.",
    },
    {
      company: "Tencent",
      stockSymbol: "0700.HK",
      stockCurrency: "HK$",
      stockVoice:
        "Working fully remotely during the pandemic is the best experience.",
      role: "PCG-Search Strategy Group - Frontend Intern",
      roleVoice: "Only frontend engineer in the research team.",
      startDate: "Apr 2021",
      endDate: "Oct 2022",
      dateVoice: "Maybe the youngest intern in the history of Tencent.",
    },
  ],
  education: [
    {
      school: "Queen Mary University of London",
      schoolVoice: "Graduated from Here, but I don't go to UK cuz the pandemic.",
      major: "Telecommunications Engineering and Management",
      majorVoice:
        "Half major in Telecommunications, half in Management. I like the latter more.",
      degree: "Bachelor of Science (Engineering)",
      degreeVoice: "Second Class (Upper Division)",
      startDate: "Sep 2019",
      endDate: "Jul 2023",
      dateVoice: "Yep, exactly all under the pandemic.",
    },
    {
      school: "Beijing University of Posts and Telecommunications",
      schoolVoice:
        "Best university in China for Finding a job in tech companies, appreciate it.",
      major: "Telecommunications Engineering and Management",
      majorVoice: "Not related to frontend, but I'm a good learner.",
      degree: "Bachelor of Engineering",
      degreeVoice: "Feel regret for not learning physics so well.",
      startDate: "Sep 2019",
      endDate: "Jul 2023",
      dateVoice: "Start my professional journey when I was sophomore.",
    },
  ],
  projectsRecent: [
    {
      title: "Lia Browser",
      description:
        "Liquid Glass + Chromium + Vertical Tabs + On-device Apple Intelligence",
      url: "https://liabrowser.com",
      voice: "What safari should be like.",
    },
    {
      title: "Fellou.ai",
      description:
        "Official website design and development for Fellou.ai, the world first Agentic browser",
      url: "https://fellou.ai",
      voice: "Proud to have designed their official website!",
    },
    {
      title: "Design Systems & UI Framework Integration",
      description:
        "How I successfully introduced Tailwind to Alibaba's team and transformed their workflow",
      url: "https://lawted.tech/projects/design-system",
      voice: "Say no more, Tailwind is the best!",
    },
    {
      title: "Laney - Child Mental Health Watch App",
      description:
        "AI-powered child mental health monitoring app with personalized interventions",
      url: "https://lawted.tech/projects/laney",
      voice: "All Asia's children deserve a better mental health support.",
    },
    {
      title: "Tools & Plugin Development",
      description:
        "Development tools and plugins for enhanced productivity in Alibaba",
      url: "https://lawted.tech/projects/tools-plugin",
      voice:
        "I love building tools that make developers' lives easier and more productive.",
    },
    {
      title: "Holographic-Sticker",
      description:
        "React component library for creating stunning holographic sticker effects",
      url: "https://holographic-sticker.vercel.app/",
      voice: "Who doesn't love holographic effects?",
    },
    {
      title: "Anti-PUA Game",
      description:
        "Dark humor interactive game about surviving academic psychological manipulation",
      url: "https://pua-game.lawted.tech/",
      voice: "The dark humor part is that they're all based on real life.",
    },
    {
      title: "YellowBox - AI Journal",
      description: "A magazine styled website for AI journal",
      url: "https://hai.lawted.tech/yellowbox",
      voice: "However i just use ChatGPT for journal writing",
    },
    {
      title: "About Me",
      description: "Personal portfolio and resume showcase",
      url: "https://lawted.tech/resume",
      voice: "This very page you're looking at",
    },
  ],
  projectsDetailed: [
    {
      title:
        "Proactive AI for Collaborative Story Writing (CHI 2026 Papers)",
      titleVoice:
        "A CHI 2026 research project on proactive AI for collaborative story writing.",
      type: "Research Project",
      startDate: "Jan 2026",
      bullets: [
        "Owned the end-to-end build of a Wizard-of-Oz experimental platform for proactive AI writing assistance, including study workflow, interface logic, and data instrumentation.",
        "Partnered on research ideation and manuscript iteration.",
      ],
    },
    {
      title: "Immersive Personal Website (lawted.tech)",
      titleVoice:
        "A 3D interactive site that earned an Awwwards honorable mention.",
      type: "Independent Project",
      startDate: "Sep 2025",
      url: "https://lawted.tech",
      award:
        "Awarded Honorable Mention by Awwwards, a leading global platform recognizing creative excellence.",
      bullets: [
        "Designed and developed a 3D interactive portfolio site with motion, storytelling, and WebGL.",
        "Merged design and engineering to build international visibility for personal brand.",
      ],
    },
    {
      title: "Applying AR Technology for Art Exhibition on Mobile Devices",
      titleVoice: "Really like this project, good ending to my college life.",
      type: "Graduation Thesis",
      startDate: "Feb 2023",
      endDate: "Jun 2023",
      award:
        "Outstanding Project Prize, ranking in the top 3% at the university level.",
      externalLink: {
        label: "Presentation",
        url: "https://final-project-ar-presentation.vercel.app",
      },
      bullets: [
        "Developed an AR-based system to enhance the interactive art exhibition on mobile.",
        "Created web-based AR experiences adaptable to both mobile and PC platforms.",
        "Implemented dynamic AR visualizations, enabling a cloud and an animal to react in real-time to changes in environmental light and sound.",
      ],
    },
    {
      title: "BUPT Class Schedule to Apple Calendar Converter",
      titleVoice:
        "The most useful project and probably the one I'm most proud of.",
      type: "Independent Project",
      startDate: "Oct 2022",
      endDate: "Dec 2022",
      bullets: [
        "Designed a tool enabling BUPT students to seamlessly integrate their schedules into Apple Calendar.",
        "Independently managed the end-to-end product lifecycle, including research, design, development, deployment, and user feedback collection.",
        "Gained 1,500+ active users in first month with praise on school forums.",
      ],
    },
    {
      title:
        "Urban Cluster Intelligent Perception Computing System for Mobility",
      type: "Competition Project",
      startDate: "Sep 2022",
      endDate: "Dec 2022",
      award:
        "Third Place City-Level Award, conducted under the guidance of a graduate advisor.",
      bullets: [
        "Contributed to a project that developed a big data cluster for enhancing smart mobility solutions in urban environments.",
        "Developed the frontend interface using Vue3 and ECharts, focusing on dynamic, real-time visualizations to display complex data interactions and mobility analytics.",
        "Managed the CI/CD pipeline using GitHub Actions to optimize development workflows and ensure seamless updates and integration of new features.",
      ],
    },
  ],
  skills: [
    {
      name: "Programming Languages",
      voice: "One is all about Zen, and the other loves curly braces!",
      items: ["Python", "TypeScript", "JavaScript"],
    },
    {
      name: "Design Tools",
      voice: "Figma is my favorite",
      items: ["Figma", "Blender", "After Effects", "Premiere"],
    },
    {
      name: "Frameworks & Libraries",
      voice: "Like new staff and good animation effects.",
      items: [
        "Vue",
        "React",
        "Express",
        "Django",
        "Next.js",
        "Ar.js",
        "Three.js",
        "GSAP",
        "Framer Motion",
      ],
    },
    {
      name: "Web Development",
      voice: "I'm a full stack developer, but I'm more proficient in frontend.",
      items: ["HTML", "CSS", "JavaScript", "Web3"],
    },
    {
      name: "Databases",
      items: ["MySQL", "MongoDB"],
    },
    {
      name: "Soft Skills",
      voice: "More than just a developer, I'm a thinker.",
      items: [
        "Strong learning abilities",
        "Team communication",
        "Collaboration",
      ],
    },
  ],
  contact: [
    { label: "GitHub", url: "https://github.com/LAWTED" },
    { label: "Twitter", url: "https://twitter.com/lawted2" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/lawted/" },
    { label: "Homepage", url: "https://www.lawted.tech" },
  ],
  meta: {
    updatedAt: new Date("2026-05-01").toISOString(),
    version: 1,
  },
};

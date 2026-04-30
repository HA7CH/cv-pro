export interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
}

export interface Education {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface ProjectShort {
  title: string;
  description: string;
  url: string;
}

export interface ProjectDetailed {
  title: string;
  type: string;
  startDate: string;
  endDate?: string;
  url?: string;
  award?: string;
  bullets: string[];
  externalLink?: { label: string; url: string };
}

export interface SkillCategory {
  name: string;
  items: string[];
}

export interface ContactLink {
  label: string;
  url: string;
}

export interface PersonalInfo {
  email: string;
  phone?: string;
  location?: string;
  pronouns?: string;
  mbti?: string;
  birthday?: string;
}

export interface ResumeData {
  username: string;
  header: { name: string; tagline?: string };
  personalInfo: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  projectsRecent: ProjectShort[];
  projectsDetailed: ProjectDetailed[];
  skills: SkillCategory[];
  contact: ContactLink[];
  meta: {
    updatedAt: string;
  };
}

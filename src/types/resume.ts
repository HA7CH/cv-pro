export interface WorkExperience {
  company: string;
  companyVoice?: string;
  role: string;
  roleVoice?: string;
  startDate: string;
  endDate: string;
  dateVoice?: string;
  stockSymbol?: string;
  stockCurrency?: string;
  stockVoice?: string;
}

export interface Education {
  school: string;
  schoolVoice?: string;
  major: string;
  majorVoice?: string;
  degree: string;
  degreeVoice?: string;
  startDate: string;
  endDate: string;
  dateVoice?: string;
}

export interface ProjectShort {
  title: string;
  description: string;
  url: string;
  voice?: string;
  image?: string;
}

export interface ProjectDetailed {
  title: string;
  titleVoice?: string;
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
  voice?: string;
  items: string[];
}

export interface ContactLink {
  label: string;
  url: string;
}

export interface PersonalInfo {
  pronouns?: string;
  pronounsVoice?: string;
  mbti?: string;
  mbtiVoice?: string;
  birthday?: string;
  birthdayImage?: string;
  email: string;
  emailVoice?: string;
}

export interface ResumeData {
  username: string;
  header: { name: string };
  personalInfo: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  projectsRecent: ProjectShort[];
  projectsDetailed: ProjectDetailed[];
  skills: SkillCategory[];
  contact: ContactLink[];
  meta: {
    updatedAt: string;
    version: number;
  };
}

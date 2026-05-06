import { z } from "zod";

const trimmed = z.string().trim();

export const workExperienceSchema = z
  .object({
    company: trimmed,
    role: trimmed,
    startDate: trimmed,
    endDate: trimmed,
    bullets: z.array(trimmed).default([]),
    tags: z.array(trimmed).optional(),
  })
  .strict();

export const educationSchema = z
  .object({
    school: trimmed,
    major: trimmed,
    degree: trimmed,
    startDate: trimmed,
    endDate: trimmed,
  })
  .strict();

export const projectShortSchema = z
  .object({
    title: trimmed,
    description: trimmed,
    url: trimmed,
    tags: z.array(trimmed).optional(),
  })
  .strict();

export const projectDetailedSchema = z
  .object({
    title: trimmed,
    type: trimmed,
    startDate: trimmed,
    endDate: trimmed.optional(),
    url: trimmed.optional(),
    award: trimmed.optional(),
    bullets: z.array(trimmed).default([]),
    tags: z.array(trimmed).optional(),
    externalLink: z
      .object({ label: trimmed, url: trimmed })
      .strict()
      .optional(),
  })
  .strict();

export const skillCategorySchema = z
  .object({
    name: trimmed,
    items: z.array(trimmed).default([]),
  })
  .strict();

export const contactLinkSchema = z
  .object({
    label: trimmed,
    url: trimmed,
  })
  .strict();

export const personalInfoSchema = z
  .object({
    email: trimmed,
    phone: trimmed.optional(),
    location: trimmed.optional(),
    pronouns: trimmed.optional(),
    mbti: trimmed.optional(),
    birthday: trimmed.optional(),
  })
  .strict();

export const headerSchema = z
  .object({
    name: trimmed,
    tagline: trimmed.optional(),
  })
  .strict();

export const metaSchema = z
  .object({
    updatedAt: trimmed,
  })
  .strict();

export const resumeSchema = z
  .object({
    username: trimmed,
    header: headerSchema,
    personalInfo: personalInfoSchema,
    experience: z.array(workExperienceSchema).default([]),
    education: z.array(educationSchema).default([]),
    projectsRecent: z.array(projectShortSchema).default([]),
    projectsDetailed: z.array(projectDetailedSchema).default([]),
    skills: z.array(skillCategorySchema).default([]),
    contact: z.array(contactLinkSchema).default([]),
    meta: metaSchema,
  })
  .strict();

// Per-section schemas — used by update_section / PATCH to validate one field at a time.
export const SECTION_SCHEMAS = {
  header: headerSchema,
  personalInfo: personalInfoSchema,
  experience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  projectsRecent: z.array(projectShortSchema),
  projectsDetailed: z.array(projectDetailedSchema),
  skills: z.array(skillCategorySchema),
  contact: z.array(contactLinkSchema),
} as const;

export type SectionName = keyof typeof SECTION_SCHEMAS;
export const SECTION_NAMES = Object.keys(SECTION_SCHEMAS) as SectionName[];

export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type ProjectShort = z.infer<typeof projectShortSchema>;
export type ProjectDetailed = z.infer<typeof projectDetailedSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type ContactLink = z.infer<typeof contactLinkSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type ResumeData = z.infer<typeof resumeSchema>;

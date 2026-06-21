import { applyResumeFilters } from "@/lib/resume-filter";
import { getResumeByUsername, getVariantsForAudiences } from "@/lib/resume-store";
import type { ResumeData } from "@/types/resume";

// Precedence is company > role > focus > lang because links are typically shared with
// company targeting first, then role/focus/language as narrower fallback hints.
const VARIANT_PARAM_ORDER = ["company", "role", "focus", "lang"] as const;

/**
 * Variant resolution order:
 * 1) compound key built from all present params in VARIANT_PARAM_ORDER
 * 2) each individual param in VARIANT_PARAM_ORDER
 */
async function resolveVariant(username: string, variantValues: string[]): Promise<ResumeData | null> {
  if (variantValues.length === 0) return null;
  // Matches stored audience keys such as "company-role-focus" when multiple params are present.
  const compoundKey = variantValues.length > 1 ? variantValues.join("-") : null;
  const candidates = compoundKey ? [compoundKey, ...variantValues] : variantValues;
  const variants = await getVariantsForAudiences(username, candidates);
  if (compoundKey) {
    const compound = variants.get(compoundKey);
    if (compound) return compound;
  }
  for (const value of variantValues) {
    const variant = variants.get(value);
    if (variant) return variant;
  }
  return null;
}

/**
 * Resolve the public-facing resume for a handle, honouring variant params
 * (?company=, ?role=, ?focus=, ?lang=) and runtime tag filtering. Returns
 * null when the handle has no resume. Shared by the `.json` and `.txt` routes
 * so both surface identical content.
 */
export async function resolvePublicResume(
  username: string,
  query: URLSearchParams,
): Promise<ResumeData | null> {
  const resume = await getResumeByUsername(username);
  if (!resume) return null;

  const variantValues = VARIANT_PARAM_ORDER.map((param) => query.get(param)).filter(
    (value): value is string => value !== null && value.length > 0,
  );
  const variant = await resolveVariant(username, variantValues);
  // Variants are pre-tailored payloads; only the base resume uses runtime tag filtering.
  return variant ?? applyResumeFilters(resume, query).resume;
}

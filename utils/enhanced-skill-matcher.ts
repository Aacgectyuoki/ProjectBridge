import type { ExtractedSkills } from "@/app/actions/extract-skills"
import {
  findSkill,
  findRelatedSkills,
  findSemanticMatches,
  normalizeSkillName,
} from "@/services/skill-taxonomy-service"

export type EnhancedSkillMatchResult = {
  matchPercentage: number
  matchedSkills: string[]
  missingSkills: string[]
  partialMatches: {
    resumeSkill: string
    jobSkill: string
    similarity: number
    relationshipType?: string
  }[]
  skillsByCategory: {
    category: string
    matched: string[]
    missing: string[]
  }[]
}

/**
 * Enhanced skill matching using the database-backed taxonomy
 */
export async function enhancedMatchSkills(
  resumeSkills: ExtractedSkills,
  jobSkills: ExtractedSkills,
): Promise<EnhancedSkillMatchResult> {
  // Flatten all skills
  const allResumeSkills = flattenSkills(resumeSkills)
  const allJobSkills = flattenSkills(jobSkills)

  // Find exact matches
  const exactMatches = await findExactMatches(allResumeSkills, allJobSkills)

  // Find semantic matches (equivalent terms)
  const semanticMatches = await findAllSemanticMatches(allResumeSkills, allJobSkills)

  // Find related skills (skills that imply knowledge of other skills)
  const relatedMatches = await findAllRelatedMatches(allResumeSkills, allJobSkills)

  // Combine all matches and remove duplicates
  const allMatches = [...new Set([...exactMatches, ...semanticMatches, ...relatedMatches])]

  // Find missing skills
  const missingSkills = allJobSkills.filter(
    (jobSkill) => !allMatches.some((match) => normalizeSkillName(match) === normalizeSkillName(jobSkill)),
  )

  // Calculate match percentage
  const matchPercentage = allJobSkills.length > 0 ? Math.round((allMatches.length / allJobSkills.length) * 100) : 0

  // Group by category
  const categories = [
    "technical",
    "tools",
    "frameworks",
    "languages",
    "databases",
    "methodologies",
    "platforms",
    "other",
  ]

  const skillsByCategory = await Promise.all(
    categories.map(async (category) => {
      const categoryJobSkills = jobSkills[category] || []
      const matched = await findExactMatches(resumeSkills[category] || [], categoryJobSkills)
      const missing = categoryJobSkills.filter(
        (skill) => !matched.some((match) => normalizeSkillName(match) === normalizeSkillName(skill)),
      )

      return {
        category,
        matched,
        missing,
      }
    }),
  )

  return {
    matchPercentage,
    matchedSkills: allMatches,
    missingSkills,
    partialMatches: [], // We'll implement this later
    skillsByCategory: skillsByCategory.filter((category) => category.matched.length > 0 || category.missing.length > 0),
  }
}

// Helper functions
async function findExactMatches(resumeSkills: string[], jobSkills: string[]): Promise<string[]> {
  const matches: string[] = []

  for (const resumeSkill of resumeSkills) {
    const normalizedResumeSkill = await normalizeSkillName(resumeSkill)

    for (const jobSkill of jobSkills) {
      const normalizedJobSkill = await normalizeSkillName(jobSkill)

      if (normalizedResumeSkill === normalizedJobSkill) {
        matches.push(jobSkill)
        break
      }
    }
  }

  return matches
}

async function findAllSemanticMatches(resumeSkills: string[], jobSkills: string[]): Promise<string[]> {
  let allMatches: string[] = []

  for (const resumeSkill of resumeSkills) {
    const matches = await findSemanticMatches(resumeSkill, jobSkills)
    allMatches = [...allMatches, ...matches]
  }

  return allMatches
}

async function findAllRelatedMatches(resumeSkills: string[], jobSkills: string[]): Promise<string[]> {
  const allMatches: string[] = []

  for (const resumeSkill of resumeSkills) {
    const skill = await findSkill(resumeSkill)
    if (!skill) continue

    const relatedSkills = await findRelatedSkills(skill.id)
    const relatedSkillNames = relatedSkills.map((s) => s.name)

    for (const jobSkill of jobSkills) {
      if (relatedSkillNames.some((name) => normalizeSkillName(name) === normalizeSkillName(jobSkill))) {
        allMatches.push(jobSkill)
      }
    }
  }

  return allMatches
}

function flattenSkills(skills: ExtractedSkills): string[] {
  return [
    ...skills.technical,
    ...skills.tools,
    ...skills.frameworks,
    ...skills.languages,
    ...skills.databases,
    ...skills.methodologies,
    ...skills.platforms,
    ...skills.other,
  ]
}

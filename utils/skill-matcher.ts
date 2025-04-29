import type { ExtractedSkills } from "@/app/actions/extract-skills"
import { findMatchingSkills, normalizeSkillName } from "./skill-abbreviation-resolver"

export type SkillMatchResult = {
  matchPercentage: number
  matchedSkills: string[]
  missingSkills: string[]
  partialMatches: {
    resumeSkill: string
    jobSkill: string
    similarity: number
  }[]
  skillsByCategory: {
    category: string
    matched: string[]
    missing: string[]
  }[]
}

/**
 * Flattens an ExtractedSkills object into a single array of skills
 */
export function flattenSkills(skills: ExtractedSkills): string[] {
  return [
    ...skills.technical,
    ...skills.tools,
    ...skills.frameworks,
    ...skills.languages,
    ...skills.databases,
    ...skills.methodologies,
    ...skills.platforms,
    ...skills.other,
  ].map((skill) => normalizeSkillName(skill))
}

/**
 * Calculates string similarity using Levenshtein distance
 * Returns a value between 0 (no similarity) and 1 (identical)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1 : 0
  if (b.length === 0) return 0

  const matrix = []

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  // Calculate similarity as 1 - normalized distance
  const maxLength = Math.max(a.length, b.length)
  return 1 - matrix[b.length][a.length] / maxLength
}

/**
 * Finds partial matches between skills with a similarity threshold
 */
function findPartialMatches(
  resumeSkills: string[],
  jobSkills: string[],
  threshold = 0.8,
): {
  resumeSkill: string
  jobSkill: string
  similarity: number
}[] {
  const partialMatches = []

  for (const resumeSkill of resumeSkills) {
    for (const jobSkill of jobSkills) {
      const similarity = calculateSimilarity(resumeSkill.toLowerCase(), jobSkill.toLowerCase())

      if (similarity >= threshold && similarity < 1) {
        partialMatches.push({
          resumeSkill,
          jobSkill,
          similarity,
        })
      }
    }
  }

  // Sort by similarity (highest first)
  return partialMatches.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Compares resume skills with job description skills
 */
export function matchSkills(resumeSkills: ExtractedSkills, jobSkills: ExtractedSkills): SkillMatchResult {
  // Flatten all skills
  const allResumeSkills = flattenSkills(resumeSkills)
  const allJobSkills = flattenSkills(jobSkills)

  // Find exact matches (accounting for abbreviations)
  const matchedSkills = findMatchingSkills(allResumeSkills, allJobSkills)

  // Find skills in job description that aren't matched in resume
  const missingSkills = allJobSkills.filter(
    (jobSkill) => !matchedSkills.some((match) => match.toLowerCase() === normalizeSkillName(jobSkill).toLowerCase()),
  )

  // Find partial matches for remaining skills
  const remainingResumeSkills = allResumeSkills.filter((skill) => !matchedSkills.includes(normalizeSkillName(skill)))

  const partialMatches = findPartialMatches(remainingResumeSkills, missingSkills)

  // Calculate match percentage
  const matchPercentage = allJobSkills.length > 0 ? Math.round((matchedSkills.length / allJobSkills.length) * 100) : 0

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

  const skillsByCategory = categories
    .map((category) => {
      const categoryJobSkills = jobSkills[category] || []
      const matched = findMatchingSkills(resumeSkills[category] || [], categoryJobSkills)
      const missing = categoryJobSkills.filter(
        (skill) => !matched.some((match) => match.toLowerCase() === normalizeSkillName(skill).toLowerCase()),
      )

      return {
        category,
        matched,
        missing,
      }
    })
    .filter((category) => category.matched.length > 0 || category.missing.length > 0)

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    partialMatches,
    skillsByCategory,
  }
}

import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"

export type SkillProficiency = {
  skill: string
  level: "Beginner" | "Intermediate" | "Proficient" | "Expert"
  confidence: number // 0-1
  evidence: {
    type: "project" | "experience" | "education" | "certification"
    description: string
    duration?: string
    recency?: "recent" | "moderate" | "old"
  }[]
}

/**
 * Estimates proficiency levels for skills based on resume analysis
 */
export function estimateSkillProficiency(resumeAnalysis: ResumeAnalysisResult, skills: string[]): SkillProficiency[] {
  const result: SkillProficiency[] = []

  for (const skill of skills) {
    const normalizedSkill = skill.toLowerCase()

    // Find evidence of this skill in projects
    const projectEvidence = (resumeAnalysis.projects || [])
      .filter(
        (project) =>
          project.description.toLowerCase().includes(normalizedSkill) ||
          (project.technologies || []).some(
            (tech) => tech.toLowerCase().includes(normalizedSkill) || normalizedSkill.includes(tech.toLowerCase()),
          ),
      )
      .map((project) => ({
        type: "project" as const,
        description: project.name,
        recency: determineRecency(project.date),
      }))

    // Find evidence in work experience
    const experienceEvidence = (resumeAnalysis.experience || [])
      .filter(
        (exp) =>
          exp.description.toLowerCase().includes(normalizedSkill) || exp.title.toLowerCase().includes(normalizedSkill),
      )
      .map((exp) => ({
        type: "experience" as const,
        description: exp.title,
        duration: calculateDuration(exp.startDate, exp.endDate),
        recency: determineRecency(exp.endDate),
      }))

    // Combine all evidence
    const allEvidence = [...projectEvidence, ...experienceEvidence]

    // Calculate proficiency level based on evidence
    const level = determineProficiencyLevel(allEvidence, normalizedSkill)

    // Calculate confidence in this assessment
    const confidence = calculateConfidence(allEvidence, level)

    result.push({
      skill,
      level,
      confidence,
      evidence: allEvidence,
    })
  }

  return result
}

/**
 * Determines how recent an experience is
 */
function determineRecency(dateString?: string): "recent" | "moderate" | "old" {
  if (!dateString) return "old"

  try {
    const date = new Date(dateString)
    const now = new Date()
    const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()

    if (monthsDiff <= 12) return "recent"
    if (monthsDiff <= 36) return "moderate"
    return "old"
  } catch (e) {
    return "old"
  }
}

/**
 * Calculates duration between two dates
 */
function calculateDuration(startDate?: string, endDate?: string): string {
  if (!startDate) return "unknown"

  try {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()

    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()

    if (monthsDiff < 12) {
      return `${monthsDiff} month${monthsDiff !== 1 ? "s" : ""}`
    } else {
      const years = Math.floor(monthsDiff / 12)
      const months = monthsDiff % 12
      return `${years} year${years !== 1 ? "s" : ""}${months > 0 ? ` ${months} month${months !== 1 ? "s" : ""}` : ""}`
    }
  } catch (e) {
    return "unknown"
  }
}

/**
 * Determines proficiency level based on evidence
 */
function determineProficiencyLevel(
  evidence: Array<{
    type: "project" | "experience" | "education" | "certification"
    description: string
    duration?: string
    recency?: "recent" | "moderate" | "old"
  }>,
  skill: string,
): "Beginner" | "Intermediate" | "Proficient" | "Expert" {
  // Count projects and experiences
  const projectCount = evidence.filter((e) => e.type === "project").length
  const experienceCount = evidence.filter((e) => e.type === "experience").length

  // Check for recent evidence
  const hasRecentEvidence = evidence.some((e) => e.recency === "recent")

  // Check for long-term experience
  const hasLongTermExperience = evidence.some(
    (e) => e.type === "experience" && e.duration && (e.duration.includes("year") || Number.parseInt(e.duration) >= 12),
  )

  // Determine level based on evidence
  if (projectCount >= 3 && experienceCount >= 1 && hasRecentEvidence && hasLongTermExperience) {
    return "Expert"
  } else if ((projectCount >= 2 && experienceCount >= 1) || (hasLongTermExperience && hasRecentEvidence)) {
    return "Proficient"
  } else if (projectCount >= 1 || experienceCount >= 1) {
    return "Intermediate"
  } else {
    return "Beginner"
  }
}

/**
 * Calculates confidence in proficiency assessment
 */
function calculateConfidence(
  evidence: Array<{
    type: "project" | "experience" | "education" | "certification"
    description: string
    duration?: string
    recency?: "recent" | "moderate" | "old"
  }>,
  level: "Beginner" | "Intermediate" | "Proficient" | "Expert",
): number {
  // More evidence = higher confidence
  const evidenceCount = evidence.length

  // Recent evidence = higher confidence
  const recentEvidenceCount = evidence.filter((e) => e.recency === "recent").length

  // Base confidence on evidence quantity and recency
  let confidence = Math.min(0.5 + evidenceCount * 0.1 + recentEvidenceCount * 0.05, 1)

  // Adjust based on level (higher levels need more evidence for same confidence)
  if (level === "Expert") {
    confidence *= 0.8
  } else if (level === "Proficient") {
    confidence *= 0.9
  }

  return Number.parseFloat(confidence.toFixed(2))
}

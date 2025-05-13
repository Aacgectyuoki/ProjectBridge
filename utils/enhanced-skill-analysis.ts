import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"
import { findSemanticMatches } from "./semantic-skill-matcher"
import { estimateSkillProficiency, type SkillProficiency } from "./proficiency-estimator"
import { inferSkillsFromContext, type InferredSkill } from "./contextual-skill-inference"
import { recognizeInfrastructurePatterns, type InfrastructurePattern } from "./infrastructure-pattern-recognition"

export type EnhancedSkillAnalysisResult = {
  semanticMatches: {
    exactMatches: string[]
    semanticMatches: Array<{
      resumeSkill: string
      jobSkill: string
      similarity: number
      relationship: string
    }>
    missingSkills: string[]
  }
  proficiencyLevels: SkillProficiency[]
  inferredSkills: InferredSkill[]
  infrastructurePatterns: InfrastructurePattern[]
  enhancedMatchPercentage: number
  originalMatchPercentage: number
  improvementReason: string
}

/**
 * Performs enhanced skill analysis using semantic matching, proficiency estimation,
 * contextual inference, and infrastructure pattern recognition
 */
export async function performEnhancedSkillAnalysis(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
): Promise<EnhancedSkillAnalysisResult> {
  // Extract skills from resume and job
  const resumeSkills = [
    ...(resumeAnalysis.skills?.technical || []),
    ...(resumeAnalysis.skills?.soft || []), // Handle optional soft skills
    ...(resumeAnalysis.skills?.tools || []),
    ...(resumeAnalysis.skills?.frameworks || []),
    ...(resumeAnalysis.skills?.languages || []),
    ...(resumeAnalysis.skills?.databases || []),
    ...(resumeAnalysis.skills?.methodologies || []),
    ...(resumeAnalysis.skills?.platforms || []),
    ...(resumeAnalysis.skills?.other || []),
  ]

  const jobSkills = [...(jobAnalysis.requiredSkills || []), ...(jobAnalysis.preferredSkills || [])]

  // 1. Perform semantic matching
  const semanticMatches = await findSemanticMatches(resumeSkills, jobSkills)

  // 2. Estimate proficiency levels for matched skills
  const proficiencyLevels = estimateSkillProficiency(resumeAnalysis, [
    ...semanticMatches.exactMatches,
    ...semanticMatches.semanticMatches.map((match) => match.resumeSkill),
  ])

  // 3. Infer additional skills from context
  const inferredSkills = inferSkillsFromContext(resumeAnalysis)

  // 4. Recognize infrastructure patterns
  const infrastructurePatterns = recognizeInfrastructurePatterns(resumeAnalysis)

  // Calculate original match percentage
  const originalMatchCount = semanticMatches.exactMatches.length
  const originalMatchPercentage = jobSkills.length > 0 ? Math.round((originalMatchCount / jobSkills.length) * 100) : 0

  // Calculate enhanced match percentage including semantic matches and inferred skills
  const enhancedMatchCount =
    semanticMatches.exactMatches.length +
    semanticMatches.semanticMatches.length +
    inferredSkills.filter((skill) =>
      jobSkills.some(
        (jobSkill) =>
          jobSkill.toLowerCase().includes(skill.skill.toLowerCase()) ||
          skill.skill.toLowerCase().includes(jobSkill.toLowerCase()),
      ),
    ).length

  const enhancedMatchPercentage = jobSkills.length > 0 ? Math.round((enhancedMatchCount / jobSkills.length) * 100) : 0

  // Explain the improvement
  const improvementReason =
    enhancedMatchPercentage > originalMatchPercentage
      ? `Match percentage improved from ${originalMatchPercentage}% to ${enhancedMatchPercentage}% by including semantic matches and inferred skills.`
      : "No improvement in match percentage."

  return {
    semanticMatches,
    proficiencyLevels,
    inferredSkills,
    infrastructurePatterns,
    enhancedMatchPercentage,
    originalMatchPercentage,
    improvementReason,
  }
}

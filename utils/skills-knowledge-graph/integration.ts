import { buildSkillsKnowledgeGraph } from "./index"
import { SkillMatcher } from "./skill-matcher"
import type { SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"
import type { ExtractedSkills } from "@/app/actions/extract-skills"

/**
 * Integrate the skills knowledge graph with the existing skills gap analysis
 */
export function enhanceSkillsGapAnalysis(
  resumeSkills: ExtractedSkills,
  jobSkills: string[],
  currentAnalysis: SkillGapAnalysisResult,
): SkillGapAnalysisResult {
  // Build the knowledge graph
  const graph = buildSkillsKnowledgeGraph()

  // Create a skill matcher
  const matcher = new SkillMatcher(graph)

  // Flatten resume skills
  const flattenedResumeSkills = flattenSkills(resumeSkills)

  // Find matches and missing skills
  const matches = matcher.findAllMatches(flattenedResumeSkills, jobSkills)
  const missingSkills = matcher.findMissingSkills(flattenedResumeSkills, jobSkills)

  // Calculate match percentage
  const matchPercentage = matcher.calculateMatchPercentage(flattenedResumeSkills, jobSkills)

  // Get recommendations for missing skills
  const recommendations = matcher.getRecommendations(missingSkills)

  // Convert to the expected format
  const enhancedMatchedSkills = matches.map((skill) => {
    const existingMatch = currentAnalysis.matchedSkills.find((s) => s.name.toLowerCase() === skill.toLowerCase())

    return {
      name: skill,
      proficiency: existingMatch?.proficiency || "Intermediate",
      relevance: existingMatch?.relevance || "High",
    }
  })

  const enhancedMissingSkills = missingSkills.map((skill) => {
    const existingMissing = currentAnalysis.missingSkills.find((s) => s.name.toLowerCase() === skill.toLowerCase())

    const priority = matcher.determineMissingSkillPriority(skill, missingSkills)

    return {
      name: skill,
      level: existingMissing?.level || "Intermediate",
      priority: priority,
      context: existingMissing?.context || `This skill is important for the role.`,
    }
  })

  const enhancedRecommendations = recommendations.map((rec) => ({
    type: rec.type,
    description: rec.description,
    timeToAcquire: rec.timeToAcquire,
    priority: rec.priority,
  }))

  // Return the enhanced analysis
  return {
    ...currentAnalysis,
    matchPercentage,
    matchedSkills: enhancedMatchedSkills,
    missingSkills: enhancedMissingSkills,
    recommendations: enhancedRecommendations,
  }
}

/**
 * Flatten an ExtractedSkills object into a single array of skills
 */
function flattenSkills(skills: ExtractedSkills): string[] {
  return [
    ...(skills.technical || []),
    ...(skills.tools || []),
    ...(skills.frameworks || []),
    ...(skills.languages || []),
    ...(skills.databases || []),
    ...(skills.methodologies || []),
    ...(skills.platforms || []),
    ...(skills.other || []),
  ]
}

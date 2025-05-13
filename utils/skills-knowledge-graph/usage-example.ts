import { buildSkillsKnowledgeGraph } from "./index"
import { SkillMatcher } from "./skill-matcher"

/**
 * Example usage of the skills knowledge graph
 */
export function enhancedSkillsGapAnalysis(resumeSkills: string[], jobSkills: string[]) {
  // Build the knowledge graph
  const graph = buildSkillsKnowledgeGraph()

  // Create a skill matcher
  const matcher = new SkillMatcher(graph)

  // Find matches and missing skills
  const matches = matcher.findAllMatches(resumeSkills, jobSkills)
  const missingSkills = matcher.findMissingSkills(resumeSkills, jobSkills)

  // Calculate match percentage
  const matchPercentage = matcher.calculateMatchPercentage(resumeSkills, jobSkills)

  // Get recommendations for missing skills
  const recommendations = matcher.getRecommendations(missingSkills)

  return {
    matchPercentage,
    matches,
    missingSkills,
    recommendations,
  }
}

// Example usage
const resumeSkills = ["JavaScript", "React", "CSS", "Node.js", "MongoDB"]

const jobSkills = ["JavaScript", "React", "Tailwind CSS", "Next.js", "GraphQL", "TypeScript"]

const result = enhancedSkillsGapAnalysis(resumeSkills, jobSkills)
console.log("Match Percentage:", result.matchPercentage)
console.log("Matches:", result.matches)
console.log("Missing Skills:", result.missingSkills)
console.log("Recommendations:", result.recommendations)

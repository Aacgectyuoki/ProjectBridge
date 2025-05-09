import type { SkillsGraph } from "./graph"
import { SkillRelationshipType } from "./types"

/**
 * Enhanced skill matching using the knowledge graph
 */
export class SkillMatcher {
  private graph: SkillsGraph

  constructor(graph: SkillsGraph) {
    this.graph = graph
  }

  /**
   * Find exact matches between resume skills and job skills
   */
  findExactMatches(resumeSkills: string[], jobSkills: string[]): string[] {
    const matches: string[] = []

    for (const resumeSkill of resumeSkills) {
      const resumeSkillNode = this.graph.findSkillByName(resumeSkill)
      if (!resumeSkillNode) continue

      for (const jobSkill of jobSkills) {
        const jobSkillNode = this.graph.findSkillByName(jobSkill)
        if (!jobSkillNode) continue

        if (resumeSkillNode.id === jobSkillNode.id) {
          matches.push(jobSkill)
          break
        }
      }
    }

    return matches
  }

  /**
   * Find semantic matches (skills that are equivalent or very similar)
   */
  findSemanticMatches(resumeSkills: string[], jobSkills: string[], threshold = 0.8): string[] {
    const matches: string[] = []

    for (const resumeSkill of resumeSkills) {
      const resumeSkillNode = this.graph.findSkillByName(resumeSkill)
      if (!resumeSkillNode) continue

      for (const jobSkill of jobSkills) {
        const jobSkillNode = this.graph.findSkillByName(jobSkill)
        if (!jobSkillNode) continue

        // Skip if already an exact match
        if (resumeSkillNode.id === jobSkillNode.id) continue

        // Check if they are similar or alternative skills
        if (
          this.graph.isSkillRelatedTo(resumeSkillNode.id, jobSkillNode.id, [
            SkillRelationshipType.SIMILAR_TO,
            SkillRelationshipType.ALTERNATIVE_TO,
          ])
        ) {
          matches.push(jobSkill)
          continue
        }

        // Check name similarity as a fallback
        const similarSkills = this.graph.findSimilarSkills(resumeSkill, threshold)
        if (similarSkills.some((skill) => skill.id === jobSkillNode.id)) {
          matches.push(jobSkill)
        }
      }
    }

    return matches
  }

  /**
   * Find implied matches (skills that imply knowledge of other skills)
   */
  findImpliedMatches(resumeSkills: string[], jobSkills: string[]): string[] {
    const matches: string[] = []

    for (const resumeSkill of resumeSkills) {
      const resumeSkillNode = this.graph.findSkillByName(resumeSkill)
      if (!resumeSkillNode) continue

      for (const jobSkill of jobSkills) {
        const jobSkillNode = this.graph.findSkillByName(jobSkill)
        if (!jobSkillNode) continue

        // Skip if already an exact or semantic match
        if (resumeSkillNode.id === jobSkillNode.id) continue

        // Check if resume skill is a parent of job skill
        if (this.graph.isSkillRelatedTo(resumeSkillNode.id, jobSkillNode.id, [SkillRelationshipType.PARENT_OF])) {
          matches.push(jobSkill)
          continue
        }

        // Check if job skill requires resume skill
        if (this.graph.isSkillRelatedTo(jobSkillNode.id, resumeSkillNode.id, [SkillRelationshipType.REQUIRES])) {
          matches.push(jobSkill)
        }
      }
    }

    return matches
  }

  /**
   * Find all matches between resume skills and job skills
   */
  findAllMatches(resumeSkills: string[], jobSkills: string[]): string[] {
    const exactMatches = this.findExactMatches(resumeSkills, jobSkills)
    const semanticMatches = this.findSemanticMatches(resumeSkills, jobSkills)
    const impliedMatches = this.findImpliedMatches(resumeSkills, jobSkills)

    // Combine all matches and remove duplicates
    return [...new Set([...exactMatches, ...semanticMatches, ...impliedMatches])]
  }

  /**
   * Calculate the match percentage between resume skills and job skills
   */
  calculateMatchPercentage(resumeSkills: string[], jobSkills: string[]): number {
    if (jobSkills.length === 0) return 100

    const matches = this.findAllMatches(resumeSkills, jobSkills)
    return Math.round((matches.length / jobSkills.length) * 100)
  }

  /**
   * Find missing skills (job skills not matched by resume skills)
   */
  findMissingSkills(resumeSkills: string[], jobSkills: string[]): string[] {
    const matches = this.findAllMatches(resumeSkills, jobSkills)

    // Find job skills that aren't in matches
    return jobSkills.filter((jobSkill) => !matches.includes(jobSkill))
  }

  /**
   * Determine the priority of a missing skill
   */
  determineMissingSkillPriority(skill: string, allMissingSkills: string[]): "High" | "Medium" | "Low" {
    const skillNode = this.graph.findSkillByName(skill)
    if (!skillNode) return "Medium"

    // Check if the skill is a prerequisite for other missing skills
    let isPrerequisite = false
    for (const otherSkill of allMissingSkills) {
      if (skill === otherSkill) continue

      const otherSkillNode = this.graph.findSkillByName(otherSkill)
      if (!otherSkillNode) continue

      if (this.graph.isSkillRelatedTo(skillNode.id, otherSkillNode.id, [SkillRelationshipType.REQUIRES])) {
        isPrerequisite = true
        break
      }
    }

    // High priority if it's a prerequisite or has high popularity
    if (isPrerequisite || (skillNode.popularity && skillNode.popularity >= 80)) {
      return "High"
    }

    // Low priority if it has low popularity
    if (skillNode.popularity && skillNode.popularity < 50) {
      return "Low"
    }

    // Medium priority for everything else
    return "Medium"
  }

  /**
   * Get learning recommendations for missing skills
   */
  getRecommendations(missingSkills: string[]): {
    skill: string
    type: string
    description: string
    timeToAcquire: string
    priority: "High" | "Medium" | "Low"
  }[] {
    const recommendations: {
      skill: string
      type: string
      description: string
      timeToAcquire: string
      priority: "High" | "Medium" | "Low"
    }[] = []

    for (const skill of missingSkills) {
      const skillNode = this.graph.findSkillByName(skill)
      if (!skillNode) continue

      const priority = this.determineMissingSkillPriority(skill, missingSkills)

      // Determine recommendation type based on skill category
      let type = "Course"
      if (skillNode.category === "CONCEPT") {
        type = "Learning Resource"
      } else if (skillNode.category === "TOOL") {
        type = "Hands-on Practice"
      } else if (skillNode.category === "FRAMEWORK" || skillNode.category === "LIBRARY") {
        type = "Project"
      }

      // Determine time to acquire based on skill complexity
      let timeToAcquire = "1-3 months"
      if (skillNode.popularity && skillNode.popularity >= 80) {
        timeToAcquire = "2-4 weeks" // More popular skills often have more resources
      } else if (skillNode.popularity && skillNode.popularity < 50) {
        timeToAcquire = "3-6 months" // Less popular skills might take longer
      }

      // Create recommendation
      recommendations.push({
        skill,
        type,
        description: `Learn ${skill} through ${type.toLowerCase() === "project" ? "building projects" : "online resources"}`,
        timeToAcquire,
        priority,
      })
    }

    // Sort by priority (High > Medium > Low)
    return recommendations.sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
}

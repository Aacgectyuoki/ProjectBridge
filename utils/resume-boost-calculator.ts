import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"
import type { ProjectIdea } from "@/app/actions/generate-project-ideas"

export type SkillBoostData = {
  skill: string
  currentLevel: number // 0-100
  projectedLevel: number // 0-100
  importance: number // 0-100
}

export type ResumeBoostResult = {
  currentMatchPercentage: number
  projectedMatchPercentage: number
  matchImprovement: number
  skillBoosts: SkillBoostData[]
  keySkillsAddressed: string[]
  resumeEnhancementSuggestions: string[]
}

export function calculateResumeBoost(
  project: ProjectIdea,
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
): ResumeBoostResult {
  // Extract all skills from resume
  const resumeSkills = [
    ...(resumeAnalysis.skills?.technical || []),
    ...(resumeAnalysis.skills?.soft || []),
    ...(resumeAnalysis.skills?.tools || []),
    ...(resumeAnalysis.skills?.frameworks || []),
    ...(resumeAnalysis.skills?.languages || []),
    ...(resumeAnalysis.skills?.databases || []),
    ...(resumeAnalysis.skills?.methodologies || []),
    ...(resumeAnalysis.skills?.platforms || []),
  ].map((skill) => skill.toLowerCase())

  // Extract all required skills from job
  const jobSkills = [...(jobAnalysis.requiredSkills || []), ...(jobAnalysis.preferredSkills || [])].map((skill) =>
    skill.toLowerCase(),
  )

  // Calculate current match percentage
  const matchedSkills = jobSkills.filter((jobSkill) =>
    resumeSkills.some((resumeSkill) => resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)),
  )

  const currentMatchPercentage = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0

  // Calculate which skills from the project would address job requirements
  const projectSkills = project.skillsAddressed.map((skill) => skill.toLowerCase())

  const newlyAddressedSkills = jobSkills.filter(
    (jobSkill) =>
      !matchedSkills.includes(jobSkill) &&
      projectSkills.some((projectSkill) => projectSkill.includes(jobSkill) || jobSkill.includes(projectSkill)),
  )

  // Calculate projected match percentage
  const projectedMatchedSkills = [...matchedSkills, ...newlyAddressedSkills]
  const projectedMatchPercentage =
    jobSkills.length > 0 ? Math.round((projectedMatchedSkills.length / jobSkills.length) * 100) : 0

  // Calculate match improvement
  const matchImprovement = projectedMatchPercentage - currentMatchPercentage

  // Generate skill boost data
  const skillBoosts: SkillBoostData[] = newlyAddressedSkills.map((skill) => {
    // Determine importance based on whether it's a required or preferred skill
    const isRequired =
      jobAnalysis.requiredSkills?.some(
        (reqSkill) => reqSkill.toLowerCase().includes(skill) || skill.includes(reqSkill.toLowerCase()),
      ) || false

    return {
      skill,
      currentLevel: 0, // Not present in resume
      projectedLevel: isRequired ? 80 : 70, // Higher level for required skills
      importance: isRequired ? 90 : 70, // Higher importance for required skills
    }
  })

  // Generate resume enhancement suggestions
  const resumeEnhancementSuggestions = [
    `Add "${project.title}" to your Projects section`,
    `Highlight skills gained: ${newlyAddressedSkills.slice(0, 3).join(", ")}`,
    `Mention specific tools used: ${project.tools.slice(0, 3).join(", ")}`,
    `Describe how you implemented ${project.skillsAddressed[0]} in a real-world scenario`,
  ]

  return {
    currentMatchPercentage,
    projectedMatchPercentage,
    matchImprovement,
    skillBoosts,
    keySkillsAddressed: newlyAddressedSkills,
    resumeEnhancementSuggestions,
  }
}

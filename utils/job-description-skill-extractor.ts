/**
 * Utility to extract skills from job descriptions
 */

import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"

/**
 * Extract skills from job description that aren't in the matched skills
 * @param jobAnalysis The job analysis result
 * @param matchedSkills Array of skills already matched
 * @returns Array of missing skills
 */
export function extractMissingSkillsFromJobDescription(
  jobAnalysis: JobAnalysisResult,
  matchedSkills: string[],
): Array<{ name: string; level: string; priority: string; context: string }> {
  const missingSkills: Array<{ name: string; level: string; priority: string; context: string }> = []
  const matchedSkillsLower = matchedSkills.map((skill) => skill.toLowerCase())

  // Process required skills
  if (Array.isArray(jobAnalysis.requiredSkills)) {
    jobAnalysis.requiredSkills.forEach((skill) => {
      // Skip if already matched
      if (
        matchedSkillsLower.some(
          (matched) =>
            matched === skill.toLowerCase() ||
            matched.includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(matched),
        )
      ) {
        return
      }

      // Add as missing skill
      missingSkills.push({
        name: skill,
        level: "Intermediate",
        priority: "High",
        context: `Required skill for the ${jobAnalysis.title || "position"}.`,
      })
    })
  }

  // Process preferred skills
  if (Array.isArray(jobAnalysis.preferredSkills)) {
    jobAnalysis.preferredSkills.forEach((skill) => {
      // Skip if already matched or already added as required
      if (
        matchedSkillsLower.some(
          (matched) =>
            matched === skill.toLowerCase() ||
            matched.includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(matched),
        ) ||
        missingSkills.some((missing) => missing.name.toLowerCase() === skill.toLowerCase())
      ) {
        return
      }

      // Add as missing skill
      missingSkills.push({
        name: skill,
        level: "Intermediate",
        priority: "Medium",
        context: `Preferred skill for the ${jobAnalysis.title || "position"}.`,
      })
    })
  }

  // Extract skills from responsibilities
  if (Array.isArray(jobAnalysis.responsibilities)) {
    // Common technology keywords to look for
    const techKeywords = [
      "React",
      "Angular",
      "Vue",
      "Next.js",
      "Nuxt",
      "Svelte",
      "JavaScript",
      "TypeScript",
      "HTML",
      "CSS",
      "SCSS",
      "Sass",
      "Tailwind",
      "Bootstrap",
      "Material UI",
      "Chakra UI",
      "Node.js",
      "Express",
      "Django",
      "Flask",
      "Laravel",
      "Ruby on Rails",
      "GraphQL",
      "REST",
      "AWS",
      "Azure",
      "GCP",
      "Firebase",
      "Docker",
      "Kubernetes",
      "Jenkins",
      "GitHub Actions",
      "CircleCI",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "SQLite",
      "DynamoDB",
      "Redux",
      "MobX",
      "Zustand",
      "Context API",
      "Recoil",
      "Jest",
      "Mocha",
      "Cypress",
      "Playwright",
      "Testing Library",
      "Webpack",
      "Vite",
      "Rollup",
      "Parcel",
      "esbuild",
      "GSAP",
      "Three.js",
      "D3",
      "Chart.js",
      "Recharts",
      "Figma",
      "Sketch",
      "Adobe XD",
      "Photoshop",
      "Illustrator",
      "Sanity",
      "Contentful",
      "Strapi",
      "WordPress",
      "Drupal",
      "TensorFlow",
      "PyTorch",
      "scikit-learn",
      "Pandas",
      "NumPy",
    ]

    // Extract technologies from responsibilities
    jobAnalysis.responsibilities.forEach((responsibility) => {
      techKeywords.forEach((tech) => {
        const regex = new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i")
        if (regex.test(responsibility)) {
          // Skip if already matched or already added
          if (
            matchedSkillsLower.some(
              (matched) =>
                matched === tech.toLowerCase() ||
                matched.includes(tech.toLowerCase()) ||
                tech.toLowerCase().includes(matched),
            ) ||
            missingSkills.some((missing) => missing.name.toLowerCase() === tech.toLowerCase())
          ) {
            return
          }

          // Add as missing skill
          missingSkills.push({
            name: tech,
            level: "Intermediate",
            priority: "Medium",
            context: `Mentioned in job responsibilities: "${responsibility}"`,
          })
        }
      })
    })
  }

  return missingSkills
}

/**
 * Utility to extract missing skills from summary text when structured arrays are empty
 */

// Common skill-related terms that might appear in summaries
const SKILL_INDICATORS = [
  "lacking experience in",
  "missing skills in",
  "needs to learn",
  "should acquire",
  "lacks knowledge of",
  "needs to gain experience in",
  "missing",
  "lacking",
]

// Priority indicators
const PRIORITY_INDICATORS: Record<string, string> = {
  critical: "High",
  essential: "High",
  important: "High",
  necessary: "High",
  required: "High",
  recommended: "Medium",
  helpful: "Medium",
  useful: "Medium",
  beneficial: "Medium",
  optional: "Low",
  "nice to have": "Low",
  plus: "Low",
  bonus: "Low",
}

/**
 * Extract missing skills from summary text
 * @param summary The analysis summary text
 * @param existingSkills Array of skills already identified (to avoid duplicates)
 * @returns Array of extracted missing skills
 */
export function extractMissingSkillsFromSummary(
  summary: string,
  existingSkills: string[] = [],
): Array<{ name: string; level: string; priority: string; context: string }> {
  if (!summary) return []

  const existingSkillsLower = existingSkills.map((skill) => skill.toLowerCase())
  const extractedSkills: Array<{ name: string; level: string; priority: string; context: string }> = []

  // Try to find skill lists in the summary
  for (const indicator of SKILL_INDICATORS) {
    if (summary.toLowerCase().includes(indicator)) {
      const parts = summary.split(indicator)
      // Look at the part after the indicator
      if (parts.length > 1) {
        const skillsPart = parts[1].split(".")[0] // Get text until the next period

        // Extract comma or 'and' separated skills
        const skillsText = skillsPart.replace(/\band\b/g, ",")
        const skillsList = skillsText
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && s.length > 1) // Filter out empty or single-char items

        // Process each potential skill
        for (const skillText of skillsList) {
          // Clean up the skill name
          const skillName = skillText
            .replace(/^\W+|\W+$/g, "") // Remove leading/trailing non-word chars
            .replace(/\.$/, "") // Remove trailing period

          // Skip if too long (likely not a skill name)
          if (skillName.length > 30) continue

          // Skip if already in existing skills
          if (existingSkillsLower.includes(skillName.toLowerCase())) continue

          // Determine priority based on context
          let priority = "Medium" // Default priority
          for (const [indicator, level] of Object.entries(PRIORITY_INDICATORS)) {
            if (summary.toLowerCase().includes(indicator)) {
              priority = level
              break
            }
          }

          // Add to extracted skills if not already added
          if (!extractedSkills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
            extractedSkills.push({
              name: skillName,
              level: "Intermediate", // Default level
              priority,
              context: `Mentioned in analysis summary as missing: "${indicator} ${skillText}"`,
            })
          }
        }
      }
    }
  }

  return extractedSkills
}

/**
 * Extract specific technologies from a summary
 * This is more targeted than the general extraction and looks for specific tech terms
 */
export function extractTechnologiesFromSummary(summary: string): string[] {
  if (!summary) return []

  // Common technologies and frameworks to look for
  const technologies = [
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

  const foundTechnologies: string[] = []

  for (const tech of technologies) {
    // Create a regex that matches the technology as a whole word
    const regex = new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i")
    if (regex.test(summary)) {
      foundTechnologies.push(tech)
    }
  }

  return foundTechnologies
}

/**
 * Utility functions for extracting skills from resume text
 */

/**
 * Extracts skills from bullet-point formatted skills sections
 * @param text The resume text containing skills
 * @returns Structured skills object
 */
export function extractSkillsFromBulletPoints(text: string): Record<string, string[]> {
  const skillsSection = extractSkillsSection(text)
  if (!skillsSection) return {}

  const skillsByCategory: Record<string, string[]> = {}

  // Match patterns like "- Category: Skill1, Skill2, Skill3"
  const skillLineRegex = /[-•]\s*([^:]+):\s*(.+)$/gm
  let match

  while ((match = skillLineRegex.exec(skillsSection)) !== null) {
    const category = match[1].trim()
    const skillsText = match[2].trim()

    // Split by commas, and/or
    const skills = skillsText
      .split(/,\s*|\s+and\s+|\s+or\s+/)
      .map((skill) => skill.trim())
      .filter(Boolean)

    skillsByCategory[category] = skills
  }

  return skillsByCategory
}

/**
 * Extracts the skills section from resume text
 * @param text Full resume text
 * @returns The skills section text or null if not found
 */
function extractSkillsSection(text: string): string | null {
  // Look for a skills section header
  const skillsSectionRegex = /(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|KEY SKILLS)[:\s]*\n((?:[-•].*\n?)+)/i
  const match = text.match(skillsSectionRegex)

  if (match && match[1]) {
    return match[1]
  }

  return null
}

/**
 * Maps extracted skill categories to our standard categories
 * @param extractedSkills Skills extracted from bullet points
 * @returns Skills mapped to standard categories
 */
export function mapToStandardCategories(extractedSkills: Record<string, string[]>): Record<string, string[]> {
  const standardCategories: Record<string, string[]> = {
    technical: [],
    soft: [],
    tools: [],
    frameworks: [],
    languages: [],
    databases: [],
    methodologies: [],
    platforms: [],
    other: [],
  }

  // Category mapping rules
  const categoryMappings: Record<string, string> = {
    // Technical categories
    programming: "languages",
    languages: "languages",
    scripting: "languages",

    // Tools and platforms
    tools: "tools",
    "operating systems": "platforms",
    os: "platforms",
    cloud: "platforms",

    // Frameworks and libraries
    frameworks: "frameworks",
    "frameworks/libraries": "frameworks",
    libraries: "frameworks",

    // Databases
    databases: "databases",
    "data warehousing": "databases",

    // Methodologies
    methodologies: "methodologies",
    processes: "methodologies",
    "project management": "methodologies",

    // Soft skills
    "soft skills": "soft",
    interpersonal: "soft",
    communication: "soft",

    // Security (map to technical)
    security: "technical",
    "security tools": "tools",
    "security concepts": "technical",

    // Data-related (map to technical)
    "big data": "technical",
    "data analysis": "technical",
    statistics: "technical",
    "etl tools": "tools",

    // Design (map to tools)
    design: "tools",
    cms: "tools",

    // Networking (map to technical)
    networking: "technical",
    monitoring: "tools",
    virtualization: "technical",

    // Compliance (map to other)
    compliance: "other",
    "version control": "tools",
  }

  // Map each category to standard categories
  Object.entries(extractedSkills).forEach(([category, skills]) => {
    const lowerCategory = category.toLowerCase()
    const targetCategory = categoryMappings[lowerCategory] || "other"

    standardCategories[targetCategory].push(...skills)
  })

  // Remove duplicates
  Object.keys(standardCategories).forEach((category) => {
    standardCategories[category] = [...new Set(standardCategories[category])]
  })

  return standardCategories
}

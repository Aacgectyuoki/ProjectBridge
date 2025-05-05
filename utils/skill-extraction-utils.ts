/**
 * Utility functions for skill extraction
 */

// Define skill categories
export const skillCategories = {
  technical: [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C#",
    "C++",
    "Ruby",
    "Go",
    "PHP",
    "Swift",
    "Kotlin",
    "Rust",
    "Scala",
    "HTML",
    "CSS",
    "SQL",
    "NoSQL",
    "GraphQL",
    "REST",
    "SOAP",
    "API",
    "Microservices",
    "Serverless",
    "Cloud",
    "DevOps",
    "CI/CD",
    "Testing",
    "TDD",
    "BDD",
    "Full Stack",
    "Frontend",
    "Backend",
    "Mobile",
    "Web",
    "Desktop",
    "Embedded",
    "IoT",
    "Machine Learning",
    "AI",
    "Data Science",
    "Big Data",
    "Analytics",
    "Visualization",
    "Security",
    "Networking",
    "Blockchain",
    "Cryptocurrency",
    "AR/VR",
    "Game Development",
    "API Optimization",
    "Full Stack Development",
    "Microservices Architecture",
  ],
  tools: [
    "Git",
    "GitHub",
    "GitLab",
    "Bitbucket",
    "JIRA",
    "Confluence",
    "Trello",
    "Asana",
    "Slack",
    "Docker",
    "Kubernetes",
    "Jenkins",
    "Travis CI",
    "CircleCI",
    "AWS",
    "Azure",
    "GCP",
    "Heroku",
    "Netlify",
    "Vercel",
    "Firebase",
    "Supabase",
    "MongoDB Atlas",
    "Redis",
    "Elasticsearch",
    "Kibana",
    "Grafana",
    "Prometheus",
    "New Relic",
    "Datadog",
    "VS Code",
    "IntelliJ",
    "Eclipse",
    "Xcode",
    "Android Studio",
    "Postman",
    "Insomnia",
    "Figma",
    "Sketch",
    "Adobe XD",
    "Photoshop",
    "Illustrator",
  ],
  frameworks: [
    "React",
    "Angular",
    "Vue",
    "Svelte",
    "Next.js",
    "Nuxt.js",
    "Gatsby",
    "Express",
    "Nest.js",
    "Django",
    "Flask",
    "Spring",
    "ASP.NET",
    "Laravel",
    "Ruby on Rails",
    "Phoenix",
    "FastAPI",
    "Gin",
    "Echo",
    "Fiber",
    "Symfony",
    "CodeIgniter",
    "jQuery",
    "Bootstrap",
    "Tailwind CSS",
    "Material UI",
    "Chakra UI",
    "Ant Design",
    "Redux",
    "MobX",
    "Zustand",
    "Recoil",
    "NgRx",
    "Vuex",
    "Pinia",
  ],
  languages: [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C#",
    "C++",
    "Ruby",
    "Go",
    "PHP",
    "Swift",
    "Kotlin",
    "Rust",
    "Scala",
    "Dart",
    "Objective-C",
    "Perl",
    "Haskell",
    "Clojure",
    "Elixir",
    "Erlang",
    "F#",
    "COBOL",
    "Assembly",
    "R",
    "MATLAB",
    "Groovy",
    "Bash",
    "PowerShell",
    "SQL",
    "HTML",
    "CSS",
    "XML",
    "JSON",
    "YAML",
    "Markdown",
    "LaTeX",
  ],
  databases: [
    "MySQL",
    "PostgreSQL",
    "SQLite",
    "SQL Server",
    "Oracle",
    "MongoDB",
    "Cassandra",
    "DynamoDB",
    "Firestore",
    "Redis",
    "Elasticsearch",
    "Neo4j",
    "CouchDB",
    "MariaDB",
    "Supabase",
    "Firebase",
    "Fauna",
    "Cosmos DB",
    "BigQuery",
    "Snowflake",
    "Redshift",
  ],
  methodologies: [
    "Agile",
    "Scrum",
    "Kanban",
    "Waterfall",
    "Lean",
    "XP",
    "DevOps",
    "CI/CD",
    "TDD",
    "BDD",
    "DDD",
    "Microservices",
    "Serverless",
    "Event-Driven",
    "SOA",
    "Monolithic",
    "MVP",
    "Rapid Prototyping",
    "Design Thinking",
    "User-Centered Design",
  ],
  platforms: [
    "AWS",
    "Azure",
    "GCP",
    "Heroku",
    "Netlify",
    "Vercel",
    "Firebase",
    "Supabase",
    "DigitalOcean",
    "Linode",
    "Cloudflare",
    "Akamai",
    "Fastly",
    "GitHub Pages",
    "WordPress",
    "Shopify",
    "Webflow",
    "Wix",
    "Squarespace",
    "Contentful",
    "Sanity",
    "Strapi",
    "iOS",
    "Android",
    "Windows",
    "macOS",
    "Linux",
    "Unix",
    "Raspberry Pi",
    "Arduino",
    "Kubernetes",
    "Docker",
    "OpenShift",
    "Rancher",
    "Terraform",
    "Ansible",
  ],
  soft: [
    "Communication",
    "Teamwork",
    "Leadership",
    "Problem Solving",
    "Critical Thinking",
    "Time Management",
    "Organization",
    "Adaptability",
    "Flexibility",
    "Creativity",
    "Emotional Intelligence",
    "Conflict Resolution",
    "Negotiation",
    "Presentation",
    "Public Speaking",
    "Writing",
    "Listening",
    "Empathy",
    "Patience",
    "Persistence",
    "Self-Motivation",
    "Work Ethic",
    "Attention to Detail",
    "Analytical Thinking",
    "Decision Making",
    "Strategic Planning",
    "Project Management",
    "Mentoring",
    "Coaching",
    "Customer Service",
    "Client Relations",
    "Networking",
    "Collaboration",
    "Team Leadership", // Added Team Leadership to soft skills
  ],
}

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
 * Categorize a skill based on predefined categories
 * @param skill The skill to categorize
 * @returns The category of the skill
 */
export function categorizeSkill(skill: string): string {
  const lowerSkill = skill.toLowerCase()

  // Special case for "Team Leadership" - always categorize as soft skill
  if (lowerSkill === "team leadership") {
    return "soft"
  }

  for (const [category, skills] of Object.entries(skillCategories)) {
    if (skills.some((s) => s.toLowerCase() === lowerSkill)) {
      return category
    }
  }

  // Leadership-related skills should be soft skills
  if (lowerSkill.includes("leadership") || lowerSkill.includes("management") || lowerSkill.includes("communication")) {
    return "soft"
  }

  // Default categorization based on common patterns
  if (lowerSkill.includes("framework") || lowerSkill.endsWith(".js") || lowerSkill.endsWith("kit")) {
    return "frameworks"
  }

  if (lowerSkill.includes("database") || lowerSkill.includes("db") || lowerSkill.endsWith("sql")) {
    return "databases"
  }

  if (lowerSkill.includes("aws") || lowerSkill.includes("azure") || lowerSkill.includes("cloud")) {
    return "platforms"
  }

  if (lowerSkill.includes("docker") || lowerSkill.includes("kubernetes") || lowerSkill.includes("git")) {
    return "tools"
  }

  // Default to technical for unknown skills
  return "technical"
}

/**
 * Deduplicate and normalize skills
 * @param skills Array of skills to process
 * @returns Deduplicated and normalized skills array
 */
export function deduplicateSkills(skills: string[]): string[] {
  // Create a map to track normalized skills
  const normalizedMap = new Map<string, string>()

  // Normalize each skill and add to map (keeping the best capitalization)
  skills.forEach((skill) => {
    const normalized = skill.toLowerCase().trim()

    // Skip empty skills
    if (!normalized) return

    // If this normalized version doesn't exist yet, or the current one has better capitalization
    if (!normalizedMap.has(normalized) || skill.length > normalizedMap.get(normalized).length) {
      normalizedMap.set(normalized, skill)
    }
  })

  // Return the deduplicated skills with best capitalization
  return Array.from(normalizedMap.values())
}

/**
 * Organize extracted skills into categories
 * @param skills Array of skills to organize
 * @returns Object with categorized skills
 */
export function organizeSkillsByCategory(skills: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {
    technical: [],
    tools: [],
    frameworks: [],
    languages: [],
    databases: [],
    methodologies: [],
    platforms: [],
    soft: [],
  }

  // Deduplicate skills first
  const uniqueSkills = deduplicateSkills(skills)

  // Categorize each skill
  uniqueSkills.forEach((skill) => {
    const category = categorizeSkill(skill)

    // Add to appropriate category
    if (result[category]) {
      result[category].push(skill)
    } else {
      // Default to technical if category doesn't exist
      result.technical.push(skill)
    }
  })

  return result
}

/**
 * Clean up and normalize extracted skills
 * @param extractionResult The raw extraction result
 * @returns Cleaned and normalized extraction result
 */
export function cleanupExtractedSkills(extractionResult: any): any {
  if (!extractionResult || typeof extractionResult !== "object") {
    return { skills: { technical: [], soft: [] } }
  }

  // Ensure skills object exists
  if (!extractionResult.skills) {
    extractionResult.skills = { technical: [], soft: [] }
    return extractionResult
  }

  // Get all skills from all categories
  const allSkills: string[] = []

  // Collect skills from all categories
  Object.entries(extractionResult.skills).forEach(([category, skills]) => {
    if (Array.isArray(skills)) {
      allSkills.push(...skills)
    }
  })

  // Reorganize all skills into proper categories
  extractionResult.skills = organizeSkillsByCategory(allSkills)

  return extractionResult
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
    leadership: "soft", // Added leadership mapping
    "team leadership": "soft", // Added team leadership mapping

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

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { EnhancedSkillsLogger } from "./enhanced-skills-logger"

// Common patterns in job descriptions
const PATTERN_INDICATORS = [
  "e.g.,",
  "such as",
  "like",
  "including",
  "for example",
  "or similar",
  "or equivalent",
  "or related",
]

// Relationship types
const RELATIONSHIP_TYPES = [
  "experience with",
  "exposure to",
  "familiarity with",
  "knowledge of",
  "proficiency in",
  "skilled in",
  "expertise in",
  "background in",
]

export type SkillPattern = {
  category: string
  skills: string[]
  relationshipType: string
  required: boolean
  originalText: string
  confidence: number
}

/**
 * Extracts skill patterns from job description text using regex
 */
export function extractPatternsWithRegex(text: string): SkillPattern[] {
  const patterns: SkillPattern[] = []

  // Pattern 1: Category (e.g., Skill1, Skill2)
  const egPattern = /([A-Za-z\s/]+)\s*$$\s*(?:e\.g\.|i\.e\.|such as|like|including),\s*([^)]+)$$/gi
  let match

  while ((match = egPattern.exec(text)) !== null) {
    const category = match[1].trim()
    const skillsText = match[2].trim()
    const skills = skillsText
      .split(/,\s*|,?\s*(?:and|or)\s*/)
      .map((s) => s.trim())
      .filter(Boolean)

    // Determine relationship type
    let relationshipType = "knowledge of" // default
    for (const type of RELATIONSHIP_TYPES) {
      const beforeText = text.substring(Math.max(0, match.index - 30), match.index)
      if (beforeText.toLowerCase().includes(type)) {
        relationshipType = type
        break
      }
    }

    // Determine if required
    const contextBefore = text.substring(Math.max(0, match.index - 100), match.index)
    const required = !/(optional|nice to have|preferred|plus|bonus|desired)/i.test(contextBefore)

    patterns.push({
      category,
      skills,
      relationshipType,
      required,
      originalText: match[0],
      confidence: 0.8,
    })
  }

  // Pattern 2: Category such as Skill1, Skill2, or Skill3
  const suchAsPattern = /([A-Za-z\s/]+)\s*(?:such as|like|including)\s*([^.;:]+)(?:[.;:]|$)/gi

  while ((match = suchAsPattern.exec(text)) !== null) {
    const category = match[1].trim()
    const skillsText = match[2].trim()
    const skills = skillsText
      .split(/,\s*|,?\s*(?:and|or)\s*/)
      .map((s) => s.trim())
      .filter(Boolean)

    // Determine relationship type
    let relationshipType = "knowledge of" // default
    for (const type of RELATIONSHIP_TYPES) {
      const beforeText = text.substring(Math.max(0, match.index - 30), match.index)
      if (beforeText.toLowerCase().includes(type)) {
        relationshipType = type
        break
      }
    }

    // Determine if required
    const contextBefore = text.substring(Math.max(0, match.index - 100), match.index)
    const required = !/(optional|nice to have|preferred|plus|bonus|desired)/i.test(contextBefore)

    patterns.push({
      category,
      skills,
      relationshipType,
      required,
      originalText: match[0],
      confidence: 0.7,
    })
  }

  return patterns
}

/**
 * Extracts skill patterns using AI
 */
export async function extractPatternsWithAI(text: string): Promise<SkillPattern[]> {
  try {
    const prompt = `
      Analyze this job description text and identify all instances where a skill category is followed by specific examples.
      
      Text:
      "${text}"
      
      For each pattern found, extract:
      1. The skill category (e.g., "observability tools")
      2. The specific skills/technologies mentioned (e.g., "Prometheus", "Grafana")
      3. The relationship type (e.g., "exposure to", "experience with", "proficiency in")
      4. Whether it's required or preferred/optional
      
      Return as JSON in this format:
      [
        {
          "category": "observability tools",
          "skills": ["Prometheus", "Grafana", "OpenTelemetry"],
          "relationshipType": "exposure to",
          "required": true,
          "originalText": "full matching text"
        }
      ]
      
      IMPORTANT:
      - Use double quotes for all strings and property names
      - Do not include trailing commas
      - Return ONLY the JSON array, no additional text
    `

    const startTime = performance.now()
    const { text: result } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.2,
      maxTokens: 2048,
    })
    const endTime = performance.now()

    EnhancedSkillsLogger.logProcessingStep({
      step: "AI Pattern Extraction",
      duration: endTime - startTime,
      status: "success",
      details: { prompt_length: prompt.length, response_length: result.length },
    })

    try {
      // Try to parse the JSON response
      const patterns = JSON.parse(result) as SkillPattern[]

      // Add confidence score
      return patterns.map((p) => ({
        ...p,
        confidence: 0.9,
      }))
    } catch (e) {
      console.error("Failed to parse AI pattern extraction result:", e)
      EnhancedSkillsLogger.logProcessingStep({
        step: "AI Pattern Extraction - JSON Parsing",
        duration: 0,
        status: "error",
        details: { error: e.message, result },
      })
      return []
    }
  } catch (e) {
    console.error("Error in AI pattern extraction:", e)
    EnhancedSkillsLogger.logProcessingStep({
      step: "AI Pattern Extraction",
      duration: 0,
      status: "error",
      details: { error: e.message },
    })
    return []
  }
}

/**
 * Combines regex and AI approaches for pattern extraction
 */
export async function extractSkillPatterns(text: string): Promise<SkillPattern[]> {
  // Start with regex patterns (fast)
  const regexPatterns = extractPatternsWithRegex(text)

  // Then try AI-based extraction (more comprehensive but slower)
  let aiPatterns: SkillPattern[] = []
  try {
    aiPatterns = await extractPatternsWithAI(text)
  } catch (e) {
    console.error("AI pattern extraction failed, falling back to regex only:", e)
  }

  // Combine and deduplicate results
  const allPatterns = [...regexPatterns, ...aiPatterns]

  // Deduplicate based on skills
  const uniquePatterns: SkillPattern[] = []
  const seenSkills = new Set<string>()

  for (const pattern of allPatterns) {
    const newSkills = pattern.skills.filter((skill) => !seenSkills.has(skill.toLowerCase()))

    if (newSkills.length > 0) {
      // Add new skills to seen set
      newSkills.forEach((skill) => seenSkills.add(skill.toLowerCase()))

      // Add pattern with only new skills
      uniquePatterns.push({
        ...pattern,
        skills: newSkills,
      })
    }
  }

  return uniquePatterns
}

/**
 * Normalizes extracted skills based on common variations
 */
export function normalizeSkills(patterns: SkillPattern[]): SkillPattern[] {
  // Common variations of the same skill
  const skillVariations: Record<string, string[]> = {
    react: ["reactjs", "react.js", "react js"],
    angular: ["angularjs", "angular.js", "angular js"],
    vue: ["vuejs", "vue.js", "vue js"],
    javascript: ["js", "ecmascript"],
    typescript: ["ts"],
    python: ["py"],
    kubernetes: ["k8s"],
    docker: ["docker container"],
    // Add more variations as needed
  }

  // Create a mapping from variation to canonical form
  const normalizationMap: Record<string, string> = {}
  Object.entries(skillVariations).forEach(([canonical, variations]) => {
    variations.forEach((variation) => {
      normalizationMap[variation.toLowerCase()] = canonical
    })
  })

  // Normalize skills in each pattern
  return patterns.map((pattern) => {
    const normalizedSkills = pattern.skills.map((skill) => {
      const skillLower = skill.toLowerCase()
      return normalizationMap[skillLower] || skill
    })

    return {
      ...pattern,
      skills: normalizedSkills,
    }
  })
}

/**
 * Categorizes skills into technical domains
 */
export function categorizeSkills(patterns: SkillPattern[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    frontend: [],
    backend: [],
    database: [],
    devops: [],
    cloud: [],
    mobile: [],
    ai_ml: [],
    testing: [],
    other: [],
  }

  // Skill to category mapping
  const skillCategories: Record<string, string> = {
    // Frontend
    react: "frontend",
    angular: "frontend",
    vue: "frontend",
    javascript: "frontend",
    typescript: "frontend",
    html: "frontend",
    css: "frontend",

    // Backend
    python: "backend",
    java: "backend",
    go: "backend",
    "node.js": "backend",
    "c#": "backend",
    ruby: "backend",
    php: "backend",

    // Database
    sql: "database",
    postgresql: "database",
    mysql: "database",
    mongodb: "database",
    redis: "database",

    // DevOps
    docker: "devops",
    kubernetes: "devops",
    jenkins: "devops",
    "github actions": "devops",
    "gitlab ci": "devops",
    terraform: "devops",

    // Cloud
    aws: "cloud",
    azure: "cloud",
    gcp: "cloud",
    "google cloud": "cloud",

    // Add more mappings as needed
  }

  // Categorize all skills
  patterns.forEach((pattern) => {
    pattern.skills.forEach((skill) => {
      const skillLower = skill.toLowerCase()
      const category = skillCategories[skillLower] || "other"
      if (!categories[category].includes(skill)) {
        categories[category].push(skill)
      }
    })
  })

  return categories
}

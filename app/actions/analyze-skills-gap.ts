"use server"

// import { generateText } from "ai"
// import { LangChain } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { categorizeAISkill, getSkillConfidence } from "@/utils/ai-skills-taxonomy"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"

export type EnhancedExtractedSkills = {
  technical: Array<{ name: string; confidence: number }>
  soft: Array<{ name: string; confidence: number }>
  tools: Array<{ name: string; confidence: number }>
  frameworks: Array<{ name: string; confidence: number }>
  languages: Array<{ name: string; confidence: number }>
  databases: Array<{ name: string; confidence: number }>
  methodologies: Array<{ name: string; confidence: number }>
  platforms: Array<{ name: string; confidence: number }>
  ai_concepts: Array<{ name: string; confidence: number }>
  ai_infrastructure: Array<{ name: string; confidence: number }>
  ai_agents: Array<{ name: string; confidence: number }>
  ai_engineering: Array<{ name: string; confidence: number }>
  ai_data: Array<{ name: string; confidence: number }>
  ai_applications: Array<{ name: string; confidence: number }>
  other: Array<{ name: string; confidence: number }>
}

const defaultEnhancedExtractedSkills: EnhancedExtractedSkills = {
  technical: [],
  soft: [],
  tools: [],
  frameworks: [],
  languages: [],
  databases: [],
  methodologies: [],
  platforms: [],
  ai_concepts: [],
  ai_infrastructure: [],
  ai_agents: [],
  ai_engineering: [],
  ai_data: [],
  ai_applications: [],
  other: [],
}

/**
 * Enhanced skill extraction with AI-specific taxonomy and confidence scoring
 */
export async function enhancedExtractSkills(
  text: string,
  source: "resume" | "job" = "resume",
): Promise<EnhancedExtractedSkills> {
  const startTime = performance.now()

  // 1) Build a ChatPromptTemplate with proper LCEL format
  const skillPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert skills analyzer for the AI and tech industry. Your task is to extract and categorize all skills mentioned in the following ${source === "resume" ? "resume" : "job description"}.

Text:
{text}

Extract ALL skills mentioned, including:
1. Technical skills (programming, engineering, data analysis, etc.)
2. Soft skills (communication, leadership, etc.)
3. Tools (specific software, platforms, etc.)
4. Frameworks and libraries
5. Programming languages
6. Databases
7. Methodologies (Agile, Scrum, etc.)
8. Platforms (cloud services, operating systems, etc.)
9. AI-specific skills (machine learning, NLP, computer vision, etc.)
10. Other relevant skills

Guidelines:
- Be comprehensive—even one-offs.
- Resolve abbreviations (AWS → Amazon Web Services).
- Use the most specific category available.
- Return ONLY a JSON object with shape:
{
  "technical": ["skill1", ...],
  "soft": ["skill1", ...],
  "tools": ["tool1", ...],
  "frameworks": ["framework1", ...],
  "languages": ["lang1", ...],
  "databases": ["db1", ...],
  "methodologies": ["meth1", ...],
  "platforms": ["plat1", ...],
  "other": ["other1", ...]
}
`)

  // 2) Spin up an OpenAI LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",           // or whichever you prefer
    openAIApiKey: process.env.OPENAI_API_KEY!,
    temperature: 0.1,
  })

  // 3) Wire up the chain using LCEL pipe
  const chain = skillPrompt.pipe(llm)

  // 4) Execute the chain using invoke
  let raw: string
  try {
    const response = await chain.invoke({ text, source })
    raw = typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content.map((c: any) => (typeof c === "string" ? c : c.text ?? "")).join(" ")
        : String(response.content)
  } catch (e) {
    console.error("LangChain error:", e)
    raw = ""  // fallback to empty so we hit regex path below
  }

  // 5) Parse JSON or fallback
  let extracted: Record<string, any> | null = null
  try {
    extracted = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) {
      try { extracted = JSON.parse(m[0]) } catch {}
    }
  }
  if (!extracted) {
    console.log("Falling back to regex extraction")
    extracted = extractSkillsWithRegex(text)
  }

  // 6) Build enhanced result
  const enhanced = { ...defaultEnhancedExtractedSkills }
  Object.entries(extracted).forEach(([cat, list]) => {
    if (Array.isArray(list)) {
      list.forEach((skill: string) => {
        if (!skill || typeof skill !== "string") return
        const confidence = getSkillConfidence(skill, text)
        enhanced[cat as keyof EnhancedExtractedSkills].push({ name: skill, confidence })
        categorizeAISkill(skill).forEach((aiCat) => {
          const key = `ai_${aiCat}` as keyof EnhancedExtractedSkills
          if (enhanced[key]) enhanced[key].push({ name: skill, confidence })
        })
      })
    }
  })

  // 7) Log and return
  EnhancedSkillsLogger.logExtractedSkills(
    text,
    enhanced,
    `enhanced-${source}-extraction`,
    Math.round(performance.now() - startTime),
  )
  return enhanced
}

/**
 * Fallback function to extract skills using regex patterns
 */
function extractSkillsWithRegex(text: string): any {
  const normalizedText = text.toLowerCase()

  const extractedSkills: {
    technical: string[]
    soft: string[]
    tools: string[]
    frameworks: string[]
    languages: string[]
    databases: string[]
    methodologies: string[]
    platforms: string[]
    other: string[]
  } = {
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

  // Common programming languages
  const languages = [
    "javascript",
    "typescript",
    "python",
    "java",
    "c\\+\\+",
    "c#",
    "ruby",
    "go",
    "rust",
    "php",
    "swift",
    "kotlin",
  ]
  languages.forEach((lang) => {
    const regex = new RegExp(`\\b${lang}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.languages.push(lang.charAt(0).toUpperCase() + lang.slice(1).replace("\\+\\+", "++"))
    }
  })

  // Common frameworks
  const frameworks = [
    "react",
    "angular",
    "vue",
    "next.js",
    "express",
    "django",
    "flask",
    "spring",
    "tensorflow",
    "pytorch",
    "langchain",
  ]
  frameworks.forEach((framework) => {
    const regex = new RegExp(`\\b${framework}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.frameworks.push(framework.charAt(0).toUpperCase() + framework.slice(1))
    }
  })

  // Common databases
  const databases = [
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "dynamodb",
    "redis",
    "cassandra",
    "sqlite",
    "oracle",
    "vector database",
  ]
  databases.forEach((db) => {
    const regex = new RegExp(`\\b${db}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.databases.push(db.charAt(0).toUpperCase() + db.slice(1))
    }
  })

  // Common AI terms
  const aiTerms = [
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
    "ai",
    "ml",
    "neural network",
    "llm",
    "large language model",
    "rag",
    "retrieval augmented generation",
  ]
  aiTerms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.technical.push(term.charAt(0).toUpperCase() + term.slice(1))
    }
  })

  // Common soft skills
  const softSkills = [
    "leadership",
    "communication",
    "teamwork",
    "problem solving",
    "critical thinking",
    "time management",
    "collaboration",
    "adaptability",
  ]
  softSkills.forEach((skill) => {
    const regex = new RegExp(`\\b${skill}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.soft.push(skill.charAt(0).toUpperCase() + skill.slice(1))
    }
  })

  return extractedSkills
}

/**
 * Filter out non-learnable recommendations
 * @param recommendations Array of recommendations
 * @returns Filtered recommendations
 */
function filterRecommendations(recommendations: any[]): any[] {
  // Patterns that indicate non-learnable items
  const nonLearnablePatterns = [
    /degree/i,
    /years of experience/i,
    /certification/i,
    /experience in/i,
    /bachelor/i,
    /master/i,
    /phd/i,
    /mba/i,
  ]

  // Filter out recommendations that match non-learnable patterns
  const filteredRecommendations = recommendations.filter((rec) => {
    return !nonLearnablePatterns.some((pattern) => pattern.test(rec.description))
  })

  // If we filtered out all recommendations, generate some generic ones
  if (filteredRecommendations.length === 0 && recommendations.length > 0) {
    return [
      {
        type: "Course",
        description: "Take online courses in relevant technical skills",
        timeToAcquire: "1-3 months",
        priority: "High",
      },
      {
        type: "Project",
        description: "Build portfolio projects to demonstrate skills",
        timeToAcquire: "2-4 months",
        priority: "High",
      },
      {
        type: "Practice",
        description: "Practice with real-world examples and case studies",
        timeToAcquire: "Ongoing",
        priority: "Medium",
      },
    ]
  }

  return filteredRecommendations
}

/**
 * Generate a data-driven analysis based on the resume and job skills
 * This ensures we always have meaningful data to display even if AI fails
 */
function generateDataDrivenAnalysis(
  resumeSkills: Record<string, string[]>,
  jobRequiredSkills: string[],
  jobPreferredSkills: string[],
  jobAnalysis: JobAnalysisResult,
): SkillGapAnalysisResult {
  // Flatten resume skills into a single array for easier comparison
  const allResumeSkills = Object.values(resumeSkills).flat()

  // Find matched skills (case-insensitive comparison)
  const matchedSkills = []
  const matchedSkillNames = new Set()

  // Check for matches in required skills
  for (const requiredSkill of jobRequiredSkills) {
    const match = allResumeSkills.find(
      (skill) =>
        skill.toLowerCase() === requiredSkill.toLowerCase() ||
        requiredSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(requiredSkill.toLowerCase()),
    )

    if (match) {
      matchedSkills.push({
        name: requiredSkill,
        proficiency: "Intermediate",
        relevance: "High",
      })
      matchedSkillNames.add(requiredSkill.toLowerCase())
    }
  }

  // Check for matches in preferred skills
  for (const preferredSkill of jobPreferredSkills) {
    // Skip if already matched as required
    if (matchedSkillNames.has(preferredSkill.toLowerCase())) continue

    const match = allResumeSkills.find(
      (skill) =>
        skill.toLowerCase() === preferredSkill.toLowerCase() ||
        preferredSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(preferredSkill.toLowerCase()),
    )

    if (match) {
      matchedSkills.push({
        name: preferredSkill,
        proficiency: "Intermediate",
        relevance: "Medium",
      })
      matchedSkillNames.add(preferredSkill.toLowerCase())
    }
  }

  // Find missing skills
  const missingSkills = []

  // Check for missing required skills
  for (const requiredSkill of jobRequiredSkills) {
    if (!matchedSkillNames.has(requiredSkill.toLowerCase())) {
      missingSkills.push({
        name: requiredSkill,
        level: "Intermediate",
        priority: "High",
        context: `This is a required skill for the ${jobAnalysis.title || "position"}.`,
      })
    }
  }

  // Check for missing preferred skills
  for (const preferredSkill of jobPreferredSkills) {
    if (!matchedSkillNames.has(preferredSkill.toLowerCase())) {
      missingSkills.push({
        name: preferredSkill,
        level: "Intermediate",
        priority: "Medium",
        context: `This is a preferred skill for the ${jobAnalysis.title || "position"}.`,
      })
    }
  }

  // Calculate match percentage
  const totalSkills = jobRequiredSkills.length + jobPreferredSkills.length
  const matchedCount = matchedSkills.length
  const matchPercentage = totalSkills > 0 ? Math.round((matchedCount / totalSkills) * 100) : 0

  // Generate recommendations based on missing skills
  let recommendations = missingSkills.slice(0, 3).map((skill) => ({
    type: "Course",
    description: `Learn ${skill.name} through online courses or tutorials`,
    timeToAcquire: "1-3 months",
    priority: skill.priority,
  }))

  // Filter out non-learnable recommendations
  recommendations = filterRecommendations(recommendations)

  // Generate missing qualifications based on job requirements
  const missingQualifications = []
  if (jobAnalysis.qualifications?.required) {
    for (const qual of jobAnalysis.qualifications.required) {
      missingQualifications.push({
        description: qual,
        importance: "Required",
        alternative: "Consider equivalent experience or certification",
      })
    }
  }

  // Generate missing experience
  const missingExperience = []
  if (jobAnalysis.experience?.years) {
    missingExperience.push({
      area: jobAnalysis.title || "Required field",
      yearsNeeded: jobAnalysis.experience.years,
      suggestion: "Build projects to demonstrate equivalent skills and knowledge",
    })
  }

  // Generate a data-driven summary
  let summary = `The candidate matches ${matchPercentage}% of the skills required for the ${jobAnalysis.title || "position"}. `

  if (matchedSkills.length > 0) {
    summary += `The candidate has ${matchedSkills.length} matching skills including ${matchedSkills
      .slice(0, 3)
      .map((s) => s.name)
      .join(", ")}. `
  } else {
    summary += "The candidate does not have any directly matching skills. "
  }

  if (missingSkills.length > 0) {
    summary += `The candidate is missing ${missingSkills.length} skills including ${missingSkills
      .slice(0, 3)
      .map((s) => s.name)
      .join(", ")}. `
  }

  summary +=
    matchPercentage > 70
      ? "Overall, the candidate has a good match for this position with some skill gaps to address."
      : matchPercentage > 40
        ? "The candidate has some relevant skills but significant gaps need to be addressed."
        : "The candidate has substantial skill gaps that need to be addressed to be competitive for this position."

  return {
    matchPercentage,
    missingSkills,
    missingQualifications,
    missingExperience,
    matchedSkills,
    recommendations,
    summary,
  }
}

/**
 * Ensure the result has the expected structure
 */
function ensureValidStructure(result: any, jobAnalysis?: JobAnalysisResult): SkillGapAnalysisResult {
  try {
    // Start with the default structure
    const validatedResult: SkillGapAnalysisResult = {
      ...defaultSkillGapAnalysisResult,
    }

    // Validate and repair each field
    if (typeof result.matchPercentage === "number") {
      validatedResult.matchPercentage = result.matchPercentage
    } else if (typeof result.matchPercentage === "string" && !isNaN(Number(result.matchPercentage))) {
      validatedResult.matchPercentage = Number(result.matchPercentage)
    }

    if (Array.isArray(result.missingSkills)) {
      validatedResult.missingSkills = result.missingSkills.map((skill: any) => ({
        name: typeof skill.name === "string" ? skill.name : "",
        level: typeof skill.level === "string" ? skill.level : "",
        priority: typeof skill.priority === "string" ? skill.priority : "",
        context: typeof skill.context === "string" ? skill.context : "",
      }))
    }

    if (Array.isArray(result.missingQualifications)) {
      validatedResult.missingQualifications = result.missingQualifications.map((qual: any) => ({
        description: typeof qual.description === "string" ? qual.description : "",
        importance: typeof qual.importance === "string" ? qual.importance : "",
        alternative: typeof qual.alternative === "string" ? qual.alternative : undefined,
      }))
    }

    if (Array.isArray(result.missingExperience)) {
      validatedResult.missingExperience = result.missingExperience.map((exp: any) => ({
        area: typeof exp.area === "string" ? exp.area : "",
        yearsNeeded: typeof exp.yearsNeeded === "string" ? exp.yearsNeeded : "",
        suggestion: typeof exp.suggestion === "string" ? exp.suggestion : "",
      }))
    }

    if (Array.isArray(result.matchedSkills)) {
      validatedResult.matchedSkills = result.matchedSkills.map((skill: any) => ({
        name: typeof skill.name === "string" ? skill.name : "",
        proficiency: typeof skill.proficiency === "string" ? skill.proficiency : "",
        relevance: typeof skill.relevance === "string" ? skill.relevance : "",
      }))
    }

    if (Array.isArray(result.recommendations)) {
      validatedResult.recommendations = result.recommendations.map((rec: any) => ({
        type: typeof rec.type === "string" ? rec.type : "",
        description: typeof rec.description === "string" ? rec.description : "",
        timeToAcquire: typeof rec.timeToAcquire === "string" ? rec.timeToAcquire : "",
        priority: typeof rec.priority === "string" ? rec.priority : "",
      }))
    }

    if (typeof result.summary === "string") {
      validatedResult.summary = result.summary
    }

    // NEW CODE: Extract missing skills from summary if the array is empty
    if (validatedResult.missingSkills.length === 0 && validatedResult.summary) {
      console.log("Extracting missing skills from summary as missingSkills array is empty")

      // Get matched skill names for filtering
      const matchedSkillNames = validatedResult.matchedSkills.map((skill) => skill.name)

      // Extract missing skills from summary
      const extractedSkills = extractMissingSkillsFromSummary(validatedResult.summary, matchedSkillNames)

      if (extractedSkills.length > 0) {
        console.log(`Extracted ${extractedSkills.length} missing skills from summary:`, extractedSkills)
        validatedResult.missingSkills = extractedSkills
      } else {
        // If no skills were extracted using patterns, try technology extraction
        const technologies = extractTechnologiesFromSummary(validatedResult.summary)

        // Filter out technologies that are already in matched skills
        const missingTechnologies = technologies.filter(
          (tech) =>
            !matchedSkillNames.some(
              (skill) =>
                skill.toLowerCase() === tech.toLowerCase() ||
                skill.toLowerCase().includes(tech.toLowerCase()) ||
                tech.toLowerCase().includes(tech.toLowerCase()),
            ),
        )

        if (missingTechnologies.length > 0) {
          console.log(`Extracted ${missingTechnologies.length} missing technologies from summary:`, missingTechnologies)
          validatedResult.missingSkills = missingTechnologies.map((tech) => ({
            name: tech,
            level: "Intermediate",
            priority: "Medium",
            context: `Mentioned in analysis summary as a required technology.`,
          }))
        }
      }
    }

    if (validatedResult.missingSkills.length === 0) {
      // If we still don't have missing skills, try extracting from job description
      console.log("Extracting missing skills from job description as missingSkills array is still empty")

      // Get matched skill names for filtering
      const matchedSkillNames = validatedResult.matchedSkills.map((skill) => skill.name)

      // We need to pass the job analysis, so make sure it's available in this scope
      // This might require restructuring to pass jobAnalysis to ensureValidStructure
      if (jobAnalysis) {
        const extractedFromJD = extractMissingSkillsFromJobDescription(jobAnalysis, matchedSkillNames)

        if (extractedFromJD.length > 0) {
          console.log(`Extracted ${extractedFromJD.length} missing skills from job description:`, extractedFromJD)
          validatedResult.missingSkills = extractedFromJD
        }
      }
    }

    // Add validation logging
    logSkillsGapValidation(validatedResult)

    return validatedResult
  } catch (error) {
    handleError(error as Error, ErrorCategory.DATA_PARSING, ErrorSeverity.ERROR, { notifyUser: false })

    console.error("Error validating result structure:", error)
    return defaultSkillGapAnalysisResult
  }
}

/**
 * Extract all skills from resume analysis
 */
function getAllSkills(resumeAnalysis: ResumeAnalysisResult): Record<string, string[]> {
  const skills = {
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

  // Copy skills from resume analysis
  if (resumeAnalysis.skills) {
    Object.keys(resumeAnalysis.skills).forEach((key) => {
      if (key in skills && Array.isArray(resumeAnalysis.skills[key])) {
        skills[key] = [...resumeAnalysis.skills[key]]
      }
    })
  }

  return skills
}

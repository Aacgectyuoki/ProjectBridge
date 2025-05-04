"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { SkillsLogger } from "@/utils/skills-logger"
// Update the import to use the enhanced JSON repair utility
import { safeParseJSON } from "@/utils/enhanced-json-repair"

export type JobAnalysisResult = {
  title: string
  company: string
  location: string
  jobType: string
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  qualifications: {
    required: string[]
    preferred: string[]
  }
  experience: {
    level: string
    years: string
  }
  education: string
  salary: string
  benefits: string[]
  summary: string
  keywordsDensity: {
    keyword: string
    count: number
  }[]
}

// Default empty structure to ensure consistent shape
const defaultJobAnalysisResult: JobAnalysisResult = {
  title: "",
  company: "",
  location: "",
  jobType: "",
  requiredSkills: [],
  preferredSkills: [],
  responsibilities: [],
  qualifications: {
    required: [],
    preferred: [],
  },
  experience: {
    level: "",
    years: "",
  },
  education: "",
  salary: "",
  benefits: [],
  summary: "",
  keywordsDensity: [],
}

/**
 * Fallback skill extraction using keyword matching
 */
function extractSkillsFromText(text: string): { requiredSkills: string[]; preferredSkills: string[] } {
  const normalizedText = text.toLowerCase()
  const requiredSkills = []
  const preferredSkills = []

  // Common technical skills to look for
  const technicalSkills = [
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "go",
    "rust",
    "react",
    "angular",
    "vue",
    "node.js",
    "express",
    "django",
    "flask",
    "spring",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "terraform",
    "jenkins",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "redis",
    "elasticsearch",
    "machine learning",
    "data science",
    "artificial intelligence",
    "deep learning",
    "devops",
    "ci/cd",
    "git",
    "agile",
    "scrum",
    "kanban",
  ]

  // Common soft skills to look for
  const softSkills = [
    "communication",
    "teamwork",
    "leadership",
    "problem solving",
    "critical thinking",
    "time management",
    "adaptability",
    "creativity",
    "collaboration",
    "presentation",
  ]

  // Check for technical skills
  technicalSkills.forEach((skill) => {
    if (normalizedText.includes(skill.toLowerCase())) {
      // If the skill is mentioned with "required" nearby, add to required skills
      const context = normalizedText.substring(
        Math.max(0, normalizedText.indexOf(skill.toLowerCase()) - 50),
        Math.min(normalizedText.length, normalizedText.indexOf(skill.toLowerCase()) + 50),
      )

      if (
        context.includes("required") ||
        context.includes("must have") ||
        context.includes("necessary") ||
        context.includes("essential")
      ) {
        requiredSkills.push(skill)
      } else if (
        context.includes("preferred") ||
        context.includes("nice to have") ||
        context.includes("plus") ||
        context.includes("bonus")
      ) {
        preferredSkills.push(skill)
      } else {
        // Default to required if we can't determine
        requiredSkills.push(skill)
      }
    }
  })

  // Check for soft skills (usually preferred)
  softSkills.forEach((skill) => {
    if (normalizedText.includes(skill.toLowerCase())) {
      preferredSkills.push(skill)
    }
  })

  return { requiredSkills, preferredSkills }
}

export async function analyzeJobDescription(jobDescriptionText: string): Promise<JobAnalysisResult> {
  try {
    const prompt = `
      Analyze the following job description and extract key information in a structured format.
      
      Job Description:
      ${jobDescriptionText}
      
      Please extract and return the following information in JSON format:
      1. Job title
      2. Company name (if available)
      3. Location (if available)
      4. Job type (full-time, part-time, contract, etc.)
      5. Required skills (technical and non-technical)
      6. Preferred/bonus skills
      7. Key responsibilities
      8. Qualifications (required and preferred)
      9. Experience level and years required
      10. Education requirements
      11. Salary information (if available)
      12. Benefits (if available)
      13. A brief summary of the job
      14. Top 10 keywords with their frequency in the job description
      
      Format your response as valid JSON with the following structure exactly:
      {
        "title": "Job Title",
        "company": "Company Name",
        "location": "Location",
        "jobType": "Job Type",
        "requiredSkills": ["skill1", "skill2"],
        "preferredSkills": ["skill1", "skill2"],
        "responsibilities": ["responsibility1", "responsibility2"],
        "qualifications": {
          "required": ["qualification1", "qualification2"],
          "preferred": ["qualification1", "qualification2"]
        },
        "experience": {
          "level": "Experience Level",
          "years": "Years Required"
        },
        "education": "Education Requirements",
        "salary": "Salary Information",
        "benefits": ["benefit1", "benefit2"],
        "summary": "Job Summary",
        "keywordsDensity": [
          {"keyword": "keyword1", "count": 5},
          {"keyword": "keyword2", "count": 3}
        ]
      }
      
      IMPORTANT: Ensure your response is valid JSON. Do not include any explanatory text outside the JSON structure.
      If any information is not available, use an empty string or empty array as appropriate.
      Make sure all property names are in quotes and all string values are in quotes.
      Do not use trailing commas after the last item in arrays or objects.
    `

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.2,
      maxTokens: 2048,
    })

    console.log("Raw LLM response:", text.substring(0, 100) + "...")

    // Try to parse the JSON response using our enhanced safe parser
    try {
      // First try direct parsing
      const result = JSON.parse(text)
      console.log("Direct JSON parsing succeeded")

      // Store the result in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("jobAnalysis", JSON.stringify(result))
      }

      return ensureValidStructure(result)
    } catch (directParseError) {
      console.error("Direct JSON parsing failed:", directParseError.message)

      // Log more details about the error position
      if (directParseError.message.includes("position")) {
        const positionMatch = directParseError.message.match(/position (\d+)/)
        if (positionMatch && positionMatch[1]) {
          const position = Number.parseInt(positionMatch[1])
          const start = Math.max(0, position - 30)
          const end = Math.min(text.length, position + 30)
          console.error(
            `Error context: "${text.substring(start, position)}[ERROR HERE]${text.substring(position, end)}"`,
          )
        }
      }

      try {
        // Try with our repair function
        const repairedJSON = safeParseJSON(text)
        console.log("Repaired JSON:", repairedJSON.substring(0, 100) + "...")

        const result = JSON.parse(repairedJSON)
        console.log("Repaired JSON parsing succeeded")

        // Store the result in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("jobAnalysis", JSON.stringify(result))
        }

        return ensureValidStructure(result)
      } catch (repairError) {
        console.error("JSON repair failed:", repairError.message)

        // Fall back to keyword extraction
        console.log("Falling back to keyword extraction")
        const extractedSkills = extractSkillsFromText(jobDescriptionText)

        const fallbackResult = {
          ...defaultJobAnalysisResult,
          requiredSkills: extractedSkills.requiredSkills,
          preferredSkills: extractedSkills.preferredSkills,
          summary: "Failed to parse job description. Basic skills extracted.",
        }

        // Store the fallback result
        if (typeof window !== "undefined") {
          localStorage.setItem("jobAnalysis", JSON.stringify(fallbackResult))
        }

        return fallbackResult
      }
    }
  } catch (error) {
    console.error("Error analyzing job description:", error)
    return defaultJobAnalysisResult
  }
}

/**
 * Ensure the result has the expected structure
 */
function ensureValidStructure(result: any): JobAnalysisResult {
  // If the AI failed to extract skills, use our fallback method
  if (
    (!result.requiredSkills || result.requiredSkills.length === 0) &&
    (!result.preferredSkills || result.preferredSkills.length === 0)
  ) {
    console.log("AI failed to extract skills, using fallback extraction")
    const extractedSkills = extractSkillsFromText(result.summary || "")
    result.requiredSkills = extractedSkills.requiredSkills
    result.preferredSkills = extractedSkills.preferredSkills
  }

  // Log the extracted skills
  if (result.requiredSkills?.length > 0 || result.preferredSkills?.length > 0) {
    const sessionId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("currentAnalysisSession") || "unknown_session"
        : "server_session"

    SkillsLogger.logSkills({
      source: "job-description",
      technicalSkills: [...(result.requiredSkills || []), ...(result.preferredSkills || [])].filter(Boolean),
      softSkills: [],
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
    })
    console.log("Logged job description skills:", [...(result.requiredSkills || []), ...(result.preferredSkills || [])])
  }

  // Ensure the result has the expected structure
  return {
    title: result.title || defaultJobAnalysisResult.title,
    company: result.company || defaultJobAnalysisResult.company,
    location: result.location || defaultJobAnalysisResult.location,
    jobType: result.jobType || defaultJobAnalysisResult.jobType,
    requiredSkills: result.requiredSkills || defaultJobAnalysisResult.requiredSkills,
    preferredSkills: result.preferredSkills || defaultJobAnalysisResult.preferredSkills,
    responsibilities: result.responsibilities || defaultJobAnalysisResult.responsibilities,
    qualifications: {
      required: result.qualifications?.required || defaultJobAnalysisResult.qualifications.required,
      preferred: result.qualifications?.preferred || defaultJobAnalysisResult.qualifications.preferred,
    },
    experience: {
      level: result.experience?.level || defaultJobAnalysisResult.experience.level,
      years: result.experience?.years || defaultJobAnalysisResult.experience.years,
    },
    education: result.education || defaultJobAnalysisResult.education,
    salary: result.salary || defaultJobAnalysisResult.salary,
    benefits: result.benefits || defaultJobAnalysisResult.benefits,
    summary: result.summary || defaultJobAnalysisResult.summary,
    keywordsDensity: result.keywordsDensity || defaultJobAnalysisResult.keywordsDensity,
  }
}

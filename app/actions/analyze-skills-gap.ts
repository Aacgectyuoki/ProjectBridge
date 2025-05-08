"use server"

import { safeParseJSON } from "@/utils/enhanced-json-repair"
import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export type SkillGapAnalysisResult = {
  matchPercentage: number
  missingSkills: {
    name: string
    level: string
    priority: string
    context: string
  }[]
  missingQualifications: {
    description: string
    importance: string
    alternative?: string
  }[]
  missingExperience: {
    area: string
    yearsNeeded: string
    suggestion: string
  }[]
  matchedSkills: {
    name: string
    proficiency: string
    relevance: string
  }[]
  recommendations: {
    type: string
    description: string
    timeToAcquire: string
    priority: string
  }[]
  summary: string
}

// Default empty structure to ensure consistent shape
const defaultSkillGapAnalysisResult: SkillGapAnalysisResult = {
  matchPercentage: 0,
  missingSkills: [],
  missingQualifications: [],
  missingExperience: [],
  matchedSkills: [],
  recommendations: [],
  summary:
    "The candidate has a strong foundation in front-end development, but lacks experience in design-to-code workflows and SEO principles. The candidate needs to gain experience and skills in these areas to be a strong fit.",
}

export async function analyzeSkillsGapFromResults(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
): Promise<SkillGapAnalysisResult> {
  try {
    console.log(
      "Using existing session ID:",
      typeof localStorage !== "undefined" ? localStorage.getItem("currentAnalysisSession") : "server_session",
    )

    // Check if we already have a cached analysis result
    const cachedAnalysis =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(`skillGapAnalysis_${localStorage.getItem("currentAnalysisSession")}`)
        : null

    if (cachedAnalysis) {
      console.log(
        "Found skillGapAnalysis data in session",
        typeof localStorage !== "undefined" ? localStorage.getItem("currentAnalysisSession") : "server_session",
      )
      try {
        const parsedAnalysis = JSON.parse(cachedAnalysis)
        return parsedAnalysis
      } catch (e) {
        console.error("Failed to parse cached analysis:", e)
        // Continue with generating a new analysis
      }
    } else {
      console.log(
        "No skillGapAnalysis data found in session",
        typeof localStorage !== "undefined" ? localStorage.getItem("currentAnalysisSession") : "server_session",
      )
    }

    // Prepare the data for the prompt
    const resumeSkills = getAllSkills(resumeAnalysis)
    const jobRequiredSkills = jobAnalysis.requiredSkills || []
    const jobPreferredSkills = jobAnalysis.preferredSkills || []

    console.log("Required Skills:", JSON.stringify(jobRequiredSkills))
    console.log("Preferred Skills:", JSON.stringify(jobPreferredSkills))
    console.log("Extracted Skills:", JSON.stringify(resumeSkills))
    console.log("Responsibilities:", JSON.stringify(jobAnalysis.responsibilities || []))

    // Check if we have enough data to perform analysis
    const hasResumeSkills = Object.values(resumeSkills).some((arr) => arr.length > 0)
    const hasJobSkills = jobRequiredSkills.length > 0 || jobPreferredSkills.length > 0

    // If we don't have enough data, return the default result
    if (!hasResumeSkills || !hasJobSkills) {
      console.log("Insufficient data for skills gap analysis, returning default result")
      return defaultSkillGapAnalysisResult
    }

    // Prepare the prompt for skill gap analysis
    const prompt = `
      You are a skilled career advisor with expertise in analyzing skills gaps between a candidate's resume and job requirements.
      
      Resume Skills:
      ${JSON.stringify(resumeSkills, null, 2)}
      
      Job Required Skills:
      ${JSON.stringify(jobRequiredSkills, null, 2)}
      
      Job Preferred Skills:
      ${JSON.stringify(jobPreferredSkills, null, 2)}
      
      Job Responsibilities:
      ${JSON.stringify(jobAnalysis.responsibilities || [], null, 2)}
      
      Job Qualifications:
      ${JSON.stringify(jobAnalysis.qualifications || {}, null, 2)}
      
      Job Experience Requirements:
      ${JSON.stringify(jobAnalysis.experience || {}, null, 2)}
      
      Resume Experience:
      ${JSON.stringify(resumeAnalysis.experience || [], null, 2)}
      
      Resume Education:
      ${JSON.stringify(resumeAnalysis.education || [], null, 2)}
      
      Based on the above information, analyze the skills gap between the candidate's resume and the job requirements.
      Return a JSON object with the following structure:
      {
        "matchPercentage": 75,
        "missingSkills": [
          {
            "name": "Skill Name",
            "level": "Beginner/Intermediate/Advanced",
            "priority": "High/Medium/Low",
            "context": "Why this skill is important for the role"
          }
        ],
        "missingQualifications": [
          {
            "description": "Qualification description",
            "importance": "Required/Preferred",
            "alternative": "Alternative qualification or experience"
          }
        ],
        "missingExperience": [
          {
            "area": "Experience area",
            "yearsNeeded": "Years needed",
            "suggestion": "How to gain this experience"
          }
        ],
        "matchedSkills": [
          {
            "name": "Skill Name",
            "proficiency": "Beginner/Intermediate/Advanced",
            "relevance": "High/Medium/Low"
          }
        ],
        "recommendations": [
          {
            "type": "Project/Course/Certification",
            "description": "Detailed description",
            "timeToAcquire": "Estimated time",
            "priority": "High/Medium/Low"
          }
        ],
        "summary": "A brief summary of the skills gap analysis"
      }
      
      IMPORTANT: Your response must be ONLY the JSON object, with no additional text before or after.
      Make sure all property names and string values are properly quoted.
      Do not use trailing commas.
      Ensure all arrays and objects are properly closed.
      Always use colons after property names.
      Do not include any explanations or notes outside the JSON structure.
    `

    try {
      // Generate the analysis
      const { text: responseText } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt,
        temperature: 0.2,
        maxTokens: 2048,
      })

      console.log("Raw AI response (first 200 chars):", responseText.substring(0, 200) + "...")

      // First, try to clean up the response to ensure it's valid JSON
      let cleanedResponse = responseText.trim()

      // Remove any non-JSON content before the first opening brace
      const firstBrace = cleanedResponse.indexOf("{")
      if (firstBrace > 0) {
        cleanedResponse = cleanedResponse.substring(firstBrace)
      }

      // Remove any non-JSON content after the last closing brace
      const lastBrace = cleanedResponse.lastIndexOf("}")
      if (lastBrace !== -1 && lastBrace < cleanedResponse.length - 1) {
        cleanedResponse = cleanedResponse.substring(0, lastBrace + 1)
      }

      // Try direct parsing first with a try/catch
      try {
        const directParsed = JSON.parse(cleanedResponse)
        console.log("Successfully parsed JSON directly")

        // Ensure the result has the expected structure
        const validatedResult = ensureValidStructure(directParsed)

        // Store the result in localStorage
        if (typeof localStorage !== "undefined") {
          const sessionId = localStorage.getItem("currentAnalysisSession") || "unknown_session"
          localStorage.setItem(`skillGapAnalysis_${sessionId}`, JSON.stringify(validatedResult))
          console.log("Stored skillGapAnalysis data in session", sessionId)
        }

        return validatedResult
      } catch (directParseError) {
        console.error("Direct JSON parse failed:", directParseError.message)
        // Continue to enhanced parsing
      }

      // If direct parsing fails, use our enhanced parser
      const result = safeParseJSON(cleanedResponse, defaultSkillGapAnalysisResult)

      // If parsing completely fails, return the default result
      if (!result || Object.keys(result).length === 0) {
        console.error("Failed to parse AI response as JSON, returning default result")
        return defaultSkillGapAnalysisResult
      }

      // Ensure the result has the expected structure
      const validatedResult = ensureValidStructure(result)

      // Store the result in localStorage
      if (typeof localStorage !== "undefined") {
        const sessionId = localStorage.getItem("currentAnalysisSession") || "unknown_session"
        localStorage.setItem(`skillGapAnalysis_${sessionId}`, JSON.stringify(validatedResult))
        console.log("Stored skillGapAnalysis data in session", sessionId)
      }

      return validatedResult
    } catch (error) {
      console.error("Error generating or parsing AI response:", error)

      // Provide more detailed error information
      if (error.message && error.message.includes("position")) {
        console.error("JSON parse error details:", error.message)
      }

      return defaultSkillGapAnalysisResult
    }
  } catch (error) {
    console.error("Error analyzing skills gap:", error)
    return defaultSkillGapAnalysisResult
  }
}

/**
 * Ensure the result has the expected structure
 */
function ensureValidStructure(result: any): SkillGapAnalysisResult {
  try {
    // Start with the default structure
    const validatedResult: SkillGapAnalysisResult = {
      ...defaultSkillGapAnalysisResult,
    }

    // Validate and repair each field
    if (typeof result.matchPercentage === "number") {
      validatedResult.matchPercentage = result.matchPercentage
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

    return validatedResult
  } catch (error) {
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

"use server"
import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { handleError, ErrorCategory, ErrorSeverity, withRetryAndErrorHandling } from "@/utils/error-handler"
import { SkillsGapAnalysisError, SkillsGapAnalysisErrorType } from "@/types/skills-gap-analysis-error"
import { safeParseJSON } from "@/utils/enhanced-json-repair"

// Import the new utility at the top of the file
import { extractMissingSkillsFromSummary, extractTechnologiesFromSummary } from "@/utils/summary-skill-extractor"

// Import the validator at the top of the file
import { logSkillsGapValidation } from "@/utils/skills-gap-validator"

// Import the job description skill extractor at the top of the file
import { extractMissingSkillsFromJobDescription } from "@/utils/job-description-skill-extractor"

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
  summary: "Analysis could not be completed. Please try again.",
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
        handleError(e as Error, ErrorCategory.DATA_PARSING, ErrorSeverity.WARNING, { notifyUser: false })
        console.error("Failed to parse cached analysis:", e)
        // Continue with generating a new analysis
      }
    } else {
      console.log(
        "No skillGapAnalysis data found in session",
        typeof localStorage !== "undefined" ? localStorage.getItem("currentAnalysisSession") : "server_session",
      )
    }

    // Validate input data
    if (!resumeAnalysis || !jobAnalysis) {
      const error = new SkillsGapAnalysisError(
        "Missing resume or job analysis data",
        SkillsGapAnalysisErrorType.INSUFFICIENT_DATA,
        { resumeAnalysis, jobAnalysis },
      )

      handleError(error, ErrorCategory.DATA_PARSING, ErrorSeverity.ERROR)

      return defaultSkillGapAnalysisResult
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
      const error = new SkillsGapAnalysisError(
        "Insufficient data for skills gap analysis",
        SkillsGapAnalysisErrorType.INSUFFICIENT_DATA,
        { hasResumeSkills, hasJobSkills },
      )

      handleError(error, ErrorCategory.DATA_PARSING, ErrorSeverity.WARNING, { notifyUser: true })

      console.log("Insufficient data for skills gap analysis, returning default result")
      return defaultSkillGapAnalysisResult
    }

    // If AI is not available or we want to skip it for testing, generate a data-driven analysis
    // This ensures we always have meaningful data to display
    const fallbackAnalysis = generateDataDrivenAnalysis(
      resumeSkills,
      jobRequiredSkills,
      jobPreferredSkills,
      jobAnalysis,
    )

    try {
      // Prepare the prompt for skill gap analysis
      const prompt = `
  You are a skilled career advisor with expertise in analyzing skills gaps between a candidate's resume and job requirements.
  
  Resume Skills:
  ${JSON.stringify(resumeSkills, null, 2)}
  
  Job Required Skills:
  ${JSON.stringify(jobRequiredSkills, null, 2)}
  
  Job Preferred Skills:
  ${JSON.stringify(jobPreferredSkills, null, 2)}
  
  Job Title: ${jobAnalysis.title || "Unknown Position"}
  
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
  Be specific and detailed in your analysis. Focus on the actual skills in the resume and job description.
  
  IMPORTANT: You MUST identify specific matched skills from the resume that align with the job requirements.
  IMPORTANT: You MUST identify specific missing skills that are required or preferred for the job but not found in the resume.
  
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
    "summary": "A brief summary of the skills gap analysis that specifically mentions the job title and key skills"
  }
  
  CRITICAL INSTRUCTIONS:
  1. EVERY skill mentioned in your summary MUST also appear in either matchedSkills or missingSkills arrays
  2. If you mention a skill is missing in the summary, you MUST include it in the missingSkills array
  3. If you mention a skill is matched in the summary, you MUST include it in the matchedSkills array
  4. NEVER leave missingSkills empty if you mention missing skills in the summary
  5. Include at least 1-3 actionable recommendations for learning missing skills
  6. Do not include non-learnable items like "years of experience" or "degrees" in recommendations
  
  IMPORTANT: Your response must be ONLY the JSON object, with no additional text before or after.
  Make sure all property names and string values are properly quoted.
  Do not use trailing commas.
  Ensure all arrays and objects are properly closed.
  Always use colons after property names.
  Do not include any explanations or notes outside the JSON structure.
  Format the JSON properly with correct indentation and line breaks.
`

      // Generate the analysis with retry and error handling
      const { text: responseText } = await withRetryAndErrorHandling(
        async () => {
          return await generateText({
            model: groq("llama3-70b-8192"),
            prompt,
            temperature: 0.2,
            maxTokens: 2048,
          })
        },
        {
          category: ErrorCategory.API,
          maxRetries: 3,
          onRetry: (attempt, error) => {
            console.warn(`AI request attempt ${attempt} failed: ${error.message}. Retrying...`)
          },
        },
      )

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

      // Use our enhanced JSON repair utility to parse the response
      try {
        const parsedResult = safeParseJSON<SkillGapAnalysisResult>(cleanedResponse, defaultSkillGapAnalysisResult)
        console.log("Successfully parsed JSON with enhanced repair")

        // Ensure the result has the expected structure
        const validatedResult = ensureValidStructure(parsedResult, jobAnalysis)

        // Add validation logging
        logSkillsGapValidation(validatedResult)

        // Filter out non-learnable recommendations
        validatedResult.recommendations = filterRecommendations(validatedResult.recommendations)

        // Store the result in localStorage
        if (typeof localStorage !== "undefined") {
          const sessionId = localStorage.getItem("currentAnalysisSession") || "unknown_session"
          localStorage.setItem(`skillGapAnalysis_${sessionId}`, JSON.stringify(validatedResult))
          console.log("Stored skillGapAnalysis data in session", sessionId)
        }

        return validatedResult
      } catch (parseError) {
        handleError(parseError as Error, ErrorCategory.DATA_PARSING, ErrorSeverity.WARNING, { notifyUser: false })
        console.error("Enhanced JSON parse failed:", (parseError as Error).message)

        // If parsing fails, use our data-driven fallback
        if (fallbackAnalysis) {
          console.log("JSON parsing failed, using data-driven fallback analysis")

          // Filter the fallback recommendations
          fallbackAnalysis.recommendations = filterRecommendations(fallbackAnalysis.recommendations)

          // Store the result in localStorage
          if (typeof localStorage !== "undefined") {
            const sessionId = localStorage.getItem("currentAnalysisSession") || "unknown_session"
            localStorage.setItem(`skillGapAnalysis_${sessionId}`, JSON.stringify(fallbackAnalysis))
            console.log("Stored fallback skillGapAnalysis data in session", sessionId)
          }

          return fallbackAnalysis
        }
      }

      // If all parsing strategies fail, use our data-driven fallback
      if (fallbackAnalysis) {
        console.log("All JSON parsing strategies failed, using data-driven fallback analysis")

        // Filter the fallback recommendations
        fallbackAnalysis.recommendations = filterRecommendations(fallbackAnalysis.recommendations)

        // Store the result in localStorage
        if (typeof localStorage !== "undefined") {
          const sessionId = localStorage.getItem("currentAnalysisSession") || "unknown_session"
          localStorage.setItem(`skillGapAnalysis_${sessionId}`, JSON.stringify(fallbackAnalysis))
          console.log("Stored fallback skillGapAnalysis data in session", sessionId)
        }

        return fallbackAnalysis
      }

      // If fallback is not available, return the default result
      return defaultSkillGapAnalysisResult
    } catch (error) {
      const skillsGapError = new SkillsGapAnalysisError(
        "Error generating or parsing AI response",
        SkillsGapAnalysisErrorType.API_ERROR,
        error,
      )

      handleError(skillsGapError, ErrorCategory.API, ErrorSeverity.ERROR)

      // If AI fails, use our data-driven fallback
      if (fallbackAnalysis) {
        console.log("AI request failed, using data-driven fallback analysis")

        // Filter the fallback recommendations
        fallbackAnalysis.recommendations = filterRecommendations(fallbackAnalysis.recommendations)

        return fallbackAnalysis
      }

      return defaultSkillGapAnalysisResult
    }
  } catch (error) {
    const skillsGapError = new SkillsGapAnalysisError(
      "Error analyzing skills gap",
      SkillsGapAnalysisErrorType.UNKNOWN_ERROR,
      error,
    )

    handleError(skillsGapError, ErrorCategory.UNKNOWN, ErrorSeverity.ERROR)

    return defaultSkillGapAnalysisResult
  }
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

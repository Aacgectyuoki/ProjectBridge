"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"
import { withRetry } from "@/utils/api-rate-limit-handler"

export type SkillGapAnalysisResult = {
  matchPercentage: number
  missingSkills: {
    name: string
    level: string
    priority: "High" | "Medium" | "Low"
    context: string
  }[]
  missingQualifications: {
    description: string
    importance: "Required" | "Preferred"
    alternative: string
  }[]
  missingExperience: {
    area: string
    yearsNeeded: string
    suggestion: string
  }[]
  matchedSkills: {
    name: string
    proficiency: string
    relevance: "High" | "Medium" | "Low"
  }[]
  recommendations: {
    type: "Project" | "Course" | "Certification" | "Experience"
    description: string
    timeToAcquire: string
    priority: "High" | "Medium" | "Low"
  }[]
  summary: string
}

export async function analyzeSkillsGap(resumeText: string, jobDescription: string): Promise<SkillGapAnalysisResult> {
  try {
    const prompt = `
      You are an expert career advisor and skills analyst. Your task is to analyze a resume and a job description, 
      then identify the gaps between the candidate's qualifications and the job requirements.
      
      # RESUME:
      ${resumeText}
      
      # JOB DESCRIPTION:
      ${jobDescription}
      
      Perform a detailed analysis to identify:
      1. Skills mentioned in the job description that are missing from the resume
      2. Qualifications required by the job that the candidate doesn't have
      3. Experience requirements that the candidate doesn't meet
      4. Skills the candidate has that match the job requirements
      5. Specific recommendations to bridge the identified gaps
      
      For each missing skill, determine its priority (High/Medium/Low) based on:
      - How frequently it's mentioned in the job description
      - Whether it's listed as required or preferred
      - Its placement in the job description (skills mentioned early are often more important)
      
      For each recommendation, suggest specific actions the candidate can take to acquire the missing skills or qualifications.
      
      Calculate an overall match percentage based on how well the candidate's profile matches the job requirements.
      
      Format your response as valid JSON with the following structure exactly:
      {
        "matchPercentage": number,
        "missingSkills": [
          {
            "name": "Skill Name",
            "level": "Required proficiency level",
            "priority": "High/Medium/Low",
            "context": "How this skill is used in the job"
          }
        ],
        "missingQualifications": [
          {
            "description": "Description of the qualification",
            "importance": "Required/Preferred",
            "alternative": "Possible alternative qualification the candidate might have"
          }
        ],
        "missingExperience": [
          {
            "area": "Experience area",
            "yearsNeeded": "Years of experience needed",
            "suggestion": "How to gain this experience"
          }
        ],
        "matchedSkills": [
          {
            "name": "Skill Name",
            "proficiency": "Candidate's proficiency level",
            "relevance": "High/Medium/Low"
          }
        ],
        "recommendations": [
          {
            "type": "Project/Course/Certification/Experience",
            "description": "Detailed description of the recommendation",
            "timeToAcquire": "Estimated time to acquire this skill",
            "priority": "High/Medium/Low"
          }
        ],
        "summary": "A concise summary of the overall analysis and key recommendations"
      }
      
      Return only the JSON without any additional text or explanation.
    `

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.2,
      maxTokens: 3000,
    })

    // Parse the JSON response
    try {
      // First, try to parse the raw response
      let result: SkillGapAnalysisResult

      try {
        result = JSON.parse(text) as SkillGapAnalysisResult
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]) as SkillGapAnalysisResult
        } else {
          throw new Error("Could not extract valid JSON from response")
        }
      }

      return result
    } catch (parseError) {
      console.error("Error parsing Groq response:", parseError)
      console.error("Raw response:", text)
      throw new Error("Failed to parse the analysis result")
    }
  } catch (error) {
    console.error("Error analyzing skills gap:", error)
    throw error
  }
}

// Alternative method that takes the already analyzed results
export async function analyzeSkillsGapFromResults(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
): Promise<SkillGapAnalysisResult> {
  // Check if we have a cached result
  const cacheKey = `skillGap_${JSON.stringify(resumeAnalysis.skills)}_${JSON.stringify(jobAnalysis.requiredSkills)}`

  try {
    // Try to get from cache first (if in browser environment)
    if (typeof window !== "undefined") {
      const cachedResult = localStorage.getItem(cacheKey)
      if (cachedResult) {
        try {
          return JSON.parse(cachedResult) as SkillGapAnalysisResult
        } catch (e) {
          console.warn("Failed to parse cached result", e)
          // Continue with API call if parsing fails
        }
      }
    }

    // If no cache or not in browser, try the API with fallback models
    const models = [
      "llama3-70b-8192", // First choice
      "llama3-8b-8192", // Fallback option 1 (smaller model)
      "mixtral-8x7b-32768", // Fallback option 2
    ]

    let lastError: Error | null = null

    // Try each model in sequence
    for (const model of models) {
      try {
        const prompt = `
          You are an expert career advisor and skills analyst. Your task is to analyze the parsed data from a resume and a job description, 
          then identify the gaps between the candidate's qualifications and the job requirements.
          
          # RESUME ANALYSIS:
          ${JSON.stringify(resumeAnalysis, null, 2)}
          
          # JOB DESCRIPTION ANALYSIS:
          ${JSON.stringify(jobAnalysis, null, 2)}
          
          Perform a detailed analysis to identify:
          1. Skills mentioned in the job description that are missing from the resume
          2. Qualifications required by the job that the candidate doesn't have
          3. Experience requirements that the candidate doesn't meet
          4. Skills the candidate has that match the job requirements
          5. Specific recommendations to bridge the identified gaps
          
          For each missing skill, determine its priority (High/Medium/Low) based on:
          - How frequently it's mentioned in the job description
          - Whether it's listed as required or preferred
          - Its placement in the job description (skills mentioned early are often more important)
          
          For each recommendation, suggest specific actions the candidate can take to acquire the missing skills or qualifications.
          
          Calculate an overall match percentage based on how well the candidate's profile matches the job requirements.
          
          Format your response as valid JSON with the following structure exactly:
          {
            "matchPercentage": number,
            "missingSkills": [
              {
                "name": "Skill Name",
                "level": "Required proficiency level",
                "priority": "High/Medium/Low",
                "context": "How this skill is used in the job"
              }
            ],
            "missingQualifications": [
              {
                "description": "Description of the qualification",
                "importance": "Required/Preferred",
                "alternative": "Possible alternative qualification the candidate might have"
              }
            ],
            "missingExperience": [
              {
                "area": "Experience area",
                "yearsNeeded": "Years of experience needed",
                "suggestion": "How to gain this experience"
              }
            ],
            "matchedSkills": [
              {
                "name": "Skill Name",
                "proficiency": "Candidate's proficiency level",
                "relevance": "High/Medium/Low"
              }
            ],
            "recommendations": [
              {
                "type": "Project/Course/Certification/Experience",
                "description": "Detailed description of the recommendation",
                "timeToAcquire": "Estimated time to acquire this skill",
                "priority": "High/Medium/Low"
              }
            ],
            "summary": "A concise summary of the overall analysis and key recommendations"
          }
          
          Return only the JSON without any additional text or explanation.
        `

        // Reduce token usage for smaller models
        const maxTokens = model === "llama3-70b-8192" ? 3000 : 2000

        const { text } = await withRetry(
          () =>
            generateText({
              model: groq(model),
              prompt,
              temperature: 0.2,
              maxTokens,
            }),
          {
            maxRetries: 3,
            initialDelayMs: 2000,
            maxDelayMs: 15000,
            backoffFactor: 1.5,
          },
        )

        // Parse the JSON response
        let result: SkillGapAnalysisResult

        try {
          result = JSON.parse(text) as SkillGapAnalysisResult
        } catch (parseError) {
          // If direct parsing fails, try to extract JSON from the text
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]) as SkillGapAnalysisResult
          } else {
            throw new Error("Could not extract valid JSON from response")
          }
        }

        // Cache the successful result (if in browser environment)
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result))
          } catch (e) {
            console.warn("Failed to cache result", e)
          }
        }

        return result
      } catch (error) {
        console.warn(`Error with model ${model}:`, error)
        lastError = error as Error
        // Continue to next model
      }
    }

    // If we've exhausted all models, fall back to a rule-based approach
    console.warn("All AI models failed, using rule-based fallback")
    return generateFallbackAnalysis(resumeAnalysis, jobAnalysis)
  } catch (error) {
    console.error("Error analyzing skills gap:", error)
    throw error
  }
}

// Add this new function for fallback analysis
function generateFallbackAnalysis(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
): SkillGapAnalysisResult {
  // Extract skills from resume
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

  // Extract required skills from job
  const requiredSkills = (jobAnalysis.requiredSkills || []).map((skill) => skill.toLowerCase())
  const preferredSkills = (jobAnalysis.preferredSkills || []).map((skill) => skill.toLowerCase())

  // Find missing required skills
  const missingRequiredSkills = requiredSkills.filter(
    (skill) => !resumeSkills.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill)),
  )

  // Find missing preferred skills
  const missingPreferredSkills = preferredSkills.filter(
    (skill) => !resumeSkills.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill)),
  )

  // Find matched skills
  const matchedSkills = [...requiredSkills, ...preferredSkills].filter((skill) =>
    resumeSkills.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill)),
  )

  // Calculate match percentage
  const totalJobSkills = requiredSkills.length + preferredSkills.length
  const matchPercentage = totalJobSkills > 0 ? Math.round((matchedSkills.length / totalJobSkills) * 100) : 0

  // Generate missing skills array
  const missingSkills = [
    ...missingRequiredSkills.map((skill) => ({
      name: skill,
      level: "Intermediate to Advanced",
      priority: "High" as const,
      context: `This skill is listed as required in the job description.`,
    })),
    ...missingPreferredSkills.map((skill) => ({
      name: skill,
      level: "Beginner to Intermediate",
      priority: "Medium" as const,
      context: `This skill is listed as preferred in the job description.`,
    })),
  ]

  // Generate recommendations based on missing skills
  const recommendations = missingSkills.slice(0, 5).map((skill) => ({
    type: Math.random() > 0.5 ? "Project" : ("Course" as const),
    description: `Learn ${skill.name} through ${Math.random() > 0.5 ? "practical projects" : "structured courses"}`,
    timeToAcquire: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3) + 3} months`,
    priority: skill.priority,
  }))

  return {
    matchPercentage,
    missingSkills,
    missingQualifications: [],
    missingExperience: [],
    matchedSkills: matchedSkills.map((skill) => ({
      name: skill,
      proficiency: "Demonstrated",
      relevance: "High" as const,
    })),
    recommendations,
    summary: `You match approximately ${matchPercentage}% of the job requirements. Focus on acquiring the missing required skills first, particularly ${missingRequiredSkills.slice(0, 3).join(", ")}.`,
  }
}

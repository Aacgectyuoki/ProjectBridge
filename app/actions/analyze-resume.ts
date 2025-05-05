"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { safeParseJSON } from "@/utils/enhanced-json-repair"
import { withRetry } from "@/utils/api-rate-limit-handler"

// Explicitly get the API key from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY

// Use a smaller model for less token usage
const MODEL_OPTIONS = {
  primary: "llama3-8b-8192", // Start with smaller model to avoid rate limits
  fallback: "mixtral-8x7b-32768", // Fallback to another model if rate limited
  lastResort: "llama3-70b-8192", // Last resort model
}

export type ResumeAnalysisResult = {
  skills: {
    technical: string[]
    soft?: string[]
    tools?: string[]
    frameworks?: string[]
    languages?: string[]
    databases?: string[]
    methodologies?: string[]
    platforms?: string[]
    other?: string[]
  }
  experience: {
    title: string
    company: string
    duration: string
    description: string
    keyAchievements?: string[]
  }[]
  education: {
    degree: string
    institution: string
    year: string
  }[]
  summary: string
  strengths: string[]
  weaknesses: string[]
  projects?: {
    name: string
    description: string
    technologies?: string[]
    date?: string
  }[]
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  try {
    console.log("Starting resume analysis...")

    // Check if API key is available
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not defined in environment variables")
      throw new Error("Groq API key is missing. Please check your environment variables.")
    }

    // Sanitize the input text
    const sanitizedText = resumeText
      .replace(/[\x00-\x1F\x7F-\x9F]/g, " ") // Replace control characters
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .trim()

    const prompt = `
      You are an expert resume analyzer for the tech industry. Analyze the following resume text and extract key information.

      Resume:
      ${sanitizedText}

      Extract the following information:
      1. Technical skills (programming languages, frameworks, tools, etc.)
      2. Soft skills (communication, leadership, etc.)
      3. Work experience (title, company, duration, description, key achievements)
      4. Education (degree, institution, year)
      5. A brief professional summary
      6. Key strengths based on the resume
      7. Potential weaknesses or areas for improvement
      8. Projects (name, description, technologies, date)

      CRITICAL INSTRUCTION: Return ONLY a valid JSON object with NO explanatory text before or after.
      Do NOT include phrases like "Here is the JSON" or "The analysis is".
      The response must start with "{" and end with "}" and be valid JSON that can be parsed directly.

      JSON structure:
      {
        "skills": {
          "technical": ["skill1", "skill2", ...],
          "soft": ["skill1", "skill2", ...],
          "tools": ["tool1", "tool2", ...],
          "frameworks": ["framework1", "framework2", ...],
          "languages": ["language1", "language2", ...],
          "databases": ["database1", "database2", ...],
          "methodologies": ["methodology1", "methodology2", ...],
          "platforms": ["platform1", "platform2", ...],
          "other": ["other1", "other2", ...]
        },
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Duration",
            "description": "Brief description",
            "keyAchievements": ["achievement1", "achievement2", ...]
          }
        ],
        "education": [
          {
            "degree": "Degree Name",
            "institution": "Institution Name",
            "year": "Year"
          }
        ],
        "summary": "Professional summary",
        "strengths": ["strength1", "strength2", ...],
        "weaknesses": ["weakness1", "weakness2", ...],
        "projects": [
          {
            "name": "Project Name",
            "description": "Project Description",
            "technologies": ["tech1", "tech2", ...],
            "date": "Date"
          }
        ]
      }
    `

    // Try models in sequence
    async function tryModelsInSequence(): Promise<string> {
      const models = [MODEL_OPTIONS.primary, MODEL_OPTIONS.fallback, MODEL_OPTIONS.lastResort]

      for (const model of models) {
        try {
          console.log(`Trying model: ${model}`)

          const { text } = await withRetry(
            async () => {
              return await generateText({
                model: groq(model, { apiKey: GROQ_API_KEY }),
                prompt,
                temperature: 0.1,
                maxTokens: 1500, // Reduced from 2048 to stay under rate limits
                system:
                  "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'.",
              })
            },
            {
              maxRetries: 3,
              initialDelayMs: 2000,
              maxDelayMs: 10000,
              backoffFactor: 1.5,
            },
          )

          return text
        } catch (error) {
          console.error(`Error with model ${model}:`, error)

          // If this is the last model, rethrow the error
          if (model === models[models.length - 1]) {
            throw error
          }

          // Otherwise, continue to the next model
          console.log(`Falling back to next model...`)
        }
      }

      throw new Error("All models failed")
    }

    // Try to get a response from any available model
    const response = await tryModelsInSequence()

    // Parse the response
    const defaultResult: ResumeAnalysisResult = {
      skills: {
        technical: [],
        soft: [],
      },
      experience: [],
      education: [],
      summary: "",
      strengths: [],
      weaknesses: [],
      projects: [],
    }

    const result = safeParseJSON(response, defaultResult)

    if (!result) {
      console.error("Failed to parse resume analysis response")
      return defaultResult
    }

    console.log("Resume analysis completed successfully")
    return result as ResumeAnalysisResult
  } catch (error) {
    console.error("Error analyzing resume:", error)

    // Return a default result with error information
    return {
      skills: {
        technical: [],
        soft: [],
      },
      experience: [],
      education: [],
      summary: "Error analyzing resume. Please try again.",
      strengths: [],
      weaknesses: ["Resume analysis failed due to technical issues."],
      projects: [],
    }
  }
}

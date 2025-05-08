"\"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { safeParseJSON } from "@/utils/enhanced-json-repair"
import { withRetry } from "@/utils/api-rate-limit-handler"

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
  contactInfo: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  education?: {
    degree?: string
    institution?: string
    year?: string
  }[]
  experience?: {
    title?: string
    company?: string
    duration?: string
    description?: string
    keyAchievements?: string[]
    startDate?: string
    endDate?: string
  }[]
  summary?: string
  strengths?: string[]
  weaknesses?: string[]
  projects?: {
    name: string
    description: string
    technologies: string[]
    date?: string
  }[]
}

const defaultResumeAnalysisResult: ResumeAnalysisResult = {
  skills: {
    technical: [],
    soft: [],
    tools: [],
    frameworks: [],
    languages: [],
    databases: [],
    methodologies: [],
    platforms: [],
    other: [],
  },
  contactInfo: {},
  education: [],
  experience: [],
  summary: "",
  strengths: [],
  weaknesses: [],
  projects: [],
}

/**
 * Analyzes a resume and extracts key information
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  try {
    const prompt = `
      Analyze the following resume and extract key information in a structured format.
      
      Resume:
      ${resumeText}
      
      Please extract and return the following information in JSON format:
      1. Skills (technical and soft skills)
      2. Contact information (name, email, phone, location, LinkedIn, GitHub, website)
      3. Education history (degree, institution, year)
      4. Work experience (title, company, duration, description, key achievements)
      5. A brief professional summary
      6. Strengths
      7. Areas for improvement (weaknesses)
      8. Projects (name, description, technologies used, date)
      
      Ensure your response is ONLY the JSON object, with no additional text before or after.
      Make sure all property names are in quotes and all string values are in quotes.
      Do not use trailing commas after the last item in arrays or objects.
      
      Format your response as valid JSON with the following structure exactly:
      {
        "skills": {
          "technical": ["skill1", "skill2"],
          "soft": ["skill1", "skill2"]
        },
        "contactInfo": {
          "name": "Name",
          "email": "email@example.com",
          "phone": "Phone Number",
          "location": "Location",
          "linkedin": "LinkedIn URL",
          "github": "GitHub URL",
          "website": "Website URL"
        },
        "education": [
          {
            "degree": "Degree",
            "institution": "Institution",
            "year": "Year"
          }
        ],
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Duration",
            "description": "Job Description",
            "keyAchievements": ["achievement1", "achievement2"],
            "startDate": "Start Date",
            "endDate": "End Date"
          }
        ],
        "summary": "Professional Summary",
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "projects": [
          {
            "name": "Project Name",
            "description": "Project Description",
            "technologies": ["tech1", "tech2"],
            "date": "Date"
          }
        ]
      }
    `

    const GROQ_API_KEY = process.env.GROQ_API_KEY

    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not defined in environment variables")
      throw new Error("Groq API key is missing. Please check your environment variables.")
    }

    const { text } = await withRetry(
      async () => {
        return await generateText({
          model: groq("llama3-70b-8192", { apiKey: GROQ_API_KEY }),
          prompt,
          temperature: 0.2,
          maxTokens: 2048,
        })
      },
      {
        maxRetries: 3,
        initialDelayMs: 2000,
        maxDelayMs: 10000,
        backoffFactor: 1.5,
      },
    )

    const result = safeParseJSON(text, defaultResumeAnalysisResult)

    return result
  } catch (error) {
    console.error("Error analyzing resume:", error)
    return defaultResumeAnalysisResult
  }
}

"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export type ResumeAnalysisResult = {
  skills: {
    technical: string[]
    soft: string[]
  }
  experience: {
    title: string
    company: string
    duration: string
    description: string
    keyAchievements: string[]
  }[]
  education: {
    degree: string
    institution: string
    year: string
  }[]
  summary: string
  strengths: string[]
  weaknesses: string[]
}

// Default empty structure to ensure consistent shape
const defaultAnalysisResult: ResumeAnalysisResult = {
  skills: {
    technical: [],
    soft: [],
  },
  experience: [],
  education: [],
  summary: "",
  strengths: [],
  weaknesses: [],
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  try {
    const prompt = `
      Analyze the following resume and extract key information in a structured format.
      Resume:
      ${resumeText}
      
      Please extract and return the following information in JSON format:
      1. Skills (categorized as technical and soft skills)
      2. Work experience (including job title, company, duration, description, and key achievements)
      3. Education (degree, institution, graduation year)
      4. A brief professional summary
      5. Key strengths based on the resume
      6. Potential weaknesses or missing elements in the resume
      
      Format your response as valid JSON with the following structure exactly:
      {
        "skills": {
          "technical": ["skill1", "skill2", ...],
          "soft": ["skill1", "skill2", ...]
        },
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Duration",
            "description": "Job description",
            "keyAchievements": ["achievement1", "achievement2", ...]
          }
        ],
        "education": [
          {
            "degree": "Degree Name",
            "institution": "Institution Name",
            "year": "Graduation Year"
          }
        ],
        "summary": "Professional summary",
        "strengths": ["strength1", "strength2", ...],
        "weaknesses": ["weakness1", "weakness2", ...]
      }
      
      Return only the JSON without any additional text or explanation.
    `

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.2,
      maxTokens: 2048,
    })

    // Parse the JSON response
    try {
      // First, try to parse the raw response
      let result: ResumeAnalysisResult

      try {
        result = JSON.parse(text) as ResumeAnalysisResult
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the text
        // Sometimes the model might include extra text before or after the JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]) as ResumeAnalysisResult
        } else {
          throw new Error("Could not extract valid JSON from response")
        }
      }

      // Ensure the result has the expected structure
      return {
        skills: {
          technical: result.skills?.technical || defaultAnalysisResult.skills.technical,
          soft: result.skills?.soft || defaultAnalysisResult.skills.soft,
        },
        experience: result.experience || defaultAnalysisResult.experience,
        education: result.education || defaultAnalysisResult.education,
        summary: result.summary || defaultAnalysisResult.summary,
        strengths: result.strengths || defaultAnalysisResult.strengths,
        weaknesses: result.weaknesses || defaultAnalysisResult.weaknesses,
      }
    } catch (parseError) {
      console.error("Error parsing Groq response:", parseError)
      console.error("Raw response:", text)
      return defaultAnalysisResult
    }
  } catch (error) {
    console.error("Error analyzing resume:", error)
    return defaultAnalysisResult
  }
}

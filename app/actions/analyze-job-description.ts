"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

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
        "requiredSkills": ["skill1", "skill2", ...],
        "preferredSkills": ["skill1", "skill2", ...],
        "responsibilities": ["responsibility1", "responsibility2", ...],
        "qualifications": {
          "required": ["qualification1", "qualification2", ...],
          "preferred": ["qualification1", "qualification2", ...]
        },
        "experience": {
          "level": "Experience Level",
          "years": "Years Required"
        },
        "education": "Education Requirements",
        "salary": "Salary Information",
        "benefits": ["benefit1", "benefit2", ...],
        "summary": "Job Summary",
        "keywordsDensity": [
          {"keyword": "keyword1", "count": count1},
          {"keyword": "keyword2", "count": count2},
          ...
        ]
      }
      
      If any information is not available in the job description, use an empty string or empty array as appropriate.
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
      let result: JobAnalysisResult

      try {
        result = JSON.parse(text) as JobAnalysisResult
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]) as JobAnalysisResult
        } else {
          throw new Error("Could not extract valid JSON from response")
        }
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
    } catch (parseError) {
      console.error("Error parsing Groq response:", parseError)
      console.error("Raw response:", text)
      return defaultJobAnalysisResult
    }
  } catch (error) {
    console.error("Error analyzing job description:", error)
    return defaultJobAnalysisResult
  }
}

"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"

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

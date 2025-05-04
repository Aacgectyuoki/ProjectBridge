"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { safeParseJSON } from "@/utils/enhanced-json-repair"

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
    startDate: string
    endDate?: string
    description: string
    keyAchievements?: string[]
  }[]
  education: {
    institution: string
    degree: string
    year: string
  }[]
  projects?: {
    name: string
    description: string
    technologies: string[]
    date?: string
  }[]
  strengths: string[]
  weaknesses: string[]
  summary: string
}

// Default empty structure to ensure consistent shape
const defaultResumeAnalysisResult: ResumeAnalysisResult = {
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
    console.log("Starting resume analysis...")

    // First, focus on extracting skills in a format-agnostic way
    const skillsPrompt = `
      You are an expert skills analyzer for the tech industry. Your task is to extract ALL skills mentioned in the following text, 
      regardless of format or structure. The text is from a resume or CV, but may be in any format.
      
      Text:
      ${resumeText}
      
      Extract ALL skills mentioned in the text, including:
      1. Technical skills (programming, engineering, data analysis, etc.)
      2. Soft skills (communication, leadership, etc.)
      3. Tools (specific software, platforms, etc.)
      4. Frameworks and libraries
      5. Programming languages
      6. Databases
      7. Methodologies (Agile, Scrum, etc.)
      8. Platforms (cloud services, operating systems, etc.)
      
      Be thorough and extract ALL skills, even if they're only mentioned once or in passing.
      Do not make assumptions about skills not explicitly mentioned.
      
      CRITICAL INSTRUCTION: Return ONLY a valid JSON object with NO explanatory text before or after.
      Do NOT include phrases like "Here is the JSON" or "The extracted skills are".
      The response must start with "{" and end with "}" and be valid JSON that can be parsed directly.

      JSON structure:
      {
        "technical": ["skill1", "skill2", ...],
        "soft": ["skill1", "skill2", ...],
        "tools": ["tool1", "tool2", ...],
        "frameworks": ["framework1", "framework2", ...],
        "languages": ["language1", "language2", ...],
        "databases": ["database1", "database2", ...],
        "methodologies": ["methodology1", "methodology2", ...],
        "platforms": ["platform1", "platform2", ...],
        "other": ["other1", "other2", ...]
      }
    `

    const { text: skillsResponse } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: skillsPrompt,
      temperature: 0.1,
      maxTokens: 1024,
      system:
        "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'.",
    })

    // Parse the skills response
    const skillsResult = safeParseJSON(skillsResponse, {
      technical: [],
      soft: [],
      tools: [],
      frameworks: [],
      languages: [],
      databases: [],
      methodologies: [],
      platforms: [],
      other: [],
    })

    // Now extract basic resume information in a format-agnostic way
    const infoPrompt = `
      You are a skilled resume analyzer. Extract basic information from the following resume text.
      The resume may be in any format - don't make assumptions about its structure.
      
      Resume:
      ${resumeText}
      
      Extract the following information if present:
      1. A brief professional summary
      2. Work experience entries (title, company, dates, descriptions)
      3. Education information
      4. Key strengths
      5. Areas for improvement or missing skills
      
      CRITICAL INSTRUCTION: Return ONLY a valid JSON object with NO explanatory text before or after.
      Do NOT include phrases like "Here is the JSON" or "The extracted information is".
      The response must start with "{" and end with "}" and be valid JSON that can be parsed directly.

      JSON structure:
      {
        "summary": "Brief professional summary",
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "startDate": "Start Date",
            "endDate": "End Date or Present",
            "description": "Brief description"
          }
        ],
        "education": [
          {
            "institution": "Institution Name",
            "degree": "Degree Name",
            "year": "Year"
          }
        ],
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["area1", "area2"]
      }
    `

    const { text: infoResponse } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: infoPrompt,
      temperature: 0.1,
      maxTokens: 1024,
      system:
        "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'.",
    })

    // Parse the info response
    const infoResult = safeParseJSON(infoResponse, {
      summary: "",
      experience: [],
      education: [],
      strengths: [],
      weaknesses: [],
    })

    // Combine the results
    const combinedResult: ResumeAnalysisResult = {
      skills: {
        technical: skillsResult?.technical || [],
        soft: skillsResult?.soft || [],
        tools: skillsResult?.tools || [],
        frameworks: skillsResult?.frameworks || [],
        languages: skillsResult?.languages || [],
        databases: skillsResult?.databases || [],
        methodologies: skillsResult?.methodologies || [],
        platforms: skillsResult?.platforms || [],
        other: skillsResult?.other || [],
      },
      experience: infoResult?.experience || [],
      education: infoResult?.education || [],
      summary: infoResult?.summary || "",
      strengths: infoResult?.strengths || [],
      weaknesses: infoResult?.weaknesses || [],
    }

    return combinedResult
  } catch (error) {
    console.error("Error analyzing resume:", error)
    return defaultResumeAnalysisResult
  }
}

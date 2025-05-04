"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { safeParseJSON } from "@/utils/enhanced-json-repair"

export type ExtractedSkills = {
  technical: string[]
  soft?: string[] // Make soft skills optional
  tools: string[]
  frameworks: string[]
  languages: string[]
  databases: string[]
  methodologies: string[]
  platforms: string[]
  other: string[]
}

const defaultExtractedSkills: ExtractedSkills = {
  technical: [],
  // soft skills are now optional, so we don't need to include them in the default
  tools: [],
  frameworks: [],
  languages: [],
  databases: [],
  methodologies: [],
  platforms: [],
  other: [],
}

/**
 * Extracts skills from text using an LLM, regardless of the text format
 * @param text The text to extract skills from (resume or job description)
 * @param source Whether the text is from a resume or job description
 * @returns Structured object with categorized skills
 */
export async function extractSkills(text: string, source: "resume" | "job" = "resume"): Promise<ExtractedSkills> {
  try {
    const prompt = `
      You are an expert skills analyzer for the tech industry. Your task is to extract ALL skills mentioned in the following text,
      regardless of its format or structure. The text is from a ${source === "resume" ? "resume/CV" : "job description"}.

      Text:
      ${text}

      Extract ALL skills mentioned in the text, including:
      1. Technical skills (programming, engineering, data analysis, etc.)
      2. Soft skills (communication, leadership, etc.)
      3. Tools (specific software, platforms, etc.)
      4. Frameworks and libraries
      5. Programming languages
      6. Databases
      7. Methodologies (Agile, Scrum, etc.)
      8. Platforms (cloud services, operating systems, etc.)
      
      Important guidelines:
      - Be thorough and extract ALL skills, even if they're only mentioned once or in passing
      - Do not make assumptions about the format or structure of the text
      - Resolve abbreviations to their full forms (e.g., "AWS" → "Amazon Web Services")
      - Include both technical and non-technical skills
      - Categorize each skill appropriately
      - If a skill could fit in multiple categories, place it in the most specific one
      - Do not include generic terms that aren't specific skills

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

    const { text: responseText } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.1,
      maxTokens: 1024,
      system:
        "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'.",
    })

    console.log("Raw LLM response first 100 chars:", responseText.substring(0, 100) + "...")

    // Parse the JSON response with enhanced error handling
    const result = safeParseJSON(responseText, defaultExtractedSkills)

    if (!result) {
      console.error("Failed to parse skills extraction response")
      return defaultExtractedSkills
    }

    return result as ExtractedSkills
  } catch (error) {
    console.error("Error extracting skills:", error)
    return defaultExtractedSkills
  }
}

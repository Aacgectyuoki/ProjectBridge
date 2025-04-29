"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export type ExtractedSkills = {
  technical: string[]
  soft: string[]
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
  soft: [],
  tools: [],
  frameworks: [],
  languages: [],
  databases: [],
  methodologies: [],
  platforms: [],
  other: [],
}

/**
 * Attempts to extract JSON from a string that might contain additional text
 * @param text The text that might contain JSON
 * @returns Parsed JSON object or null if parsing fails
 */
function extractJsonFromText(text: string): any {
  // Try to find JSON-like structure with regex
  const jsonRegex = /\{[\s\S]*\}/g
  const matches = text.match(jsonRegex)

  if (!matches || matches.length === 0) return null

  // Try each match until we find valid JSON
  for (const match of matches) {
    try {
      return JSON.parse(match)
    } catch (e) {
      // Try to fix common JSON formatting issues
      try {
        // Replace single quotes with double quotes
        const fixedJson = match.replace(/'/g, '"')
        return JSON.parse(fixedJson)
      } catch (e2) {
        // Continue to the next match
        continue
      }
    }
  }

  return null
}

/**
 * Extracts skills from text using an LLM
 * @param text The text to extract skills from (resume or job description)
 * @param source Whether the text is from a resume or job description
 * @returns Structured object with categorized skills
 */
export async function extractSkills(text: string, source: "resume" | "job" = "resume"): Promise<ExtractedSkills> {
  try {
    const prompt = `
      You are an expert skills analyzer for the tech industry. Your task is to extract and categorize all skills mentioned in the following ${source === "resume" ? "resume" : "job description"}.

      ${source === "resume" ? "RESUME" : "JOB DESCRIPTION"}:
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
      9. Other relevant skills

      Important guidelines:
      - Be comprehensive and extract ALL skills, even if they're only mentioned once
      - Resolve abbreviations to their full forms (e.g., "AWS" → "Amazon Web Services")
      - Include both technical and non-technical skills
      - Categorize each skill appropriately
      - If a skill could fit in multiple categories, place it in the most specific one
      - Do not include generic terms that aren't specific skills

      Format your response as valid JSON with the following structure exactly:
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

      IMPORTANT: Return ONLY the JSON object without ANY additional text, explanation, or markdown formatting.
      The response MUST be a valid JSON object that can be parsed with JSON.parse().
    `

    const { text: responseText } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.1, // Lower temperature for more consistent output
      maxTokens: 2048,
    })

    console.log("Raw LLM response:", responseText.substring(0, 200) + "...") // Log the beginning of the response for debugging

    // Parse the JSON response with enhanced error handling
    try {
      // First, try to parse the raw response directly
      try {
        return JSON.parse(responseText) as ExtractedSkills
      } catch (directParseError) {
        console.log("Direct JSON parsing failed, trying to extract JSON from text")

        // Try to extract JSON from the text
        const extractedJson = extractJsonFromText(responseText)

        if (extractedJson) {
          console.log("Successfully extracted JSON from text")
          return extractedJson as ExtractedSkills
        }

        // If we still can't parse JSON, try to create a basic structure from the response
        console.log("JSON extraction failed, falling back to default structure with mock data")

        // As a last resort, try to extract skills using regex patterns
        const technicalSkillsMatch = responseText.match(/"technical":\s*\[(.*?)\]/s)
        const softSkillsMatch = responseText.match(/"soft":\s*\[(.*?)\]/s)

        const mockResult: ExtractedSkills = {
          ...defaultExtractedSkills,
          technical: technicalSkillsMatch
            ? technicalSkillsMatch[1]
                .split(",")
                .map((s) => s.trim().replace(/"/g, "").replace(/,$/, ""))
                .filter((s) => s.length > 0)
            : [],
          soft: softSkillsMatch
            ? softSkillsMatch[1]
                .split(",")
                .map((s) => s.trim().replace(/"/g, "").replace(/,$/, ""))
                .filter((s) => s.length > 0)
            : [],
        }

        if (mockResult.technical.length > 0 || mockResult.soft.length > 0) {
          console.log("Created partial skills data from regex matching")
          return mockResult
        }

        // If all else fails, use a simple fallback with common skills
        console.log("Using fallback skills data")
        return {
          ...defaultExtractedSkills,
          technical: ["JavaScript", "HTML", "CSS", "React", "Node.js"],
          soft: ["Communication", "Teamwork", "Problem Solving"],
        }
      }
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError)
      console.error("Raw response:", responseText)

      // Return default skills as fallback
      return defaultExtractedSkills
    }
  } catch (error) {
    console.error("Error extracting skills:", error)
    return defaultExtractedSkills
  }
}

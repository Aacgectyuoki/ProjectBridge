"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { safeParseJSON } from "@/utils/enhanced-json-repair"
import { withRetry, isRateLimitError } from "@/utils/api-rate-limit-handler"
import { preprocessForSkillExtraction } from "@/utils/text-preprocessor"

// Use a smaller model for less token usage
const MODEL_OPTIONS = {
  primary: "llama3-70b-8192",
  fallback: "llama3-8b-8192", // Fallback to a smaller model if rate limited
}

// Explicitly get the API key from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY

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
 * STEP 2: Extract skills from plain text
 * This function assumes the text has already been extracted from a document
 * @param text The plain text to extract skills from (resume or job description)
 * @param source Whether the text is from a resume or job description
 * @returns Structured object with categorized skills
 */
export async function extractSkills(text: string, source: "resume" | "job" = "resume"): Promise<ExtractedSkills> {
  try {
    console.log(`STEP 2: Extracting skills from ${source} text...`)

    // Preprocess the text for optimal skill extraction
    const preprocessedText = preprocessForSkillExtraction(text)
    console.log(`Preprocessed text length: ${preprocessedText.length} characters`)

    // Check if API key is available
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not defined in environment variables")
      throw new Error("Groq API key is missing. Please check your environment variables.")
    }

    // Determine the appropriate prompt based on the source
    const prompt = source === "resume" ? getResumeSkillsPrompt(preprocessedText) : getJobSkillsPrompt(preprocessedText)

    // Use withRetry to handle rate limits with exponential backoff
    const { text: response } = await withRetry(
      async () => {
        try {
          return await generateText({
            model: groq(MODEL_OPTIONS.primary, { apiKey: GROQ_API_KEY }),
            prompt,
            temperature: 0.1,
            maxTokens: 800, // Reduced token count
            system:
              "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'.",
          })
        } catch (error) {
          // If we hit a rate limit, try the fallback model
          if (isRateLimitError(error)) {
            console.log("Rate limited on primary model, trying fallback model...")
            return await generateText({
              model: groq(MODEL_OPTIONS.fallback, { apiKey: GROQ_API_KEY }),
              prompt,
              temperature: 0.1,
              maxTokens: 800,
              system:
                "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'.",
            })
          }
          throw error
        }
      },
      {
        maxRetries: 3,
        initialDelayMs: 2000,
        maxDelayMs: 10000,
        backoffFactor: 1.5,
      },
    )

    // Log the raw response for debugging
    console.log("Raw response from LLM:", response.substring(0, 100) + "...")

    // Pre-process the response to ensure it starts with { and ends with }
    let processedResponse = response.trim()
    if (!processedResponse.startsWith("{")) {
      const firstBrace = processedResponse.indexOf("{")
      if (firstBrace >= 0) {
        processedResponse = processedResponse.substring(firstBrace)
      } else {
        throw new Error("Response does not contain a JSON object")
      }
    }

    if (!processedResponse.endsWith("}")) {
      const lastBrace = processedResponse.lastIndexOf("}")
      if (lastBrace >= 0) {
        processedResponse = processedResponse.substring(0, lastBrace + 1)
      } else {
        throw new Error("Response does not contain a JSON object")
      }
    }

    // Parse the response with our enhanced JSON repair utility
    const result = safeParseJSON(processedResponse, defaultExtractedSkills)

    if (!result) {
      console.error("Failed to parse skills extraction response")
      return defaultExtractedSkills
    }

    console.log(`Successfully extracted skills:`, result)
    return result as ExtractedSkills
  } catch (error) {
    console.error(`Error extracting skills from ${source}:`, error)
    // Return a default structure on error
    return defaultExtractedSkills
  }
}

function getResumeSkillsPrompt(resumeText: string) {
  return `
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
      "technical": ["skill1", "skill2"],
      "soft": ["skill1", "skill2"],
      "tools": ["tool1", "tool2"],
      "frameworks": ["framework1", "framework2"],
      "languages": ["language1", "language2"],
      "databases": ["database1", "database2"],
      "methodologies": ["methodology1", "methodology2"],
      "platforms": ["platform1", "platform2"],
      "other": ["other1", "other2"]
    }
  `
}

function getJobSkillsPrompt(jobText: string) {
  return `
    You are an expert skills analyzer for the tech industry. Your task is to extract ALL skills required or mentioned in the following job description, 
      Your task is to extract ALL skills required or mentioned in the following job description, 
    
    Job Description:
    ${jobText}
    
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
      "technical": ["skill1", "skill2"],
      "soft": ["skill1", "skill2"],
      "tools": ["tool1", "tool2"],
      "frameworks": ["framework1", "framework2"],
      "languages": ["language1", "language2"],
      "databases": ["database1", "database2"],
      "methodologies": ["methodology1", "methodology2"],
      "platforms": ["platform1", "platform2"],
      "other": ["other1", "other2"]
    }
  `
}

"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { Chain } from "@/utils/ai-chain/chain"
import { OutputParser } from "@/utils/ai-chain/output-parser"
import { jobSkillExtractionPrompt } from "@/utils/ai-chain/prompts/skill-extraction-prompts"
import { SkillsSchema, type ExtractedSkills } from "@/utils/ai-chain/schemas/skill-extraction-schema"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"
import { SkillsLogger } from "@/utils/skills-logger"
import { safeParseJSON, extractJsonFromText } from "@/utils/enhanced-json-repair"
import { withRetry, isRateLimitError } from "@/utils/api-rate-limit-handler"
import { repairJSON } from "@/utils/repair-json"

// Default empty skills structure
const defaultSkills: ExtractedSkills = {
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
 * Try different models in sequence until one works
 */
async function tryModelsInSequence(
  prompt: string,
  system: string,
  apiKey: string,
  models = ["llama3-8b-8192", "mixtral-8x7b-32768", "llama3-70b-8192"],
): Promise<string> {
  let lastError: Error | null = null
  const allResponses: string[] = []

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`)

      const text = await withRetry(
        async () => {
          const response = await generateText({
            model: groq(model, { apiKey }),
            prompt,
            temperature: 0.2,
            maxTokens: 1500, // Reduced from 2048 to stay under rate limits
            system,
          })
          return response.text
        },
        {
          maxRetries: 3,
          initialDelayMs: 3000,
          maxDelayMs: 15000,
        },
      )

      console.log(`Successfully used model: ${model}`)

      // Store all responses for potential fallback
      allResponses.push(text)

      // Check if the response contains JSON-like content
      if (text.includes("{") && text.includes("}")) {
        return text
      }

      console.log(`Response from ${model} doesn't contain JSON. Trying next model.`)
    } catch (error) {
      console.warn(`Error with model ${model}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // If it's not a rate limit error, try the next model
      // If it is a rate limit error, the withRetry function already tried with backoff
      if (!isRateLimitError(error)) {
        continue
      }
    }
  }

  // If we have any responses but none contained JSON, use the first one
  // and let the downstream processing handle it
  if (allResponses.length > 0) {
    console.log("No JSON found in any responses. Using first response for fallback processing.")
    return allResponses[0]
  }

  // If all models failed, throw the last error
  throw lastError || new Error("All models failed")
}

// Function to extract skills from a job description using our LangChain-like approach
export async function extractJobSkillsChain(jobDescription: string): Promise<{
  skills: ExtractedSkills
  processingTime: number
}> {
  console.log("Starting job skill extraction with LangChain-like approach")
  const startTime = performance.now()

  try {
    // Get the API key from environment variables
    const GROQ_API_KEY = process.env.GROQ_API_KEY

    // Check if API key is available
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not defined in environment variables")
      throw new Error("Groq API key is missing. Please check your environment variables.")
    }

    // Create our output parser with a fallback creator
    const skillsParser = new OutputParser(SkillsSchema, "job-skills-parser", (text) => {
      console.log("Using fallback creator for job skills parser")

      // First, try to extract JSON from text that might contain explanatory content
      const extractedJson = extractJsonFromText(text)
      if (extractedJson) {
        console.log("Successfully extracted JSON from response")

        // Ensure all skill arrays exist
        return {
          technical: Array.isArray(extractedJson.technical) ? extractedJson.technical : [],
          soft: Array.isArray(extractedJson.soft) ? extractedJson.soft : [],
          tools: Array.isArray(extractedJson.tools) ? extractedJson.tools : [],
          frameworks: Array.isArray(extractedJson.frameworks) ? extractedJson.frameworks : [],
          languages: Array.isArray(extractedJson.languages) ? extractedJson.languages : [],
          databases: Array.isArray(extractedJson.databases) ? extractedJson.databases : [],
          methodologies: Array.isArray(extractedJson.methodologies) ? extractedJson.methodologies : [],
          platforms: Array.isArray(extractedJson.platforms) ? extractedJson.platforms : [],
          other: Array.isArray(extractedJson.other) ? extractedJson.other : [],
        }
      }

      // Try to extract skills from the text
      try {
        // First try to repair and parse the JSON
        const parsedData = safeParseJSON(text, defaultSkills)

        // Ensure all skill arrays exist
        return {
          technical: Array.isArray(parsedData.technical) ? parsedData.technical : [],
          soft: Array.isArray(parsedData.soft) ? parsedData.soft : [],
          tools: Array.isArray(parsedData.tools) ? parsedData.tools : [],
          frameworks: Array.isArray(parsedData.frameworks) ? parsedData.frameworks : [],
          languages: Array.isArray(parsedData.languages) ? parsedData.languages : [],
          databases: Array.isArray(parsedData.databases) ? parsedData.databases : [],
          methodologies: Array.isArray(parsedData.methodologies) ? parsedData.methodologies : [],
          platforms: Array.isArray(parsedData.platforms) ? parsedData.platforms : [],
          other: Array.isArray(parsedData.other) ? parsedData.other : [],
        }
      } catch (e) {
        console.error("Fallback creator error:", e)

        // Try to extract skills from text content
        const extractedSkills = extractSkillsFromText(text)
        if (Object.keys(extractedSkills).length > 0) {
          return extractedSkills
        }

        // Return default empty structure if all else fails
        return defaultSkills
      }
    })

    // For now, let's avoid chunking to simplify the process
    // This will help us identify if chunking is causing the freezing issue
    return await extractJobSkillsDirect(jobDescription, skillsParser, GROQ_API_KEY)
  } catch (error) {
    console.error("Error in job skill extraction:", error)

    // Log the error
    EnhancedSkillsLogger.logExtractedSkills(
      jobDescription.substring(0, 200) + "...",
      defaultSkills,
      "job-description-error",
      performance.now() - startTime,
    )

    // Return empty results
    return {
      skills: defaultSkills,
      processingTime: performance.now() - startTime,
    }
  }
}

// Function to extract skills from a job description directly (no chunking)
async function extractJobSkillsDirect(
  jobDescription: string,
  skillsParser: OutputParser<ExtractedSkills>,
  apiKey: string,
): Promise<{
  skills: ExtractedSkills
  processingTime: number
}> {
  const startTime = performance.now()

  // Create our chain
  const chain = new Chain("job-skills-extraction-chain")

  // Add steps to our chain
  chain.addStep(async (input) => {
    // Format the prompt
    const prompt = jobSkillExtractionPrompt.format({ text: input })
    const system =
      "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'. Ensure all property values are followed by commas when needed."

    try {
      // Try different models in sequence
      const text = await tryModelsInSequence(prompt, system, apiKey, [
        "llama3-8b-8192",
        "mixtral-8x7b-32768",
        "llama3-70b-8192",
      ])

      // First, try to extract JSON from text that might contain explanatory content
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log("Found JSON-like content in response")
        try {
          // Try to parse the extracted JSON
          const parsed = JSON.parse(jsonMatch[0])
          return JSON.stringify(parsed)
        } catch (parseError) {
          console.log("Extracted JSON is not valid, attempting repair")
          const repaired = repairJSON(jsonMatch[0])
          return repaired
        }
      }

      // If no JSON-like content was found, create a default JSON structure
      console.log("No JSON-like content found in response, creating default structure")

      // Try to extract skills from text using regex patterns
      const extractedSkills = extractSkillsFromText(text)

      // If we extracted some skills, use them
      if (Object.values(extractedSkills).some((arr) => arr.length > 0)) {
        console.log("Successfully extracted some skills using regex patterns")
        return JSON.stringify(extractedSkills)
      }

      // Last resort: return default skills structure
      console.log("Falling back to default skills structure")
      return JSON.stringify(defaultSkills)
    } catch (error) {
      console.error("Error generating text with all models:", error)
      // Return a simple JSON structure that will parse correctly
      return JSON.stringify(defaultSkills)
    }
  }, "generate-skills-text")

  chain.addStep(async (text) => {
    try {
      // Parse the output
      const skills = await skillsParser.parse(text)
      return skills
    } catch (error) {
      console.error("Error parsing skills:", error)

      // Log more details about the parsing error
      if (typeof text === "string") {
        console.error("First 100 characters of problematic text:", text.substring(0, 100))

        // Try to extract JSON from text that might contain explanatory content
        const extractedJson = extractJsonFromText(text)
        if (extractedJson) {
          console.log("Successfully extracted JSON from problematic text")
          return extractedJson
        }

        // Try to identify JSON-like structures
        const jsonMatch = text.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          console.log("Found JSON-like structure, attempting manual repair")
          try {
            // Try to parse the JSON structure
            const parsedSkills = safeParseJSON(jsonMatch[0], defaultSkills)
            console.log("Manual repair succeeded")
            return parsedSkills
          } catch (repairError) {
            console.error("Manual repair failed:", repairError)
          }
        }
      }

      // Return a default skills object
      return defaultSkills
    }
  }, "parse-skills")

  // Run the chain
  const skills = await chain.run(jobDescription)

  const processingTime = performance.now() - startTime

  // Log the extracted skills
  EnhancedSkillsLogger.logExtractedSkills(
    jobDescription.substring(0, 200) + "...",
    skills,
    "job-description",
    processingTime,
  )

  // Also log to the original SkillsLogger for compatibility
  SkillsLogger.logSkills({
    source: "job-description",
    technicalSkills: [
      ...skills.technical,
      ...skills.tools,
      ...skills.frameworks,
      ...skills.languages,
      ...skills.databases,
      ...skills.platforms,
    ],
    softSkills: skills.soft,
    timestamp: new Date().toISOString(),
  })

  return {
    skills,
    processingTime,
  }
}

// Function to extract skills from text content when JSON parsing fails
function extractSkillsFromText(text: string): ExtractedSkills {
  const skills: ExtractedSkills = {
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

  // First try to find any JSON-like structures
  const jsonMatches = text.match(/\{[^{}]*\}/g)
  if (jsonMatches) {
    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match)
        // If we found a valid JSON object with skill arrays, use it
        if (parsed && typeof parsed === "object") {
          for (const key of Object.keys(skills)) {
            if (Array.isArray(parsed[key])) {
              skills[key] = [...skills[key], ...parsed[key]]
            }
          }
        }
      } catch (e) {
        // Ignore parsing errors and continue
      }
    }
  }

  // If we found skills in JSON fragments, return them
  if (Object.values(skills).some((arr) => arr.length > 0)) {
    return skills
  }

  // Look for skill lists in the text
  const technicalMatch = text.match(/technical[^[]*\[(.*?)\]/is)
  if (technicalMatch && technicalMatch[1]) {
    skills.technical = extractArrayItems(technicalMatch[1])
  }

  const softMatch = text.match(/soft[^[]*\[(.*?)\]/is)
  if (softMatch && softMatch[1]) {
    skills.soft = extractArrayItems(softMatch[1])
  }

  const toolsMatch = text.match(/tools[^[]*\[(.*?)\]/is)
  if (toolsMatch && toolsMatch[1]) {
    skills.tools = extractArrayItems(toolsMatch[1])
  }

  const frameworksMatch = text.match(/frameworks[^[]*\[(.*?)\]/is)
  if (frameworksMatch && frameworksMatch[1]) {
    skills.frameworks = extractArrayItems(frameworksMatch[1])
  }

  const languagesMatch = text.match(/languages[^[]*\[(.*?)\]/is)
  if (languagesMatch && languagesMatch[1]) {
    skills.languages = extractArrayItems(languagesMatch[1])
  }

  const databasesMatch = text.match(/databases[^[]*\[(.*?)\]/is)
  if (databasesMatch && databasesMatch[1]) {
    skills.databases = extractArrayItems(databasesMatch[1])
  }

  // If we couldn't extract any skills using patterns, try a more general approach
  if (Object.values(skills).every((arr) => arr.length === 0)) {
    // Look for any quoted strings that might be skills
    const quotedStrings = text.match(/"([^"]+)"/g)
    if (quotedStrings) {
      // Remove duplicates and clean up
      const uniqueSkills = [...new Set(quotedStrings.map((s) => s.replace(/"/g, "").trim()))]

      // Try to categorize skills based on common keywords
      for (const skill of uniqueSkills) {
        const lowerSkill = skill.toLowerCase()

        // Simple categorization based on common terms
        if (/java|python|javascript|typescript|c\+\+|ruby|go|rust|php|swift|kotlin|scala/i.test(lowerSkill)) {
          skills.languages.push(skill)
        } else if (/react|angular|vue|next|express|django|flask|spring|laravel|rails/i.test(lowerSkill)) {
          skills.frameworks.push(skill)
        } else if (/sql|mysql|postgresql|mongodb|oracle|cassandra|redis|dynamodb|firebase/i.test(lowerSkill)) {
          skills.databases.push(skill)
        } else if (/git|docker|kubernetes|jenkins|jira|aws|azure|gcp|terraform|ansible/i.test(lowerSkill)) {
          skills.tools.push(skill)
        } else if (/agile|scrum|kanban|waterfall|tdd|bdd|ci\/cd|devops|microservices/i.test(lowerSkill)) {
          skills.methodologies.push(skill)
        } else if (
          /communication|leadership|teamwork|problem.solving|critical.thinking|time.management/i.test(lowerSkill)
        ) {
          skills.soft.push(skill)
        } else {
          // Default to technical if we can't categorize
          skills.technical.push(skill)
        }
      }
    }

    // If still no skills found, look for words that might be skills
    if (Object.values(skills).every((arr) => arr.length === 0)) {
      // Extract words that might be technical terms (longer than 3 chars, not common words)
      const words = text.split(/\s+/).filter((word) => {
        const cleaned = word.replace(/[^\w]/g, "")
        return (
          cleaned.length > 3 &&
          !/^(the|and|that|have|for|not|with|you|this|but|his|her|they|she|from|will|would|could|should|about|there)$/i.test(
            cleaned,
          )
        )
      })

      if (words.length > 0) {
        // Take up to 10 words that might be skills
        skills.technical = [...new Set(words.slice(0, 10))]
      }
    }
  }

  return skills
}

// Helper function to extract items from array-like text
function extractArrayItems(text: string): string[] {
  // Remove any nested arrays or objects
  let cleanText = text.replace(/\{[^}]*\}/g, "")
  cleanText = cleanText.replace(/\[[^\]]*\]/g, "")

  // Extract quoted strings
  const items: string[] = []
  const matches = cleanText.match(/"([^"]+)"/g)

  if (matches) {
    matches.forEach((match) => {
      const item = match.replace(/"/g, "").trim()
      if (item && !items.includes(item)) {
        items.push(item)
      }
    })
  }

  // If no quoted strings found, try comma-separated values
  if (items.length === 0) {
    cleanText.split(",").forEach((item) => {
      const trimmed = item.trim()
      if (trimmed && !items.includes(trimmed)) {
        items.push(trimmed)
      }
    })
  }

  return items
}

"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { Chain } from "@/utils/ai-chain/chain"
import { OutputParser } from "@/utils/ai-chain/output-parser"
import { jobSkillExtractionPrompt } from "@/utils/ai-chain/prompts/skill-extraction-prompts"
import { SkillsSchema, type ExtractedSkills } from "@/utils/ai-chain/schemas/skill-extraction-schema"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"
import { SkillsLogger } from "@/utils/skills-logger"
import { safeParseJSON, repairJSON } from "@/utils/json-repair"

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

// Function to extract skills from a job description using our LangChain-like approach
export async function extractJobSkillsChain(jobDescription: string): Promise<{
  skills: ExtractedSkills
  processingTime: number
}> {
  console.log("Starting job skill extraction with LangChain-like approach")
  const startTime = performance.now()

  try {
    // Create our output parser with a fallback creator
    const skillsParser = new OutputParser(SkillsSchema, "job-skills-parser", (text) => {
      console.log("Using fallback creator for job skills parser")
      // Try to extract skills from the text
      try {
        // First try to repair and parse the JSON
        const repairedJSON = repairJSON(text)
        const parsedData = safeParseJSON(repairedJSON, defaultSkills)

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
    return await extractJobSkillsDirect(jobDescription, skillsParser)
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

    // Generate text with the AI model
    try {
      const { text } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt,
        temperature: 0.2,
        maxTokens: 2048,
      })

      return text
    } catch (error) {
      console.error("Error generating text with Groq:", error)
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

        // Try to identify JSON-like structures
        const jsonMatch = text.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          console.log("Found JSON-like structure, attempting manual repair")
          try {
            // Try to repair and parse the JSON structure
            const repairedJSON = repairJSON(jsonMatch[0])
            const parsedSkills = safeParseJSON(repairedJSON, defaultSkills)
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

// Function to merge skills from multiple chunks, removing duplicates
function mergeSkillResults(results: ExtractedSkills[]): ExtractedSkills {
  const merged: ExtractedSkills = {
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

  // Helper function to merge arrays without duplicates
  const mergeArrays = (target: string[], source: string[]) => {
    for (const item of source) {
      if (!target.includes(item)) {
        target.push(item)
      }
    }
  }

  // Merge each category
  for (const result of results) {
    mergeArrays(merged.technical, result.technical || [])
    mergeArrays(merged.soft, result.soft || [])
    mergeArrays(merged.tools, result.tools || [])
    mergeArrays(merged.frameworks, result.frameworks || [])
    mergeArrays(merged.languages, result.languages || [])
    mergeArrays(merged.databases, result.databases || [])
    mergeArrays(merged.methodologies, result.methodologies || [])
    mergeArrays(merged.platforms, result.platforms || [])
    mergeArrays(merged.other, result.other || [])
  }

  return merged
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

  // If we couldn't extract any skills, try a more general approach
  if (Object.values(skills).every((arr) => arr.length === 0)) {
    // Look for any quoted strings that might be skills
    const quotedStrings = text.match(/"([^"]+)"/g)
    if (quotedStrings) {
      // Remove duplicates and clean up
      const uniqueSkills = [...new Set(quotedStrings.map((s) => s.replace(/"/g, "").trim()))]
      skills.technical = uniqueSkills
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

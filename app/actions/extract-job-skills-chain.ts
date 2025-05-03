"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { Chain } from "@/utils/ai-chain/chain"
import { OutputParser } from "@/utils/ai-chain/output-parser"
import { jobSkillExtractionPrompt } from "@/utils/ai-chain/prompts/skill-extraction-prompts"
import { SkillsSchema, type ExtractedSkills } from "@/utils/ai-chain/schemas/skill-extraction-schema"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"
import { SkillsLogger } from "@/utils/skills-logger"

// Function to extract skills from a job description using our LangChain-like approach
export async function extractJobSkillsChain(jobDescription: string): Promise<{
  skills: ExtractedSkills
  processingTime: number
}> {
  console.log("Starting job skill extraction with LangChain-like approach")
  const startTime = performance.now()

  try {
    // Create our output parser
    const skillsParser = new OutputParser(SkillsSchema, "job-skills-parser")

    // For now, let's avoid chunking to simplify the process
    // This will help us identify if chunking is causing the freezing issue
    return await extractJobSkillsDirect(jobDescription, skillsParser)
  } catch (error) {
    console.error("Error in job skill extraction:", error)

    // Log the error
    EnhancedSkillsLogger.logExtractedSkills(
      jobDescription.substring(0, 200) + "...",
      {
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
      "job-description-error",
      performance.now() - startTime,
    )

    // Return empty results
    return {
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
      return JSON.stringify({
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
    }
  }, "generate-skills-text")

  chain.addStep(async (text) => {
    try {
      // Parse the output
      const skills = await skillsParser.parse(text)
      return skills
    } catch (error) {
      console.error("Error parsing skills:", error)
      // Return a default skills object
      return {
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

"use server"

import { processResumeInChunks } from "@/utils/chunked-resume-processor"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"

export type EnhancedExtractSkillsResult = {
  skills: {
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
  processingTime: number
}

/**
 * Enhanced skill extraction using the chain-based approach with chunking
 * @param text Text to extract skills from
 * @param source Source of the text (resume or job)
 * @returns Extracted skills and processing time
 */
export async function enhancedExtractSkillsWithChain(
  text: string,
  source = "resume",
): Promise<EnhancedExtractSkillsResult> {
  console.log(`Enhanced skill extraction with chain for ${source}`)

  try {
    // Process the text in chunks
    const result = await processResumeInChunks(text)

    // Log the final result
    EnhancedSkillsLogger.logExtractedSkills(
      text.substring(0, 200) + "...",
      result.skills,
      source,
      result.processingTime,
    )

    return result
  } catch (error) {
    console.error("Error in enhanced skill extraction with chain:", error)

    // Log the error
    EnhancedSkillsLogger.logExtractedSkills(
      text.substring(0, 200) + "...",
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
      `${source}-error`,
      0,
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
      processingTime: 0,
    }
  }
}

import { DocumentProcessor } from "./ai-chain"
import { EnhancedSkillsLogger } from "./enhanced-skills-logger"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { performance } from "perf_hooks"
import { z } from "zod"
import { withRetry } from "./api-rate-limit-handler"

// Define the schema for skill extraction
const skillExtractionSchema = z.object({
  technical: z.array(z.string()).default([]),
  soft: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  other: z.array(z.string()).default([]),
})

/**
 * Processes a resume in chunks for better handling of large documents
 * @param resumeText Full resume text
 * @param chunkSize Size of each chunk
 * @param overlap Overlap between chunks
 * @returns Combined extracted skills
 */
export async function processResumeInChunks(
  resumeText: string,
  chunkSize = 2000,
  overlap = 500,
): Promise<{
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
}> {
  const startTime = performance.now()
  console.log(`Processing resume of length ${resumeText.length} in chunks`)

  // If the resume is small enough, process it directly
  if (resumeText.length <= chunkSize) {
    console.log("Resume is small enough to process directly")
    return processResumeChunk(resumeText, "full-resume")
  }

  // Split the resume into chunks
  const chunks = await DocumentProcessor.loadAndChunk(resumeText, chunkSize, overlap)
  console.log(`Split resume into ${chunks.length} chunks`)

  // Process each chunk
  const chunkResults = await Promise.all(
    chunks.map((chunk, index) => processResumeChunk(chunk.text, `chunk-${index + 1}-of-${chunks.length}`)),
  )

  // Merge the results
  const mergedSkills = {
    technical: [...new Set(chunkResults.flatMap((result) => result.skills.technical))],
    soft: [...new Set(chunkResults.flatMap((result) => result.skills.soft))],
    tools: [...new Set(chunkResults.flatMap((result) => result.skills.tools))],
    frameworks: [...new Set(chunkResults.flatMap((result) => result.skills.frameworks))],
    languages: [...new Set(chunkResults.flatMap((result) => result.skills.languages))],
    databases: [...new Set(chunkResults.flatMap((result) => result.skills.databases))],
    methodologies: [...new Set(chunkResults.flatMap((result) => result.skills.methodologies))],
    platforms: [...new Set(chunkResults.flatMap((result) => result.skills.platforms))],
    other: [...new Set(chunkResults.flatMap((result) => result.skills.other))],
  }

  const totalTime = performance.now() - startTime
  console.log(`Completed processing resume in chunks in ${totalTime.toFixed(2)}ms`)

  // Log the merged results
  EnhancedSkillsLogger.logExtractedSkills(
    resumeText.substring(0, 200) + "...",
    mergedSkills,
    "chunked-resume-processing",
    totalTime,
  )

  return {
    skills: mergedSkills,
    processingTime: totalTime,
  }
}

/**
 * Processes a single chunk of a resume
 * @param chunkText Text of the chunk
 * @param chunkId Identifier for the chunk
 * @returns Extracted skills from the chunk
 */
async function processResumeChunk(
  chunkText: string,
  chunkId: string,
): Promise<{
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
}> {
  const startTime = performance.now()
  console.log(`Processing resume chunk: ${chunkId}`)

  try {
    const prompt = `
      You are an expert skills analyzer for the tech industry. Your task is to extract and categorize all skills mentioned in the following resume text.

      RESUME TEXT:
      ${chunkText}

      Extract ALL skills mentioned in the text, including:
      1. Technical skills (programming, engineering, data analysis, etc.)
      2. Soft skills (communication, leadership, etc.)
      3. Tools (specific software, platforms, etc.)
      4. Frameworks (React, Angular, Django, etc.)
      5. Programming languages (JavaScript, Python, etc.)
      6. Databases (MySQL, MongoDB, etc.)
      7. Methodologies (Agile, Scrum, etc.)
      8. Platforms (AWS, Azure, etc.)
      9. Other skills that don't fit the above categories

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

      Return only the JSON without any additional text or explanation.
    `

    // Try with different models
    const models = ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"]

    for (const model of models) {
      try {
        console.log(`Trying model ${model} for chunk ${chunkId}`)

        const { text } = await withRetry(
          () =>
            generateText({
              model: groq(model),
              prompt,
              temperature: 0.1,
              maxTokens: 2000,
            }),
          {
            maxRetries: 2,
            initialDelayMs: 1000,
            maxDelayMs: 10000,
            backoffFactor: 1.5,
          },
        )

        // Try to parse the JSON response
        try {
          // Extract JSON if needed
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          const jsonText = jsonMatch ? jsonMatch[0] : text

          // Parse the JSON
          const parsed = JSON.parse(jsonText)

          // Validate against schema
          const skills = skillExtractionSchema.parse(parsed)

          const processingTime = performance.now() - startTime
          console.log(`Successfully processed chunk ${chunkId} with model ${model} in ${processingTime.toFixed(2)}ms`)

          // Log the chunk results
          EnhancedSkillsLogger.logExtractedSkills(
            chunkText.substring(0, 200) + "...",
            skills,
            `chunk-${chunkId}-${model}`,
            processingTime,
          )

          return {
            skills,
            processingTime,
          }
        } catch (parseError) {
          console.error(`Failed to parse response from ${model} for chunk ${chunkId}:`, parseError)
          // Continue to next model
        }
      } catch (modelError) {
        console.error(`Error with model ${model} for chunk ${chunkId}:`, modelError)
        // Continue to next model
      }
    }

    // If all models fail, return empty results
    console.error(`All models failed for chunk ${chunkId}, returning empty results`)

    const emptySkills = {
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

    const processingTime = performance.now() - startTime

    // Log the failure
    EnhancedSkillsLogger.logExtractedSkills(
      chunkText.substring(0, 200) + "...",
      emptySkills,
      `chunk-${chunkId}-failed`,
      processingTime,
    )

    return {
      skills: emptySkills,
      processingTime,
    }
  } catch (error) {
    const processingTime = performance.now() - startTime
    console.error(`Error processing chunk ${chunkId}:`, error)

    // Log the error
    EnhancedSkillsLogger.logExtractedSkills(
      chunkText.substring(0, 200) + "...",
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
      `chunk-${chunkId}-error`,
      processingTime,
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
      processingTime,
    }
  }
}

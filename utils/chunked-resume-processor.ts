"use server"

import { DocumentProcessor } from "./ai-chain"
import { EnhancedSkillsLogger } from "../utils/enhanced-skills-logger"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { performance } from "perf_hooks"
import { z } from "zod"
import { withRetry } from "../utils/api-rate-limit-handler"

// Define your schema
const skillExtractionSchema = z.object({
  technical: z.array(z.string()).default([]),
  soft:      z.array(z.string()).default([]),
  tools:     z.array(z.string()).default([]),
  frameworks:z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  other:     z.array(z.string()).default([]),
})

// Build a reusable ChatPromptTemplate using LCEL
const chunkPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert skills analyzer for the tech industry. Extract and categorize ALL skills in the JSON format below from the given resume text.

RESUME TEXT:
{chunkText}

Return ONLY a JSON object with these keys (even if empty arrays):
{
  "technical": [],
  "soft": [],
  "tools": [],
  "frameworks": [],
  "languages": [],
  "databases": [],
  "methodologies": [],
  "platforms": [],
  "other": []
}
`)

async function processResumeChunk(
  chunkText: string,
  chunkId: string
): Promise<{ skills: z.infer<typeof skillExtractionSchema>; processingTime: number }> {
  const startTime = performance.now()
  console.log(`Processing chunk ${chunkId}`)

  // Set up your LLM and LCEL chain
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY!,
    temperature: 0.1,
  })
  // Using LCEL pipe instead of LLMChain
  const chain = chunkPrompt.pipe(llm)

  // Execute with retry/backoff
  let raw: string
  try {
    raw = await withRetry(
      () =>
        chain
          .invoke({ chunkText })
          .then(response => response.content),
      { maxRetries: 2, initialDelayMs: 1000, maxDelayMs: 10000, backoffFactor: 1.5 }
    )
  } catch (err) {
    console.error(`Chunk ${chunkId} LLM error:`, err)
    raw = `{
      "technical": [],
      "soft": [],
      "tools": [],
      "frameworks": [],
      "languages": [],
      "databases": [],
      "methodologies": [],
      "platforms": [],
      "other": []
    }`
  }

  // Extract JSON substring
  const jsonMatch = raw.match(/\{[\s\S]*\}$/)
  const jsonText = jsonMatch ? jsonMatch[0] : raw

  // Parse + validate
  let skills
  try {
    const parsed = JSON.parse(jsonText)
    skills = skillExtractionSchema.parse(parsed)
  } catch (e) {
    console.error(`Chunk ${chunkId} parse/validation failed`, e)
    skills = skillExtractionSchema.parse({})
  }

  const processingTime = performance.now() - startTime
  EnhancedSkillsLogger.logExtractedSkills(
    chunkText.slice(0, 200) + "...",
    skills,
    `chunk-${chunkId}`,
    processingTime
  )

  return { skills, processingTime }
}

export async function processResumeInChunks(
  resumeText: string,
  chunkSize = 2000,
  overlap = 500
): Promise<{
  skills: z.infer<typeof skillExtractionSchema>
  processingTime: number
}> {
  const totalStart = performance.now()
  console.log(`Resume length ${resumeText.length}, chunkSize ${chunkSize}`)

  if (resumeText.length <= chunkSize) {
    return processResumeChunk(resumeText, "full")
  }

  const chunks = await DocumentProcessor.loadAndChunk(resumeText, chunkSize, overlap)
  console.log(`Split into ${chunks.length} chunks`)

  const results = await Promise.all(
    chunks.map((c, i) => processResumeChunk(c.text, `${i + 1}/${chunks.length}`))
  )

  // Merge unique
  const merged = Object.fromEntries(
    Object.keys(skillExtractionSchema.shape).map((key) => [
      key,
      Array.from(new Set(results.flatMap(r => (r.skills as any)[key]))),
    ])
  ) as z.infer<typeof skillExtractionSchema>

  const totalTime = performance.now() - totalStart
  EnhancedSkillsLogger.logExtractedSkills(
    resumeText.slice(0, 200) + "...",
    merged,
    "chunked-resume-processing",
    totalTime
  )

  return { skills: merged, processingTime: totalTime }
}
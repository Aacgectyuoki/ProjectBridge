"use server"

import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { withRetry } from "@/utils/api-rate-limit-handler"
import { jobSkillExtractionPrompt } from "@/utils/ai-chain/prompts/skill-extraction-prompts"
import { SkillsSchema, type ExtractedSkills } from "@/utils/ai-chain/schemas/skill-extraction-schema"
import { OutputParser } from "@/utils/ai-chain/output-parser"
import { extractJsonFromText, safeParseJSON } from "@/utils/enhanced-json-repair"
import { extractSkillsFromJobDescription } from "@/utils/fallback-skill-extraction"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"
import { SkillsLogger } from "@/utils/skills-logger"

const defaultSkills: ExtractedSkills = {
  technical: [], soft: [], tools: [], frameworks: [], languages: [],
  databases: [], methodologies: [], platforms: [], other: [],
}

export async function extractJobSkillsChain(
  jobDescription: string
): Promise<{ skills: ExtractedSkills; processingTime: number }> {
  const startTime = performance.now()

  // 1) Build a parser that can recover from broken JSON
  const parser = new OutputParser<ExtractedSkills>(
    SkillsSchema,
    "job-skills-parser",
    (raw: string) => {
      const j = extractJsonFromText(raw) ?? safeParseJSON(raw, defaultSkills)
      return {
        technical:    Array.isArray(j.technical)    ? j.technical    : [],
        soft:         Array.isArray(j.soft)         ? j.soft         : [],
        tools:        Array.isArray(j.tools)        ? j.tools        : [],
        frameworks:   Array.isArray(j.frameworks)   ? j.frameworks   : [],
        languages:    Array.isArray(j.languages)    ? j.languages    : [],
        databases:    Array.isArray(j.databases)    ? j.databases    : [],
        methodologies:Array.isArray(j.methodologies)? j.methodologies: [],
        platforms:    Array.isArray(j.platforms)    ? j.platforms    : [],
        other:        Array.isArray(j.other)        ? j.other        : [],
      }
    }
  )

  // 2) Turn your free-form prompt into a ChatPromptTemplate
  //    Make sure jobSkillExtractionPrompt uses `{text}` for interpolation
  const tpl = ChatPromptTemplate.fromTemplate(
    typeof jobSkillExtractionPrompt === "string"
      ? jobSkillExtractionPrompt
      : jobSkillExtractionPrompt.format({ text: "{text}" }) // use the format method to get the template string
  )

  // 3) Spin up the model
  const llm = new ChatOpenAI({
    modelName:    "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY!,
    temperature:  0.2,
  })

  // 4) Actually run it, under your retry wrapper
  let raw: string
  try {
    raw = await withRetry(
      async () => {
        // formatPromptValue gives us a PromptValue...
        const promptValue = await tpl.formatPromptValue({ text: jobDescription })
        // then convert to messages and call
        const msg = promptValue.toChatMessages()
        const resp = await llm.call(msg)
        return resp.text
      },
      { maxRetries: 3, initialDelayMs: 2000, maxDelayMs: 10000 }
    )
  } catch (err) {
    console.warn("LLM chain failed, falling back to regex extractor:", err)
    raw = JSON.stringify(extractSkillsFromJobDescription(jobDescription))
  }

  // 5) Parse (or fallback)
  let skills: ExtractedSkills
  try {
    skills = await parser.parse(raw)
  } catch {
    skills = extractSkillsFromJobDescription(jobDescription)
  }

  const processingTime = performance.now() - startTime

  // 6) Log and return
  EnhancedSkillsLogger.logExtractedSkills(jobDescription, skills, "job-description", processingTime)
  SkillsLogger.logSkills({
    source:          "job-description",
    technicalSkills: [
      ...skills.technical,
      ...skills.tools,
      ...skills.frameworks,
      ...skills.languages,
      ...skills.databases,
      ...skills.platforms,
    ],
    softSkills: skills.soft,
    timestamp:  new Date().toISOString(),
  })

  return { skills, processingTime }
}

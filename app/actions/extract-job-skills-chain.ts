"use server"

// import { generateText } from "ai"
// import { LangChain } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { Chain } from "@/utils/ai-chain/chain"
import { OutputParser } from "@/utils/ai-chain/output-parser"
import { jobSkillExtractionPrompt } from "@/utils/ai-chain/prompts/skill-extraction-prompts"
import { SkillsSchema, type ExtractedSkills } from "@/utils/ai-chain/schemas/skill-extraction-schema"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"
import { SkillsLogger } from "@/utils/skills-logger"
import { safeParseJSON, extractJsonFromText } from "@/utils/enhanced-json-repair"
import { withRetry, isRateLimitError } from "@/utils/api-rate-limit-handler"
import { repairJSON } from "@/utils/repair-json"
// Import the new fallback extraction function
import { extractSkillsFromJobDescription } from "@/utils/fallback-skill-extraction"

/**
 * Try different models in sequence until one works
 */
const defaultSkills: ExtractedSkills = {
  technical: [], soft: [], tools: [], frameworks: [], languages: [],
  databases: [], methodologies: [], platforms: [], other: [],
}

export async function extractJobSkillsChain(
  jobDescription: string
): Promise<{ skills: ExtractedSkills; processingTime: number }> {
  const startTime = performance.now()

  // 1) Build fallback-capable parser
  const parser = new OutputParser<ExtractedSkills>(
    SkillsSchema,
    "job-skills-parser",
    (raw: string) => {
      const j = extractJsonFromText(raw) ?? safeParseJSON(raw, defaultSkills)
      return {
        technical: Array.isArray(j.technical) ? j.technical : [],
        soft:      Array.isArray(j.soft)      ? j.soft      : [],
        tools:     Array.isArray(j.tools)     ? j.tools     : [],
        frameworks:Array.isArray(j.frameworks)? j.frameworks: [],
        languages: Array.isArray(j.languages) ? j.languages : [],
        databases: Array.isArray(j.databases) ? j.databases : [],
        methodologies: Array.isArray(j.methodologies) ? j.methodologies : [],
        platforms: Array.isArray(j.platforms) ? j.platforms : [],
        other:     Array.isArray(j.other)     ? j.other     : [],
      }
    }
  )

  // 2) Convert the jobSkillExtractionPrompt to ChatPromptTemplate
  // Note: Make sure jobSkillExtractionPrompt uses {text} instead of {{text}} for variables
  const promptTemplate = ChatPromptTemplate.fromTemplate(jobSkillExtractionPrompt)

  // 3) Instantiate the OpenAI client
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY!,
    temperature: 0.2,
  })

  // 4) Wire up the chain using LCEL pipe
  const chain = promptTemplate.pipe(llm)

  // 5) Execute inside your retry wrapper
  let raw: string
  try {
    const response = await withRetry(
      () =>
        chain
          .invoke({ text: jobDescription })
          .then(result => {
            // result.content can be string or MessageContentComplex[]
            let text: string;
            if (typeof result.content === "string") {
              text = result.content;
            } else if (Array.isArray(result.content)) {
              text = result.content.map(part => typeof part === "string" ? part : part.text ?? "").join("");
            } else if (typeof result.content === "object" && result.content !== null && "text" in result.content) {
              text = (result.content as any).text ?? "";
            } else {
              text = "";
            }
            return { text };
          }),
      { maxRetries: 3, initialDelayMs: 2000, maxDelayMs: 10000 }
    )
    raw = response.text
  } catch (err) {
    console.warn("Chain failed, falling back to regex:", err)
    raw = JSON.stringify(extractSkillsFromJobDescription(jobDescription))
  }

  // 6) Parse the LLM output
  let skills: ExtractedSkills
  try {
    skills = await parser.parse(raw)
  } catch {
    skills = extractSkillsFromJobDescription(jobDescription)
  }

  const processingTime = performance.now() - startTime

  // 7) Log and return
  EnhancedSkillsLogger.logExtractedSkills(jobDescription, skills, "job-description", processingTime)
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

  return { skills, processingTime }
}
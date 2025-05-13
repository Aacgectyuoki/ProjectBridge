"use server"

import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { safeParseJSON } from "@/utils/enhanced-json-repair"
import { withRetry, isRateLimitError } from "@/utils/api-rate-limit-handler"
import { preprocessForSkillExtraction } from "@/utils/text-preprocessor"

export type ExtractedSkills = {
  technical: string[]
  soft?: string[]
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
  tools: [],
  frameworks: [],
  languages: [],
  databases: [],
  methodologies: [],
  platforms: [],
  other: [],
}

const MODEL_OPTIONS = {
  primary: "gpt-4o-mini",
  fallback: "gpt-4o-mini", // you can swap to a smaller model if desired
}

export async function extractSkills(
  text: string,
  source: "resume" | "job" = "resume"
): Promise<ExtractedSkills> {
  // 1) Preprocess
  const preprocessed = preprocessForSkillExtraction(text)

  // 2) Build prompt template using ChatPromptTemplate
  const promptTemplate = ChatPromptTemplate.fromTemplate(
    source === "resume" ? getResumeSkillsPrompt() : getJobSkillsPrompt()
  )

  // 3) Init LLM
  const llm = new ChatOpenAI({
    modelName: MODEL_OPTIONS.primary,
    openAIApiKey: process.env.OPENAI_API_KEY!,
    temperature: 0.1,
  })

  // 4) Create chain using LCEL
  const chain = promptTemplate.pipe(llm)

  // 5) Call under retry
  let raw: string
  try {
    const response = await withRetry(
      () =>
        chain.invoke({ body: preprocessed }).then((res) => {
          let text: string
          if (typeof res.content === "string") {
            text = res.content
          } else if (Array.isArray(res.content)) {
            text = res.content.map((c) => (typeof c === "string" ? c : c.text ?? "")).join("")
          } else if (typeof res.content === "object" && res.content !== null && "text" in res.content) {
            text = (res.content as any).text ?? ""
          } else {
            text = ""
          }
          return { text }
        }),
      {
        maxRetries: 3,
        initialDelayMs: 2000,
        maxDelayMs: 10000,
      }
    )
    raw = response.text
  } catch (e) {
    console.warn("Primary LLM failed, falling back to simpler JSON:", e)
    raw = "{}"
  }

  // 6) Clean to start/end brace
  let cleaned = raw.trim()
  const first = cleaned.indexOf("{")
  const last = cleaned.lastIndexOf("}")
  if (first > 0) cleaned = cleaned.slice(first)
  if (last !== -1 && last < cleaned.length - 1) cleaned = cleaned.slice(0, last + 1)

  // 7) Parse with repair
  const result = safeParseJSON<ExtractedSkills>(cleaned, defaultExtractedSkills)
  return result
}

function getResumeSkillsPrompt() {
  return `
You are an expert skills analyzer. Extract ALL skills from the following resume text provided in the "body" variable.

{body}

Return ONLY a JSON object with these keys (arrays of strings):
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

Use double quotes, no prose, and ensure it's valid JSON.`
}

function getJobSkillsPrompt() {
  return `
You are an expert skills analyzer. Extract ALL skills required or mentioned in the following job description text provided in the "body" variable.

{body}

Return ONLY a JSON object with these keys (arrays of strings):
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

Use double quotes, no prose, and ensure it's valid JSON.`
}
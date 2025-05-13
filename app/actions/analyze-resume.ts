"use server"

// import { generateText } from "ai"
// import { LangChain } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { safeParseJSON } from "@/utils/enhanced-json-repair"
import { withRetry } from "@/utils/api-rate-limit-handler"

export type ResumeAnalysisResult = {
  skills: {
    technical: string[]
    soft?: string[]
    tools?: string[]
    frameworks?: string[]
    languages?: string[]
    databases?: string[]
    methodologies?: string[]
    platforms?: string[]
    other?: string[]
  }
  contactInfo: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  education?: {
    degree?: string
    institution?: string
    year?: string
  }[]
  experience?: {
    title?: string
    company?: string
    duration?: string
    description?: string
    keyAchievements?: string[]
    startDate?: string
    endDate?: string
  }[]
  summary?: string
  strengths?: string[]
  weaknesses?: string[]
  projects?: {
    name: string
    description: string
    technologies: string[]
    date?: string
  }[]
}

const defaultResumeAnalysisResult: ResumeAnalysisResult = {
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
  contactInfo: {},
  education: [],
  experience: [],
  summary: "",
  strengths: [],
  weaknesses: [],
  projects: [],
}

/**
 * Analyzes a resume and extracts key information
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  // 1) build your prompt template using ChatPromptTemplate
  const resumePrompt = ChatPromptTemplate.fromTemplate(`
You are a JSON-only resume parser. Given this resume text, extract:

1) skills (technical & soft)
2) contactInfo (name,email,phone,location,LinkedIn,GitHub,website)
3) education history
4) experience
5) summary
6) strengths
7) weaknesses
8) projects

Return ONLY the JSON object matching this shape:

{
  "skills":{"technical": [],"soft":[]},
  "contactInfo":{},
  "education":[],
  "experience":[],
  "summary":"…",
  "strengths":[],
  "weaknesses":[],
  "projects":[]
}

{resume}
`)

  // 2) instantiate your OpenAI client
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.2,
  })

  // 3) wire up a chain using LCEL pipe
  const chain = resumePrompt.pipe(llm)

  try {
    // 4) run it with invoke
    const response = await chain.invoke({ resume: resumeText })
    const raw = response.content

    // 5) now parse/repair
    return safeParseJSON(String(raw), defaultResumeAnalysisResult)
  } catch (e) {
    console.error("analyzeResume failed:", e)
    return defaultResumeAnalysisResult
  }
}
"use server"

// import { generateText } from "ai"
// import { LangChain } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { categorizeAISkill, getSkillConfidence } from "@/utils/ai-skills-taxonomy"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"

export type EnhancedExtractedSkills = {
  technical: Array<{ name: string; confidence: number }>
  soft: Array<{ name: string; confidence: number }>
  tools: Array<{ name: string; confidence: number }>
  frameworks: Array<{ name: string; confidence: number }>
  languages: Array<{ name: string; confidence: number }>
  databases: Array<{ name: string; confidence: number }>
  methodologies: Array<{ name: string; confidence: number }>
  platforms: Array<{ name: string; confidence: number }>
  ai_concepts: Array<{ name: string; confidence: number }>
  ai_infrastructure: Array<{ name: string; confidence: number }>
  ai_agents: Array<{ name: string; confidence: number }>
  ai_engineering: Array<{ name: string; confidence: number }>
  ai_data: Array<{ name: string; confidence: number }>
  ai_applications: Array<{ name: string; confidence: number }>
  other: Array<{ name: string; confidence: number }>
}

const defaultEnhancedExtractedSkills: EnhancedExtractedSkills = {
  technical: [],
  soft: [],
  tools: [],
  frameworks: [],
  languages: [],
  databases: [],
  methodologies: [],
  platforms: [],
  ai_concepts: [],
  ai_infrastructure: [],
  ai_agents: [],
  ai_engineering: [],
  ai_data: [],
  ai_applications: [],
  other: [],
}

/**
 * Enhanced skill extraction with AI-specific taxonomy and confidence scoring
 */
export async function enhancedExtractSkills(
  text: string,
  source: "resume" | "job" = "resume",
): Promise<EnhancedExtractedSkills> {
  const startTime = performance.now()

  // 1) Build a ChatPromptTemplate with proper LCEL format
  const skillPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert skills analyzer for the AI and tech industry. Your task is to extract and categorize all skills mentioned in the following ${source === "resume" ? "resume" : "job description"}.

Text:
{text}

Extract ALL skills mentioned, including:
1. Technical skills (programming, engineering, data analysis, etc.)
2. Soft skills (communication, leadership, etc.)
3. Tools (specific software, platforms, etc.)
4. Frameworks and libraries
5. Programming languages
6. Databases
7. Methodologies (Agile, Scrum, etc.)
8. Platforms (cloud services, operating systems, etc.)
9. AI-specific skills (machine learning, NLP, computer vision, etc.)
10. Other relevant skills

Guidelines:
- Be comprehensive—even one-offs.
- Resolve abbreviations (AWS → Amazon Web Services).
- Use the most specific category available.
- Return ONLY a JSON object with shape:
{
  "technical": ["skill1", ...],
  "soft": ["skill1", ...],
  "tools": ["tool1", ...],
  "frameworks": ["framework1", ...],
  "languages": ["lang1", ...],
  "databases": ["db1", ...],
  "methodologies": ["meth1", ...],
  "platforms": ["plat1", ...],
  "other": ["other1", ...]
}
`)

  // 2) Spin up an OpenAI LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",           // or whichever you prefer
    openAIApiKey: process.env.OPENAI_API_KEY!,
    temperature: 0.1,
  })

  // 3) Wire up the chain using LCEL pipe
  const chain = skillPrompt.pipe(llm)

  // 4) Execute the chain using invoke
  let raw: string
  try {
    const response = await chain.invoke({ text, source })
    if (typeof response.content === "string") {
      raw = response.content
    } else if (Array.isArray(response.content)) {
      raw = response.content.map((c: any) => (typeof c === "string" ? c : c.text ?? "")).join(" ")
    } else if (typeof response.content === "object" && response.content !== null && "text" in response.content) {
      raw = (response.content as any).text ?? ""
    } else {
      raw = ""
    }
  } catch (e) {
    console.error("LangChain error:", e)
    raw = ""  // fallback to empty so we hit regex path below
  }

  // 5) Parse JSON or fallback
  let extracted: Record<string, any> | null = null
  try {
    extracted = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) {
      try { extracted = JSON.parse(m[0]) } catch {}
    }
  }
  if (!extracted) {
    console.log("Falling back to regex extraction")
    extracted = extractSkillsWithRegex(text)
  }

  // 6) Build enhanced result
  const enhanced = { ...defaultEnhancedExtractedSkills }
  Object.entries(extracted).forEach(([cat, list]) => {
    if (Array.isArray(list)) {
      list.forEach((skill: string) => {
        if (!skill || typeof skill !== "string") return
        const confidence = getSkillConfidence(skill, text)
        enhanced[cat as keyof EnhancedExtractedSkills].push({ name: skill, confidence })
        categorizeAISkill(skill).forEach((aiCat) => {
          const key = `ai_${aiCat}` as keyof EnhancedExtractedSkills
          if (enhanced[key]) enhanced[key].push({ name: skill, confidence })
        })
      })
    }
  })

  // 7) Log and return
  EnhancedSkillsLogger.logExtractedSkills(
    text,
    enhanced,
    `enhanced-${source}-extraction`,
    Math.round(performance.now() - startTime),
  )
  return enhanced
}

/**
 * Fallback function to extract skills using regex patterns
 */
function extractSkillsWithRegex(text: string): any {
  const normalizedText = text.toLowerCase()

  const extractedSkills = {
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

  // Common programming languages
  const languages = [
    "javascript",
    "typescript",
    "python",
    "java",
    "c\\+\\+",
    "c#",
    "ruby",
    "go",
    "rust",
    "php",
    "swift",
    "kotlin",
  ]
  languages.forEach((lang) => {
    const regex = new RegExp(`\\b${lang}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.languages.push(lang.charAt(0).toUpperCase() + lang.slice(1).replace("\\+\\+", "++"))
    }
  })

  // Common frameworks
  const frameworks = [
    "react",
    "angular",
    "vue",
    "next.js",
    "express",
    "django",
    "flask",
    "spring",
    "tensorflow",
    "pytorch",
    "langchain",
  ]
  frameworks.forEach((framework) => {
    const regex = new RegExp(`\\b${framework}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.frameworks.push(framework.charAt(0).toUpperCase() + framework.slice(1))
    }
  })

  // Common databases
  const databases = [
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "dynamodb",
    "redis",
    "cassandra",
    "sqlite",
    "oracle",
    "vector database",
  ]
  databases.forEach((db) => {
    const regex = new RegExp(`\\b${db}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.databases.push(db.charAt(0).toUpperCase() + db.slice(1))
    }
  })

  // Common AI terms
  const aiTerms = [
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
    "ai",
    "ml",
    "neural network",
    "llm",
    "large language model",
    "rag",
    "retrieval augmented generation",
  ]
  aiTerms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.technical.push(term.charAt(0).toUpperCase() + term.slice(1))
    }
  })

  // Common soft skills
  const softSkills = [
    "leadership",
    "communication",
    "teamwork",
    "problem solving",
    "critical thinking",
    "time management",
    "collaboration",
    "adaptability",
  ]
  softSkills.forEach((skill) => {
    const regex = new RegExp(`\\b${skill}\\b`, "i")
    if (regex.test(normalizedText)) {
      extractedSkills.soft.push(skill.charAt(0).toUpperCase() + skill.slice(1))
    }
  })

  return extractedSkills
}
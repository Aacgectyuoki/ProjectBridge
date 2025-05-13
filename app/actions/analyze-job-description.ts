"use server"

// import { generateText } from "ai"
// import { LangChain } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { SkillsLogger } from "@/utils/skills-logger"
// Update the import to use the enhanced JSON repair utility
import { safeParseJSON, extractJsonFromText } from "@/utils/enhanced-json-repair"
import { withRetry, isRateLimitError } from "@/utils/api-rate-limit-handler"

export type JobAnalysisResult = {
  
  title: string
  company: string
  location: string
  jobType: string
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  qualifications: {
    required: string[]
    preferred: string[]
  }
  experience: {
    level: string
    years: string
  }
  education: string
  salary: string
  benefits: string[]
  summary: string
  keywordsDensity: {
    keyword: string
    count: number
  }[]
}

// Default empty structure to ensure consistent shape
const defaultJobAnalysisResult: JobAnalysisResult = {
  title: "",
  company: "",
  location: "",
  jobType: "",
  requiredSkills: [],
  preferredSkills: [],
  responsibilities: [],
  qualifications: {
    required: [],
    preferred: [],
  },
  experience: {
    level: "",
    years: "",
  },
  education: "",
  salary: "",
  benefits: [],
  summary: "",
  keywordsDensity: [],
}

/**
 * Fallback skill extraction using keyword matching
 */
function extractSkillsFromText(text: string): { requiredSkills: string[]; preferredSkills: string[] } {
  const normalizedText = text.toLowerCase()
  const requiredSkills: string[] = []
  const preferredSkills: string[] = []

  // Common technical skills to look for
  const technicalSkills = [
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "go",
    "rust",
    "react",
    "angular",
    "vue",
    "node.js",
    "express",
    "django",
    "flask",
    "spring",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "terraform",
    "jenkins",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "redis",
    "elasticsearch",
    "machine learning",
    "data science",
    "artificial intelligence",
    "deep learning",
    "devops",
    "ci/cd",
    "git",
    "agile",
    "scrum",
    "kanban",
  ]

  // Common soft skills to look for
  const softSkills = [
    "communication",
    "teamwork",
    "leadership",
    "problem solving",
    "critical thinking",
    "time management",
    "adaptability",
    "creativity",
    "collaboration",
    "presentation",
  ]

  // Check for technical skills
  technicalSkills.forEach((skill) => {
    if (normalizedText.includes(skill.toLowerCase())) {
      // If the skill is mentioned with "required" nearby, add to required skills
      const context = normalizedText.substring(
        Math.max(0, normalizedText.indexOf(skill.toLowerCase()) - 50),
        Math.min(normalizedText.length, normalizedText.indexOf(skill.toLowerCase()) + 50),
      )

      if (
        context.includes("required") ||
        context.includes("must have") ||
        context.includes("necessary") ||
        context.includes("essential")
      ) {
        requiredSkills.push(skill)
      } else if (
        context.includes("preferred") ||
        context.includes("nice to have") ||
        context.includes("plus") ||
        context.includes("bonus")
      ) {
        preferredSkills.push(skill)
      } else {
        // Default to required if we can't determine
        requiredSkills.push(skill)
      }
    }
  })

  // Check for soft skills (usually preferred)
  softSkills.forEach((skill) => {
    if (normalizedText.includes(skill.toLowerCase())) {
      preferredSkills.push(skill)
    }
  })

  return { requiredSkills, preferredSkills }
}

/**
 * Try different models in sequence until one works
 */
// async function tryModelsInSequence(
//   prompt: string,
//   system: string,
//   apiKey: string,
//   models = ["llama3-8b-8192", "mixtral-8x7b-32768", "llama3-70b-8192"],
// ): Promise<string> {
//   let lastError: Error | null = null

//   for (const model of models) {
//     try {
//       console.log(`Trying model: ${model}`)

//       const text = await withRetry(
//         async () => {
//           const response = await generateText({
//             model: groq(model, { apiKey }),
//             prompt,
//             temperature: 0.2,
//             maxTokens: 1500, // Reduced from 2048 to stay under rate limits
//             system,
//           })
//           return response.text
//         },
//         {
//           maxRetries: 3,
//           initialDelayMs: 3000,
//           maxDelayMs: 15000,
//         },
//       )

//       console.log(`Successfully used model: ${model}`)
//       return text
//     } catch (error) {
//       console.warn(`Error with model ${model}:`, error)
//       lastError = error instanceof Error ? error : new Error(String(error))

//       // If it's not a rate limit error, try the next model
//       // If it is a rate limit error, the withRetry function already tried with backoff
//       if (!isRateLimitError(error)) {
//         continue
//       }
//     }
//   }

//   // If all models failed, throw the last error
//   throw lastError || new Error("All models failed")
// }

export async function analyzeJobDescription(jobDescriptionText: string): Promise<JobAnalysisResult> {
  // 1) instantiate the OpenAI LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // 2) build your prompt template using ChatPromptTemplate
  const template = ChatPromptTemplate.fromTemplate(`
You are a JSON-only bot. Analyze the following job description and output a single JSON object with keys:
title, company, location, jobType, requiredSkills, preferredSkills,
responsibilities, qualifications, experience, education, salary,
benefits, summary, keywordsDensity.

Job Description:
{jobDescription}

Return *only* valid JSON—no extra text.`);

  // 3) wire up the chain using LCEL pipe
  const chain = template.pipe(llm);

  // 4) invoke the chain
  const response = await chain.invoke({ jobDescription: jobDescriptionText });
  const raw = response.content;

  // 5) extract or parse JSON
  let parsed: any;
  const maybe = extractJsonFromText(typeof raw === "string" ? raw : String(raw));
  if (maybe) {
    parsed = maybe;
  } else {
    try {
      parsed = JSON.parse(typeof raw === "string" ? raw : String(raw));
    } catch {
      parsed = safeParseJSON(String(raw), defaultJobAnalysisResult);
    }
  }

  // 6) enforce your TS shape & defaults
  const result = ensureValidStructure(parsed);

  // 7) log skills
  if (result.requiredSkills.length || result.preferredSkills.length) {
    SkillsLogger.logSkills({
      source: "job-description",
      technicalSkills: [...result.requiredSkills, ...result.preferredSkills],
      softSkills: [],
      timestamp: new Date().toISOString(),
      sessionId:
        typeof window !== "undefined"
          ? localStorage.getItem("currentAnalysisSession") || "unknown"
          : "server",
    });
  }

  return result;
}


/**
 * Ensure the result has the expected structure
 */
function ensureValidStructure(result: any): JobAnalysisResult {
  // If the AI failed to extract skills, use our fallback method
  if (
    (!result.requiredSkills || result.requiredSkills.length === 0) &&
    (!result.preferredSkills || result.preferredSkills.length === 0)
  ) {
    console.log("AI failed to extract skills, using fallback extraction")
    const extractedSkills = extractSkillsFromText(result.summary || "")
    result.requiredSkills = extractedSkills.requiredSkills
    result.preferredSkills = extractedSkills.preferredSkills
  }

  // Log the extracted skills
  if (result.requiredSkills?.length > 0 || result.preferredSkills?.length > 0) {
    const sessionId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("currentAnalysisSession") || "unknown_session"
        : "server_session"

    SkillsLogger.logSkills({
      source: "job-description",
      technicalSkills: [...(result.requiredSkills || []), ...(result.preferredSkills || [])].filter(Boolean),
      softSkills: [],
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
    })
    console.log("Logged job description skills:", [...(result.requiredSkills || []), ...(result.preferredSkills || [])])
  }

  // Ensure the result has the expected structure
  return {
    title: result.title || defaultJobAnalysisResult.title,
    company: result.company || defaultJobAnalysisResult.company,
    location: result.location || defaultJobAnalysisResult.location,
    jobType: result.jobType || defaultJobAnalysisResult.jobType,
    requiredSkills: result.requiredSkills || defaultJobAnalysisResult.requiredSkills,
    preferredSkills: result.preferredSkills || defaultJobAnalysisResult.preferredSkills,
    responsibilities: result.responsibilities || defaultJobAnalysisResult.responsibilities,
    qualifications: {
      required: result.qualifications?.required || defaultJobAnalysisResult.qualifications.required,
      preferred: result.qualifications?.preferred || defaultJobAnalysisResult.qualifications.preferred,
    },
    experience: {
      level: result.experience?.level || defaultJobAnalysisResult.experience.level,
      years: result.experience?.years || defaultJobAnalysisResult.experience.years,
    },
    education: result.education || defaultJobAnalysisResult.education,
    salary: result.salary || defaultJobAnalysisResult.salary,
    benefits: result.benefits || defaultJobAnalysisResult.benefits,
    summary: result.summary || defaultJobAnalysisResult.summary,
    keywordsDensity: result.keywordsDensity || defaultJobAnalysisResult.keywordsDensity,
  }
}

"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
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

  try {
    // First, use the LLM to extract skills
    const prompt = `
      You are an expert skills analyzer for the AI and tech industry. Your task is to extract and categorize all skills mentioned in the following ${source === "resume" ? "resume" : "job description"}.

      ${source === "resume" ? "RESUME" : "JOB DESCRIPTION"}:
      ${text}

      Extract ALL skills mentioned in the text, including:
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

      Important guidelines:
      - Be comprehensive and extract ALL skills, even if they're only mentioned once
      - Resolve abbreviations to their full forms (e.g., "AWS" → "Amazon Web Services")
      - Include both technical and non-technical skills
      - Categorize each skill appropriately
      - If a skill could fit in multiple categories, place it in the most specific one
      - Do not include generic terms that aren't specific skills
      - For AI skills, be very specific and detailed

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

      IMPORTANT: Return ONLY the JSON object without ANY additional text, explanation, or markdown formatting.
      The response MUST be a valid JSON object that can be parsed with JSON.parse().
    `

    const { text: responseText } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.1,
      maxTokens: 2048,
    })

    // Parse the JSON response
    let extractedSkills
    try {
      extractedSkills = JSON.parse(responseText)
    } catch (error) {
      console.error("Error parsing LLM response:", error)
      // Try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          extractedSkills = JSON.parse(jsonMatch[0])
        } catch (innerError) {
          console.error("Error parsing extracted JSON:", innerError)
          extractedSkills = null
        }
      }
    }

    // If we couldn't parse the JSON, use a fallback
    if (!extractedSkills) {
      console.log("Using fallback skill extraction")
      extractedSkills = extractSkillsWithRegex(text)
    }

    // Now enhance the extracted skills with our AI taxonomy
    const enhancedSkills: EnhancedExtractedSkills = { ...defaultEnhancedExtractedSkills }

    // Process each category from the LLM extraction
    Object.entries(extractedSkills).forEach(([category, skills]) => {
      if (Array.isArray(skills)) {
        skills.forEach((skill) => {
          if (typeof skill === "string" && skill.trim()) {
            const confidence = getSkillConfidence(skill, text)

            // Add to the original category
            enhancedSkills[category].push({ name: skill, confidence })

            // Also categorize using our AI taxonomy
            const aiCategories = categorizeAISkill(skill)
            aiCategories.forEach((aiCategory) => {
              if (aiCategory !== "other" && enhancedSkills[`ai_${aiCategory}`]) {
                enhancedSkills[`ai_${aiCategory}`].push({ name: skill, confidence })
              }
            })
          }
        })
      }
    })

    // Log the extraction process
    const processingTime = performance.now() - startTime
    EnhancedSkillsLogger.logExtractedSkills(
      text,
      enhancedSkills,
      `enhanced-${source}-extraction`,
      Math.round(processingTime),
    )

    return enhancedSkills
  } catch (error) {
    console.error("Error in enhanced skill extraction:", error)

    // Use fallback extraction
    const fallbackSkills = extractSkillsWithRegex(text)
    const enhancedSkills: EnhancedExtractedSkills = { ...defaultEnhancedExtractedSkills }

    // Convert fallback skills to enhanced format
    Object.entries(fallbackSkills).forEach(([category, skills]) => {
      if (Array.isArray(skills)) {
        skills.forEach((skill) => {
          if (typeof skill === "string" && skill.trim()) {
            enhancedSkills[category].push({ name: skill, confidence: 0.5 })
          }
        })
      }
    })

    return enhancedSkills
  }
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

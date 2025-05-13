// import { generateText } from "ai"
// import { LangChain } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { withRetry } from "./api-rate-limit-handler"

export type SkillEmbedding = {
  skill: string
  embedding: number[]
  category: string
}

export type SkillSimilarity = {
  skill1: string
  skill2: string
  similarity: number
  relationship: "identical" | "similar" | "related" | "subset" | "superset" | "different"
}

// Cache for embeddings to avoid redundant API calls
const embeddingCache = new Map<string, number[]>()

/**
 * Predefined skill relationships to supplement embedding-based matching
 */
const SKILL_RELATIONSHIPS = [
  // AI Infrastructure relationships
  { from: ["langchain", "aws lambda", "vector db"], to: "ai infrastructure deployment", confidence: 0.85 },
  { from: ["langchain", "aws lambda"], to: "llm hosting", confidence: 0.8 },
  { from: ["docker", "kubernetes", "aws", "ci/cd", "llm"], to: "ai infrastructure deployment", confidence: 0.9 },
  { from: ["langchain", "agents", "tools"], to: "agentic workflow", confidence: 0.9 },
  { from: ["langchain", "function calling", "tools"], to: "auto-agent", confidence: 0.85 },
  { from: ["langchain", "multi-agent"], to: "multi-agent coordination", confidence: 0.9 },
  { from: ["llm", "chain of thought", "prompt engineering"], to: "reasoning", confidence: 0.8 },
  { from: ["llm", "few-shot learning"], to: "reasoning", confidence: 0.75 },
  { from: ["pytorch", "tensorflow", "data generation"], to: "synthetic data training", confidence: 0.8 },
  { from: ["deployed", "ai", "production"], to: "launched ai products to production", confidence: 0.9 },
]

// Initialize OpenAI model
const llm = new ChatOpenAI({
  temperature: 0.2, // Lower temperature for more deterministic embeddings
  modelName: "gpt-4o-mini",
  openAIApiKey: process.env.OPENAI_API_KEY
});

// Create a prompt template for embeddings
const embeddingPrompt = ChatPromptTemplate.fromTemplate(`Generate a JSON array of 384 floating point numbers representing a normalized embedding for this technical skill:
Skill: {skill}

Return only the JSON array, nothing else.`);

// Create the chain using LCEL
const embedChain = embeddingPrompt.pipe(llm);

/**
 * Generates embeddings for a skill using LCEL
 */
export async function generateSkillEmbedding(skill: string): Promise<number[]> {
  const key = skill.toLowerCase().trim()
  if (embeddingCache.has(key)) return embeddingCache.get(key)!

  try {
    // Call the chain under retry
    const start = performance.now()
    const response = await withRetry(
      () => embedChain.invoke({ skill }),
      { maxRetries: 2 }
    )
    console.log(`Embedding generated in ${performance.now() - start}ms`)

    // extract and normalize
    const responseText = response.content
    const match = responseText.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("No array in response")
    const raw = JSON.parse(match[0]) as number[]
    const mag = Math.sqrt(raw.reduce((sum, v) => sum + v * v, 0))
    const normalized = raw.map(v => v / mag)
    embeddingCache.set(key, normalized)
    return normalized
  } catch (err) {
    console.error("Embedding failed, falling back:", err)
    // fallback to random
    const fallback = Array.from({ length: 384 }, () => Math.random() * 2 - 1)
    const mag = Math.sqrt(fallback.reduce((s, v) => s + v * v, 0))
    const norm = fallback.map(v => v / mag)
    embeddingCache.set(key, norm)
    return norm
  }
}

/**
 * Calculates cosine similarity between two embedding vectors
 */
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same dimensions")
  }

  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    mag1 += vec1[i] * vec1[i]
    mag2 += vec2[i] * vec2[i]
  }

  mag1 = Math.sqrt(mag1)
  mag2 = Math.sqrt(mag2)

  return dotProduct / (mag1 * mag2)
}

/**
 * Determines the relationship between two skills based on their similarity score
 */
function determineRelationship(
  similarity: number,
): "identical" | "similar" | "related" | "subset" | "superset" | "different" {
  if (similarity > 0.95) return "identical"
  if (similarity > 0.85) return "similar"
  if (similarity > 0.75) return "related"
  if (similarity > 0.65) return "subset" // This is simplified; ideally we'd have directional info
  if (similarity > 0.55) return "superset"
  return "different"
}

/**
 * Compares two skills semantically using embeddings
 */
export async function compareSkills(skill1: string, skill2: string): Promise<SkillSimilarity> {
  try {
    const embedding1 = await generateSkillEmbedding(skill1)
    const embedding2 = await generateSkillEmbedding(skill2)

    const similarity = calculateCosineSimilarity(embedding1, embedding2)
    const relationship = determineRelationship(similarity)

    return {
      skill1,
      skill2,
      similarity,
      relationship,
    }
  } catch (error) {
    console.error("Error comparing skills:", error)
    return {
      skill1,
      skill2,
      similarity: 0,
      relationship: "different",
    }
  }
}

/**
 * Checks for predefined skill relationships
 */
function checkPredefinedRelationships(
  resumeSkills: string[],
  jobSkill: string,
): {
  matched: boolean
  confidence: number
  matchedSkills: string[]
} {
  // Normalize the job skill for comparison
  const normalizedJobSkill = jobSkill.toLowerCase().trim()

  // Normalize all resume skills
  const normalizedResumeSkills = resumeSkills.map((skill) => skill.toLowerCase().trim())

  // Check each predefined relationship
  for (const relationship of SKILL_RELATIONSHIPS) {
    if (normalizedJobSkill.includes(relationship.to.toLowerCase())) {
      // Check if resume skills contain all required skills for this relationship
      const matchedSkills = relationship.from.filter((requiredSkill) =>
        normalizedResumeSkills.some(
          (resumeSkill) =>
            resumeSkill.includes(requiredSkill.toLowerCase()) || requiredSkill.toLowerCase().includes(resumeSkill),
        ),
      )

      // Calculate match ratio
      const matchRatio = matchedSkills.length / relationship.from.length

      // If we have a good match (at least 70% of required skills)
      if (matchRatio >= 0.7) {
        return {
          matched: true,
          confidence: relationship.confidence * matchRatio,
          matchedSkills: matchedSkills,
        }
      }
    }
  }

  return { matched: false, confidence: 0, matchedSkills: [] }
}

/**
 * Finds semantically similar skills between two lists
 */
export async function findSemanticMatches(
  resumeSkills: string[],
  jobSkills: string[],
  similarityThreshold = 0.75,
): Promise<{
  exactMatches: string[]
  semanticMatches: Array<{
    resumeSkill: string
    jobSkill: string
    similarity: number
    relationship: string
    isIndirect?: boolean
  }>
  missingSkills: string[]
}> {
  const exactMatches: string[] = []
  const semanticMatches: Array<{
    resumeSkill: string
    jobSkill: string
    similarity: number
    relationship: string
    isIndirect?: boolean
  }> = []

  // Normalize all skills
  const normalizedResumeSkills = resumeSkills.map((s) => s.toLowerCase().trim())
  const normalizedJobSkills = jobSkills.map((s) => s.toLowerCase().trim())

  // Find exact matches first (with case-insensitive comparison)
  const remainingJobSkills = normalizedJobSkills.filter((jobSkill) => {
    const isExactMatch = normalizedResumeSkills.some((resumeSkill) => {
      // Check for exact match or common aliases
      return (
        resumeSkill === jobSkill ||
        (resumeSkill === "tensorflow" && jobSkill === "tf") ||
        (resumeSkill === "tf" && jobSkill === "tensorflow") ||
        (resumeSkill === "pytorch" && jobSkill === "torch") ||
        (resumeSkill === "torch" && jobSkill === "pytorch")
      )
    })

    if (isExactMatch) {
      exactMatches.push(jobSkill)
    }

    return !isExactMatch
  })

  // For remaining job skills, check predefined relationships first
  const stillRemainingJobSkills = remainingJobSkills.filter((jobSkill) => {
    const relationshipMatch = checkPredefinedRelationships(resumeSkills, jobSkill)

    if (relationshipMatch.matched) {
      semanticMatches.push({
        resumeSkill: relationshipMatch.matchedSkills.join(" + "),
        jobSkill,
        similarity: relationshipMatch.confidence,
        relationship: "inferred",
        isIndirect: true,
      })
      return false
    }
    return true
  })

  // For still remaining job skills, find semantic matches
  for (const jobSkill of stillRemainingJobSkills) {
    let bestMatch = {
      resumeSkill: "",
      similarity: 0,
      relationship: "different",
    }

    for (const resumeSkill of normalizedResumeSkills) {
      // Skip if already an exact match
      if (exactMatches.includes(resumeSkill)) continue

      const { similarity, relationship } = await compareSkills(resumeSkill, jobSkill)

      if (similarity > bestMatch.similarity) {
        bestMatch = {
          resumeSkill,
          similarity,
          relationship,
        }
      }
    }

    if (bestMatch.similarity >= similarityThreshold) {
      semanticMatches.push({
        resumeSkill: bestMatch.resumeSkill,
        jobSkill,
        similarity: bestMatch.similarity,
        relationship: bestMatch.relationship,
      })
    }
  }

  // Determine missing skills
  const missingSkills = stillRemainingJobSkills.filter(
    (jobSkill) => !semanticMatches.some((match) => match.jobSkill === jobSkill),
  )

  return {
    exactMatches,
    semanticMatches,
    missingSkills,
  }
}
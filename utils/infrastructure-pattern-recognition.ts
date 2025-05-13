import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"

export type InfrastructurePattern = {
  name: string
  description: string
  confidence: number
  matchedSkills: string[]
  inferredCapabilities: string[]
}

// Define infrastructure patterns
const infrastructurePatterns = [
  {
    name: "AI Application Deployment",
    requiredSkills: ["docker", "aws", "ci/cd"],
    optionalSkills: ["kubernetes", "terraform", "github actions", "gitlab ci"],
    inferredCapabilities: [
      "Containerized AI Application Deployment",
      "Cloud Infrastructure Management",
      "Automated Deployment Pipelines",
    ],
    minRequired: 3,
    minOptional: 1,
  },
  {
    name: "LLM API Infrastructure",
    requiredSkills: ["api", "openai", "fastapi", "flask", "express"],
    optionalSkills: ["redis", "mongodb", "postgresql", "rate limiting", "caching"],
    inferredCapabilities: ["LLM API Design", "API Performance Optimization", "Scalable AI Endpoints"],
    minRequired: 2,
    minOptional: 1,
  },
  {
    name: "Vector Database Implementation",
    requiredSkills: ["vector", "database", "embeddings"],
    optionalSkills: ["pinecone", "weaviate", "milvus", "qdrant", "faiss", "chroma"],
    inferredCapabilities: ["Semantic Search Implementation", "Vector Database Management", "Embedding Pipeline Design"],
    minRequired: 2,
    minOptional: 1,
  },
  {
    name: "MLOps Pipeline",
    requiredSkills: ["mlflow", "kubernetes", "docker"],
    optionalSkills: ["airflow", "kubeflow", "jenkins", "github actions", "gitlab ci"],
    inferredCapabilities: [
      "ML Model Lifecycle Management",
      "Automated Model Training Pipelines",
      "Model Deployment Automation",
    ],
    minRequired: 2,
    minOptional: 1,
  },
  {
    name: "AI Frontend Development",
    requiredSkills: ["react", "next.js", "typescript"],
    optionalSkills: ["tailwind", "chakra ui", "material ui", "streaming", "sse"],
    inferredCapabilities: [
      "Interactive AI UIs",
      "Real-time AI Response Streaming",
      "Frontend State Management for AI Applications",
    ],
    minRequired: 2,
    minOptional: 1,
  },
]

/**
 * Recognizes infrastructure patterns in resume skills
 */
export function recognizeInfrastructurePatterns(resumeAnalysis: ResumeAnalysisResult): InfrastructurePattern[] {
  const patterns: InfrastructurePattern[] = []

  // Extract all skills from resume
  const allSkills = [
    ...(resumeAnalysis.skills?.technical || []),
    ...(resumeAnalysis.skills?.tools || []),
    ...(resumeAnalysis.skills?.frameworks || []),
    ...(resumeAnalysis.skills?.languages || []),
    ...(resumeAnalysis.skills?.databases || []),
    ...(resumeAnalysis.skills?.methodologies || []),
    ...(resumeAnalysis.skills?.platforms || []),
    ...(resumeAnalysis.skills?.other || []),
  ].map((skill) => skill.toLowerCase())

  // Check each pattern
  for (const pattern of infrastructurePatterns) {
    const matchedRequiredSkills = pattern.requiredSkills.filter((requiredSkill) =>
      allSkills.some(
        (skill) => skill.includes(requiredSkill.toLowerCase()) || requiredSkill.toLowerCase().includes(skill),
      ),
    )

    const matchedOptionalSkills = pattern.optionalSkills.filter((optionalSkill) =>
      allSkills.some(
        (skill) => skill.includes(optionalSkill.toLowerCase()) || optionalSkill.toLowerCase().includes(skill),
      ),
    )

    // Check if minimum requirements are met
    if (matchedRequiredSkills.length >= pattern.minRequired && matchedOptionalSkills.length >= pattern.minOptional) {
      // Calculate confidence based on match quality
      const requiredRatio = matchedRequiredSkills.length / pattern.requiredSkills.length
      const optionalRatio = matchedOptionalSkills.length / pattern.optionalSkills.length

      // Weighted confidence calculation
      const confidence = Number.parseFloat((requiredRatio * 0.7 + optionalRatio * 0.3).toFixed(2))

      patterns.push({
        name: pattern.name,
        description: `Matched ${matchedRequiredSkills.length}/${pattern.requiredSkills.length} required skills and ${matchedOptionalSkills.length}/${pattern.optionalSkills.length} optional skills`,
        confidence,
        matchedSkills: [...matchedRequiredSkills, ...matchedOptionalSkills],
        inferredCapabilities: pattern.inferredCapabilities,
      })
    }
  }

  // Sort by confidence (highest first)
  return patterns.sort((a, b) => b.confidence - a.confidence)
}

import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"

export type InferredSkill = {
  skill: string
  confidence: number // 0-1
  inferredFrom: {
    skillCombination: string[]
    context: string
  }
  category: string
}

// Define skill combinations that imply other skills
const skillCombinations: Array<{
  requiredSkills: string[]
  impliesSkill: string
  confidence: number
  category: string
}> = [
  {
    requiredSkills: ["langchain", "aws lambda"],
    impliesSkill: "LLM Hosting",
    confidence: 0.85,
    category: "infrastructure",
  },
  {
    requiredSkills: ["rag", "langchain", "mongodb"],
    impliesSkill: "Vector Database Knowledge",
    confidence: 0.8,
    category: "databases",
  },
  {
    requiredSkills: ["docker", "aws", "ci/cd", "llm"],
    impliesSkill: "AI Infrastructure",
    confidence: 0.9,
    category: "infrastructure",
  },
  {
    requiredSkills: ["react", "next.js", "openai api"],
    impliesSkill: "AI Frontend Development",
    confidence: 0.85,
    category: "frameworks",
  },
  {
    requiredSkills: ["python", "pytorch", "hugging face"],
    impliesSkill: "Model Fine-tuning",
    confidence: 0.8,
    category: "technical",
  },
  {
    requiredSkills: ["fastapi", "openai", "redis"],
    impliesSkill: "AI API Development",
    confidence: 0.85,
    category: "technical",
  },
  {
    requiredSkills: ["prompt engineering", "llm"],
    impliesSkill: "AI Application Design",
    confidence: 0.75,
    category: "technical",
  },
  {
    requiredSkills: ["kubernetes", "docker", "mlflow"],
    impliesSkill: "MLOps",
    confidence: 0.9,
    category: "methodologies",
  },
  {
    requiredSkills: ["pinecone", "openai embeddings"],
    impliesSkill: "Vector Search",
    confidence: 0.9,
    category: "technical",
  },
  {
    requiredSkills: ["langchain", "autonomous agents"],
    impliesSkill: "AI Agent Development",
    confidence: 0.85,
    category: "technical",
  },
]

/**
 * Project patterns that indicate specific skills or experiences
 */
const PROJECT_PATTERNS = [
  {
    pattern: ["deployed", "ai", "production"],
    inferredSkill: "launched ai products to production",
    category: "Experience",
    confidence: 0.85,
    contextDescription: "Deployed AI application to production environment",
  },
  {
    pattern: ["langchain", "aws", "lambda"],
    inferredSkill: "llm hosting",
    category: "Infrastructure",
    confidence: 0.8,
    contextDescription: "Implemented LLM hosting on serverless infrastructure",
  },
  {
    pattern: ["docker", "kubernetes", "ci/cd"],
    inferredSkill: "ai infrastructure deployment",
    category: "DevOps",
    confidence: 0.9,
    contextDescription: "Set up containerized deployment pipeline for AI applications",
  },
  {
    pattern: ["langchain", "agent", "tools"],
    inferredSkill: "agentic workflow",
    category: "AI Development",
    confidence: 0.85,
    contextDescription: "Implemented agent-based workflows using LangChain",
  },
  {
    pattern: ["vector", "database", "embedding"],
    inferredSkill: "vector search",
    category: "Data",
    confidence: 0.9,
    contextDescription: "Implemented vector search capabilities",
  },
  {
    pattern: ["prompt", "engineering", "chain of thought"],
    inferredSkill: "reasoning",
    category: "AI Development",
    confidence: 0.8,
    contextDescription: "Applied advanced prompt engineering techniques for reasoning",
  },
]

/**
 * Analyzes project descriptions to infer skills
 */
function analyzeProjectDescriptions(projects: any[]): InferredSkill[] {
  if (!projects || !Array.isArray(projects)) return []

  const inferredSkills: InferredSkill[] = []

  for (const project of projects) {
    if (!project.description) continue

    const description = project.description.toLowerCase()

    for (const pattern of PROJECT_PATTERNS) {
      // Check if all pattern keywords are in the description
      const matchCount = pattern.pattern.filter((keyword) => description.includes(keyword.toLowerCase())).length

      const matchRatio = matchCount / pattern.pattern.length

      // If we have a good match (at least 70% of pattern keywords)
      if (matchRatio >= 0.7) {
        // Check if we already inferred this skill
        const existingSkill = inferredSkills.find((s) => s.skill === pattern.inferredSkill)

        if (existingSkill) {
          // Increase confidence if we find multiple instances
          existingSkill.confidence = Math.min(0.95, existingSkill.confidence + 0.1)
        } else {
          inferredSkills.push({
            skill: pattern.inferredSkill,
            category: pattern.category,
            confidence: pattern.confidence * matchRatio,
            inferredFrom: {
              skillCombination: pattern.pattern,
              context: pattern.contextDescription,
            },
          })
        }
      }
    }
  }

  return inferredSkills
}

/**
 * Infers additional skills based on combinations of existing skills and context
 */
export function inferSkillsFromContext(resumeAnalysis: ResumeAnalysisResult): InferredSkill[] {
  const inferredSkills: InferredSkill[] = []

  // Extract all skills from resume
  // const allSkills = [
  //   ...(resumeAnalysis.skills?.technical || []),
  //   ...(resumeAnalysis.skills?.tools || []),
  //   ...(resumeAnalysis.skills?.frameworks || []),
  //   ...(resumeAnalysis.skills?.languages || []),
  //   ...(resumeAnalysis.skills?.databases || []),
  //   ...(resumeAnalysis.skills?.methodologies || []),
  //   ...(resumeAnalysis.skills?.platforms || []),
  //   ...(resumeAnalysis.skills?.other || []),
  // ].map((skill) => skill.toLowerCase())

  // // Check for skill combinations
  // for (const combination of skillCombinations) {
  //   const { requiredSkills, impliesSkill, confidence, category } = combination

  //   // Check if all required skills are present
  //   const hasAllSkills = requiredSkills.every((requiredSkill) =>
  //     allSkills.some(
  //       (skill) => skill.includes(requiredSkill.toLowerCase()) || requiredSkill.toLowerCase().includes(skill),
  //     ),
  //   )

  //   if (hasAllSkills) {
  //     // Find context from projects or experience
  //     const context = findContextForSkillCombination(resumeAnalysis, requiredSkills)

  //     inferredSkills.push({
  //       skill: impliesSkill,
  //       confidence,
  //       inferredFrom: {
  //         skillCombination: requiredSkills,
  //         context,
  //       },
  //       category,
  //     })
  //   }
  // }

  // // Infer skills from project descriptions
  // const projectInferredSkills = inferSkillsFromProjects(resumeAnalysis)

  // // Combine and deduplicate
  // const allInferredSkills = [...inferredSkills, ...projectInferredSkills]

  // // Deduplicate by skill name
  // const uniqueSkills = allInferredSkills.reduce((acc, current) => {
  //   const existing = acc.find((item) => item.skill.toLowerCase() === current.skill.toLowerCase())

  //   if (!existing) {
  //     acc.push(current)
  //   } else if (current.confidence > existing.confidence) {
  //     // Keep the higher confidence version
  //     const index = acc.indexOf(existing)
  //     acc[index] = current
  //   }

  //   return acc
  // }, [] as InferredSkill[])

  // return uniqueSkills

  // Analyze projects
  if (resumeAnalysis.projects && Array.isArray(resumeAnalysis.projects)) {
    const projectSkills = analyzeProjectDescriptions(resumeAnalysis.projects)
    inferredSkills.push(...projectSkills)
  }

  // Analyze work experience
  if (resumeAnalysis.experience && Array.isArray(resumeAnalysis.experience)) {
    const experienceSkills = analyzeProjectDescriptions(resumeAnalysis.experience)
    inferredSkills.push(...experienceSkills)
  }

  return inferredSkills
}

/**
 * Finds context in resume for a combination of skills
 */
function findContextForSkillCombination(resumeAnalysis: ResumeAnalysisResult, skills: string[]): string {
  // Look in projects first
  for (const project of resumeAnalysis.projects || []) {
    const projectText = `${project.name} ${project.description} ${(project.technologies || []).join(" ")}`

    if (skills.every((skill) => projectText.toLowerCase().includes(skill.toLowerCase()))) {
      return `Project: ${project.name}`
    }
  }

  // Then look in experience
  for (const exp of resumeAnalysis.experience || []) {
    const expText = `${exp.title} ${exp.company} ${exp.description}`

    if (skills.every((skill) => expText.toLowerCase().includes(skill.toLowerCase()))) {
      return `Experience: ${exp.title} at ${exp.company}`
    }
  }

  return "Multiple sections"
}

/**
 * Infers skills from project descriptions
 */
function inferSkillsFromProjects(resumeAnalysis: ResumeAnalysisResult): InferredSkill[] {
  const inferredSkills: InferredSkill[] = []

  // Define patterns to look for in projects
  const projectPatterns = [
    {
      pattern: /vector\s*(database|store|search)/i,
      skill: "Vector Database Knowledge",
      confidence: 0.85,
      category: "databases",
    },
    {
      pattern: /fine\s*tun(e|ing)/i,
      skill: "Model Fine-tuning",
      confidence: 0.8,
      category: "technical",
    },
    {
      pattern: /embedding/i,
      skill: "Embeddings",
      confidence: 0.8,
      category: "technical",
    },
    {
      pattern: /prompt\s*(engineering|design)/i,
      skill: "Prompt Engineering",
      confidence: 0.9,
      category: "technical",
    },
    {
      pattern: /agent/i,
      skill: "AI Agent Development",
      confidence: 0.75,
      category: "technical",
    },
    {
      pattern: /multimodal/i,
      skill: "Multimodal AI",
      confidence: 0.85,
      category: "technical",
    },
  ]

  // Check each project
  for (const project of resumeAnalysis.projects || []) {
    const projectText = `${project.name} ${project.description}`

    for (const { pattern, skill, confidence, category } of projectPatterns) {
      if (pattern.test(projectText)) {
        inferredSkills.push({
          skill,
          confidence,
          inferredFrom: {
            skillCombination: [],
            context: `Project: ${project.name}`,
          },
          category,
        })
      }
    }
  }

  return inferredSkills
}

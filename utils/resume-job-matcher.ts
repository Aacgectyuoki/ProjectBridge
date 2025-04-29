/**
 * Helper function to analyze the match between a resume and job description
 * Specifically tailored for AI engineering positions
 */
export function analyzeAIJobMatch(resumeSkills: string[], jobRequirements: string[]) {
  // Key AI/ML skill categories to look for
  const aiSkillCategories = {
    frameworks: ["TensorFlow", "PyTorch", "Hugging Face", "LangChain", "scikit-learn", "Keras"],
    languages: ["Python", "TypeScript", "JavaScript", "Node.js"],
    concepts: ["NLP", "RAG", "LLM", "Machine Learning", "Deep Learning", "Neural Networks", "Multimodal AI"],
    infrastructure: ["Vector Database", "Model Hosting", "AI Infrastructure", "AWS", "Cloud", "Kubernetes"],
    tools: ["Docker", "GitHub Actions", "CI/CD", "Jenkins"],
    agentSystems: ["Autonomous Agents", "Multi-agent", "Agentic Workflows", "Agent Coordination"],
  }

  // Extract skills from resume that match AI job requirements
  const matchedSkills: Record<string, string[]> = {
    frameworks: [],
    languages: [],
    concepts: [],
    infrastructure: [],
    tools: [],
    agentSystems: [],
  }

  // Extract missing skills from job requirements
  const missingSkills: Record<string, string[]> = {
    frameworks: [],
    languages: [],
    concepts: [],
    infrastructure: [],
    tools: [],
    agentSystems: [],
  }

  // Populate matched and missing skills
  Object.entries(aiSkillCategories).forEach(([category, skills]) => {
    skills.forEach((skill) => {
      const hasSkill = resumeSkills.some((resumeSkill) => resumeSkill.toLowerCase().includes(skill.toLowerCase()))

      const isRequired = jobRequirements.some((req) => req.toLowerCase().includes(skill.toLowerCase()))

      if (isRequired) {
        if (hasSkill) {
          matchedSkills[category].push(skill)
        } else {
          missingSkills[category].push(skill)
        }
      }
    })
  })

  // Calculate match percentage
  const totalRequiredSkills = Object.values(missingSkills).flat().length + Object.values(matchedSkills).flat().length

  const matchedSkillsCount = Object.values(matchedSkills).flat().length

  const matchPercentage = totalRequiredSkills > 0 ? Math.round((matchedSkillsCount / totalRequiredSkills) * 100) : 0

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    // Provide specific recommendations based on the analysis
    recommendations: generateRecommendations(missingSkills),
  }
}

/**
 * Generate specific recommendations based on missing skills
 */
function generateRecommendations(missingSkills: Record<string, string[]>) {
  const recommendations = []

  // Framework recommendations
  if (missingSkills.frameworks.length > 0) {
    recommendations.push({
      category: "AI Frameworks",
      description: `Build expertise in ${missingSkills.frameworks.join(", ")}`,
      resources: [
        { name: "Hugging Face Documentation", url: "https://huggingface.co/docs" },
        { name: "LangChain Documentation", url: "https://js.langchain.com/docs/" },
        { name: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/" },
      ],
    })
  }

  // Agent systems recommendations
  if (missingSkills.agentSystems.length > 0) {
    recommendations.push({
      category: "Agentic Systems",
      description: "Develop experience with autonomous agent systems and multi-agent coordination",
      resources: [
        { name: "LangChain Agents Guide", url: "https://js.langchain.com/docs/modules/agents/" },
        { name: "AutoGPT GitHub", url: "https://github.com/Significant-Gravitas/AutoGPT" },
        { name: "BabyAGI Tutorial", url: "https://github.com/yoheinakajima/babyagi" },
      ],
    })
  }

  // Infrastructure recommendations
  if (missingSkills.infrastructure.length > 0) {
    recommendations.push({
      category: "AI Infrastructure",
      description: "Gain experience with AI infrastructure and deployment",
      resources: [
        { name: "Vector Databases Guide", url: "https://www.pinecone.io/learn/vector-database/" },
        { name: "Model Hosting on AWS", url: "https://aws.amazon.com/sagemaker/" },
        { name: "AI Infrastructure Best Practices", url: "https://www.deeplearning.ai/courses/" },
      ],
    })
  }

  return recommendations
}

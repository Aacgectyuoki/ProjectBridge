// Comprehensive taxonomy of AI-specific skills for better categorization

export const aiSkillsTaxonomy = {
  // Core AI/ML concepts
  concepts: [
    "Machine Learning",
    "Deep Learning",
    "Neural Networks",
    "Natural Language Processing",
    "Computer Vision",
    "Reinforcement Learning",
    "Generative AI",
    "Large Language Models",
    "LLMs",
    "Multimodal AI",
    "AI Personalization",
    "Reasoning",
    "RAG",
    "Retrieval Augmented Generation",
    "Synthetic Data",
    "Transfer Learning",
    "Fine-tuning",
    "Prompt Engineering",
    "Zero-shot Learning",
    "Few-shot Learning",
  ],

  // AI frameworks and libraries
  frameworks: [
    "TensorFlow",
    "PyTorch",
    "Keras",
    "Scikit-learn",
    "Hugging Face",
    "Transformers",
    "LangChain",
    "LlamaIndex",
    "OpenAI API",
    "Anthropic API",
    "Diffusers",
    "JAX",
    "ONNX",
    "MLflow",
  ],

  // AI infrastructure and deployment
  infrastructure: [
    "AI Infrastructure",
    "Model Hosting",
    "Model Serving",
    "Vector Databases",
    "Embeddings",
    "GPU Optimization",
    "Distributed Training",
    "Model Quantization",
    "AI Pipelines",
    "MLOps",
    "AI Observability",
    "Model Monitoring",
  ],

  // Agent-based systems
  agents: [
    "Autonomous Agents",
    "Multi-agent Coordination",
    "Multi-agent Systems",
    "Agentic Workflows",
    "Conversational AI",
    "Chatbots",
    "Agent Frameworks",
    "Tool Use",
    "Planning",
    "Reasoning Agents",
  ],

  // AI engineering practices
  engineering: [
    "AI Engineering",
    "ML Engineering",
    "AI Model Improvement",
    "Model Evaluation",
    "AI Testing",
    "AI Security",
    "Responsible AI",
    "AI Ethics",
    "Explainable AI",
    "AI Alignment",
    "AI Safety",
  ],

  // Data-related skills
  data: [
    "Data Pipelines",
    "Data Preprocessing",
    "Feature Engineering",
    "Synthetic Data Training",
    "Data Augmentation",
    "Data Labeling",
    "Data Annotation",
    "Dataset Curation",
  ],

  // AI applications
  applications: [
    "Recommendation Systems",
    "Search Systems",
    "Content Generation",
    "Image Generation",
    "Text-to-Image",
    "Text-to-Speech",
    "Speech-to-Text",
    "Sentiment Analysis",
    "Entity Recognition",
    "Question Answering",
    "Summarization",
  ],
}

// Helper function to check if a skill belongs to a specific category
export function categorizeAISkill(skill: string): string[] {
  const categories: string[] = []
  const normalizedSkill = skill.toLowerCase()

  Object.entries(aiSkillsTaxonomy).forEach(([category, skills]) => {
    if (skills.some((s) => normalizedSkill.includes(s.toLowerCase()) || s.toLowerCase().includes(normalizedSkill))) {
      categories.push(category)
    }
  })

  return categories.length > 0 ? categories : ["other"]
}

// Helper function to get related skills for a given skill
export function getRelatedSkills(skill: string, limit = 5): string[] {
  const normalizedSkill = skill.toLowerCase()
  const categories = categorizeAISkill(skill)

  if (categories.includes("other")) {
    return []
  }

  const relatedSkills: string[] = []

  categories.forEach((category) => {
    aiSkillsTaxonomy[category].forEach((s) => {
      if (s.toLowerCase() !== normalizedSkill && !relatedSkills.includes(s)) {
        relatedSkills.push(s)
      }
    })
  })

  return relatedSkills.slice(0, limit)
}

// Helper function to get skill confidence score based on context
export function getSkillConfidence(skill: string, context: string): number {
  const normalizedSkill = skill.toLowerCase()
  const normalizedContext = context.toLowerCase()

  // Direct mention has high confidence
  if (normalizedContext.includes(normalizedSkill)) {
    // Exact match with word boundaries
    const regex = new RegExp(`\\b${normalizedSkill}\\b`, "i")
    if (regex.test(normalizedContext)) {
      return 0.9
    }
    // Partial match
    return 0.7
  }

  // Check if any related terms are mentioned
  const categories = categorizeAISkill(skill)
  if (categories.includes("other")) {
    return 0.3
  }

  // Check if category-related terms are mentioned
  let maxCategoryConfidence = 0
  categories.forEach((category) => {
    const categoryTerms = aiSkillsTaxonomy[category]
    const mentionedTerms = categoryTerms.filter((term) => normalizedContext.includes(term.toLowerCase()))

    if (mentionedTerms.length > 0) {
      maxCategoryConfidence = Math.max(maxCategoryConfidence, 0.5)
    }
  })

  return maxCategoryConfidence
}

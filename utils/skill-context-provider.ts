// Create a utility that provides context for important skills
export const skillContextMap = {
  LLMs: "Large Language Models are fundamental to modern AI engineering, enabling natural language understanding and generation capabilities.",
  "RAG systems":
    "Retrieval Augmented Generation systems combine the power of LLMs with knowledge retrieval, essential for building AI systems with accurate information access.",
  "vector databases":
    "Vector databases store embeddings for efficient similarity search, critical for modern AI applications that need to find related content quickly.",
  // Add more skill contexts
}

export function getSkillContext(skillName: string): string {
  return skillContextMap[skillName] || `${skillName} is a valuable skill in the current AI engineering landscape.`
}

/**
 * A utility for resolving skill abbreviations and normalizing skill names
 */

// Map of abbreviations to their full forms
const abbreviationMap: Record<string, string> = {
  // Cloud & Infrastructure
  AWS: "Amazon Web Services",
  GCP: "Google Cloud Platform",
  Azure: "Microsoft Azure",
  K8s: "Kubernetes",
  IaC: "Infrastructure as Code",
  "CI/CD": "Continuous Integration/Continuous Deployment",
  VM: "Virtual Machine",
  EC2: "Elastic Compute Cloud",
  S3: "Simple Storage Service",
  IAM: "Identity and Access Management",

  // AI & Machine Learning
  ML: "Machine Learning",
  AI: "Artificial Intelligence",
  DL: "Deep Learning",
  NLP: "Natural Language Processing",
  CV: "Computer Vision",
  RL: "Reinforcement Learning",
  RAG: "Retrieval Augmented Generation",
  LLM: "Large Language Model",
  CNN: "Convolutional Neural Network",
  RNN: "Recurrent Neural Network",

  // Programming & Development
  JS: "JavaScript",
  TS: "TypeScript",
  OOP: "Object-Oriented Programming",
  FP: "Functional Programming",
  API: "Application Programming Interface",
  REST: "Representational State Transfer",
  SOAP: "Simple Object Access Protocol",
  SQL: "Structured Query Language",
  NoSQL: "Not Only SQL",
  ORM: "Object-Relational Mapping",
  IDE: "Integrated Development Environment",
  SDK: "Software Development Kit",
  UI: "User Interface",
  UX: "User Experience",
  CSS: "Cascading Style Sheets",
  HTML: "HyperText Markup Language",
  DOM: "Document Object Model",

  // DevOps & SRE
  SRE: "Site Reliability Engineering",
  DevOps: "Development and Operations",
  SLA: "Service Level Agreement",
  SLO: "Service Level Objective",
  SLI: "Service Level Indicator",

  // Data
  ETL: "Extract, Transform, Load",
  ELT: "Extract, Load, Transform",
  BI: "Business Intelligence",
  DW: "Data Warehouse",
  DL: "Data Lake",
  OLAP: "Online Analytical Processing",
  OLTP: "Online Transaction Processing",

  // Frameworks & Libraries
  React: "React.js",
  Vue: "Vue.js",
  Angular: "Angular.js",
  Node: "Node.js",
  TF: "TensorFlow",
  PT: "PyTorch",

  // Methodologies
  Agile: "Agile Methodology",
  Scrum: "Scrum Methodology",
  XP: "Extreme Programming",
  TDD: "Test-Driven Development",
  BDD: "Behavior-Driven Development",
  DDD: "Domain-Driven Design",

  // Security
  SSO: "Single Sign-On",
  MFA: "Multi-Factor Authentication",
  "2FA": "Two-Factor Authentication",
  SIEM: "Security Information and Event Management",
  IAM: "Identity and Access Management",
  GDPR: "General Data Protection Regulation",
  HIPAA: "Health Insurance Portability and Accountability Act",

  // Databases
  RDBMS: "Relational Database Management System",
  DB: "Database",
  ACID: "Atomicity, Consistency, Isolation, Durability",
}

// Reverse map for looking up abbreviations from full forms
const reverseAbbreviationMap: Record<string, string> = {}

// Initialize the reverse map
Object.entries(abbreviationMap).forEach(([abbr, fullForm]) => {
  reverseAbbreviationMap[fullForm.toLowerCase()] = abbr
})

/**
 * Common skill aliases and abbreviations
 */
export const SKILL_ALIASES: Record<string, string[]> = {
  tensorflow: ["tf", "tensor flow"],
  pytorch: ["torch", "py torch"],
  langchain: ["lang chain"],
  "hugging face": ["huggingface", "hf"],
  "vector database": ["vector db", "vectordb"],
  "natural language processing": ["nlp"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"],
  "deep learning": ["dl"],
  "convolutional neural network": ["cnn"],
  "recurrent neural network": ["rnn"],
  "long short-term memory": ["lstm"],
  "generative adversarial network": ["gan"],
  "reinforcement learning": ["rl"],
  "continuous integration/continuous deployment": ["ci/cd", "cicd"],
  "amazon web services": ["aws"],
  "google cloud platform": ["gcp"],
  "microsoft azure": ["azure"],
  javascript: ["js"],
  typescript: ["ts"],
  python: ["py"],
  "retrieval augmented generation": ["rag"],
  "large language model": ["llm"],
  "agentic workflow": ["auto-agent", "autonomous agent", "agent workflow"],
  "multi-agent coordination": ["multi-agent system", "multi-agent", "multiagent"],
  reasoning: ["chain of thought", "cot", "logical reasoning"],
  "synthetic data training": ["synthetic data generation", "synthetic training data"],
  "launched ai products to production": ["deployed ai", "ai in production", "production ai"],
}

/**
 * Resolves an abbreviation to its full form if available
 * @param skill The skill abbreviation to resolve
 * @returns The full form of the skill or the original skill if no mapping exists
 */
export function resolveAbbreviation(skill: string): string {
  const trimmedSkill = skill.trim()
  return abbreviationMap[trimmedSkill] || trimmedSkill
}

/**
 * Gets the abbreviation for a full skill name if available
 * @param fullSkillName The full skill name
 * @returns The abbreviation or the original skill name if no mapping exists
 */
export function getAbbreviation(fullSkillName: string): string {
  const trimmedSkill = fullSkillName.trim().toLowerCase()
  return reverseAbbreviationMap[trimmedSkill] || fullSkillName
}

/**
 * Normalizes a skill name by standardizing formatting and resolving common variations
 * @param skill The skill to normalize
 * @returns The normalized skill name
 */
export function normalizeSkillName(skill: string): string {
  const normalized = skill.toLowerCase().trim()

  // Check if this is an alias and return the primary term
  for (const [primary, aliases] of Object.entries(SKILL_ALIASES)) {
    if (aliases.includes(normalized)) {
      return primary
    }
  }

  return normalized
}

/**
 * Checks if two skills are equivalent (either the same or abbreviation/full form pairs)
 * @param skillA First skill to compare
 * @param skillB Second skill to compare
 * @returns True if the skills are equivalent
 */
export function areSkillsEquivalent(skillA: string, skillB: string): boolean {
  // Normalize both skills
  const normalizedA = normalizeSkillName(skillA)
  const normalizedB = normalizeSkillName(skillB)

  // Direct match after normalization
  if (normalizedA === normalizedB) {
    return true
  }

  // Check if one is the abbreviation of the other
  const fullFormA = resolveAbbreviation(skillA)
  const fullFormB = resolveAbbreviation(skillB)

  if (fullFormA === normalizedB || normalizedA === fullFormB) {
    return true
  }

  // Check abbreviation of full forms
  const abbrA = getAbbreviation(skillA)
  const abbrB = getAbbreviation(skillB)

  if (abbrA === normalizedB || normalizedA === abbrB) {
    return true
  }

  return false
}

/**
 * Finds matching skills between two lists, accounting for abbreviations and variations
 * @param listA First list of skills
 * @param listB Second list of skills
 * @returns Array of matching skills
 */
export function findMatchingSkills(sourceSkills: string[], targetSkills: string[]): string[] {
  const normalizedSourceSkills = sourceSkills.map((skill) => normalizeSkillName(skill))
  const normalizedTargetSkills = targetSkills.map((skill) => normalizeSkillName(skill))

  const matchedSkills: string[] = []

  for (const targetSkill of normalizedTargetSkills) {
    // Check for direct match
    if (normalizedSourceSkills.includes(targetSkill)) {
      matchedSkills.push(targetSkill)
      continue
    }

    // Check for alias matches
    let aliasMatch = false
    for (const [primary, aliases] of Object.entries(SKILL_ALIASES)) {
      // If target skill is a primary term, check if source has any of its aliases
      if (targetSkill === primary) {
        for (const alias of aliases) {
          if (normalizedSourceSkills.includes(alias)) {
            matchedSkills.push(primary)
            aliasMatch = true
            break
          }
        }
      }

      // If target skill is an alias, check if source has the primary term
      if (aliases.includes(targetSkill) && normalizedSourceSkills.includes(primary)) {
        matchedSkills.push(targetSkill)
        aliasMatch = true
      }

      if (aliasMatch) break
    }
  }

  return matchedSkills
}

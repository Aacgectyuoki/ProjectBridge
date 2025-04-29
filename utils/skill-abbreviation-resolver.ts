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
  // Remove extra whitespace and convert to lowercase for comparison
  const trimmedSkill = skill.trim()
  const lowerSkill = trimmedSkill.toLowerCase()

  // Handle special cases and common variations
  switch (lowerSkill) {
    case "javascript":
    case "js":
      return "JavaScript"
    case "typescript":
    case "ts":
      return "TypeScript"
    case "react":
    case "reactjs":
    case "react.js":
      return "React"
    case "node":
    case "nodejs":
    case "node.js":
      return "Node.js"
    case "vue":
    case "vuejs":
    case "vue.js":
      return "Vue.js"
    case "angular":
    case "angularjs":
      return "Angular"
    case "aws":
      return "Amazon Web Services"
    case "gcp":
      return "Google Cloud Platform"
    case "azure":
      return "Microsoft Azure"
    case "ml":
      return "Machine Learning"
    case "ai":
      return "Artificial Intelligence"
    case "nlp":
      return "Natural Language Processing"
    case "cv":
      return "Computer Vision"
    case "ci/cd":
    case "cicd":
      return "CI/CD"
    case "devops":
      return "DevOps"
    default:
      // If it's an abbreviation we know, resolve it
      if (abbreviationMap[trimmedSkill]) {
        return abbreviationMap[trimmedSkill]
      }
      // Otherwise return with proper capitalization
      return trimmedSkill.charAt(0).toUpperCase() + trimmedSkill.slice(1)
  }
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
export function findMatchingSkills(listA: string[], listB: string[]): string[] {
  const matches: string[] = []

  listA.forEach((skillA) => {
    listB.forEach((skillB) => {
      if (areSkillsEquivalent(skillA, skillB)) {
        // Use the normalized version of skillA for consistency
        matches.push(normalizeSkillName(skillA))
      }
    })
  })

  // Remove duplicates
  return [...new Set(matches)]
}

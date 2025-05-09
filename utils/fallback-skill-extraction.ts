import type { ExtractedSkills } from "@/utils/ai-chain/schemas/skill-extraction-schema"

// Default empty skills structure
const defaultSkills: ExtractedSkills = {
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

// Common skill dictionaries by category
const skillDictionaries = {
  // Frontend development skills
  frontend: {
    technical: [
      "responsive design",
      "web accessibility",
      "cross-browser compatibility",
      "UI/UX",
      "performance optimization",
      "SEO",
    ],
    frameworks: ["React", "Angular", "Vue", "Next.js", "Nuxt.js", "Svelte", "Tailwind CSS", "Bootstrap", "Material UI"],
    languages: ["JavaScript", "TypeScript", "HTML", "CSS", "HTML5", "CSS3"],
    tools: ["Webpack", "Babel", "ESLint", "Prettier", "Chrome DevTools", "Figma", "Sketch", "Adobe XD"],
    methodologies: ["responsive design", "mobile-first design", "atomic design", "component-based architecture"],
    other: ["web animations", "GSAP", "Motion", "Framer Motion", "3D libraries", "Three.js", "WebGL"],
  },

  // Backend development skills
  backend: {
    technical: ["API design", "authentication", "authorization", "caching", "performance optimization", "security"],
    frameworks: ["Express", "Django", "Flask", "Spring Boot", "Laravel", "Ruby on Rails", "ASP.NET"],
    languages: ["JavaScript", "TypeScript", "Python", "Java", "C#", "PHP", "Ruby", "Go"],
    databases: ["MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "DynamoDB"],
    tools: ["Postman", "Swagger", "Docker", "Kubernetes", "Nginx", "Apache"],
    methodologies: ["RESTful APIs", "GraphQL", "microservices", "serverless", "event-driven architecture"],
    other: ["message queues", "RabbitMQ", "Kafka", "Redis", "WebSockets", "gRPC"],
  },

  // Data science skills
  dataScience: {
    technical: [
      "machine learning",
      "statistical analysis",
      "data visualization",
      "feature engineering",
      "data cleaning",
      "data mining",
    ],
    frameworks: ["TensorFlow", "PyTorch", "scikit-learn", "Keras", "pandas", "NumPy", "Matplotlib", "Seaborn"],
    languages: ["Python", "R", "SQL", "Julia"],
    databases: ["PostgreSQL", "MySQL", "MongoDB", "Hadoop", "Spark", "Hive"],
    tools: ["Jupyter", "RStudio", "Tableau", "Power BI", "MATLAB", "SAS", "SPSS"],
    methodologies: ["A/B testing", "cross-validation", "supervised learning", "unsupervised learning", "deep learning"],
    other: ["NLP", "computer vision", "time series analysis", "recommendation systems", "reinforcement learning"],
  },

  // DevOps skills
  devops: {
    technical: [
      "infrastructure as code",
      "continuous integration",
      "continuous deployment",
      "monitoring",
      "logging",
      "security",
    ],
    tools: [
      "Docker",
      "Kubernetes",
      "Terraform",
      "Ansible",
      "Jenkins",
      "GitLab CI",
      "GitHub Actions",
      "CircleCI",
      "Prometheus",
      "Grafana",
      "ELK Stack",
    ],
    platforms: ["AWS", "Azure", "GCP", "DigitalOcean", "Heroku", "Netlify", "Vercel"],
    languages: ["Bash", "Python", "Go", "YAML", "HCL"],
    methodologies: ["CI/CD", "GitOps", "DevSecOps", "SRE", "infrastructure as code"],
    other: ["load balancing", "auto-scaling", "high availability", "disaster recovery", "cost optimization"],
  },

  // Common soft skills across all roles
  common: {
    soft: [
      "communication",
      "teamwork",
      "problem solving",
      "critical thinking",
      "time management",
      "adaptability",
      "leadership",
      "creativity",
      "attention to detail",
      "organization",
      "collaboration",
      "conflict resolution",
      "decision making",
      "emotional intelligence",
      "negotiation",
    ],
  },
}

/**
 * Extracts skills from job description text using predefined skill dictionaries
 * This serves as a fallback when AI-based extraction fails
 */
export function extractSkillsFromJobDescription(text: string): ExtractedSkills {
  const result: ExtractedSkills = {
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

  // Normalize text for case-insensitive matching
  const normalizedText = text.toLowerCase()

  // Determine job category based on keywords
  const isFrontend = /front.?end|ui|ux|react|angular|vue|css|html|javascript|web.?developer/i.test(text)
  const isBackend = /back.?end|api|server|database|java|python|node|php|ruby|go|scala|service/i.test(text)
  const isDataScience =
    /data.?scien|machine.?learning|ml|ai|artificial.?intelligence|analytics|statistics|python|r.?language/i.test(text)
  const isDevOps = /devops|sre|site.?reliability|infrastructure|cloud|aws|azure|gcp|kubernetes|docker|ci.?cd/i.test(
    text,
  )

  // Add common soft skills to all roles
  result.soft = [...skillDictionaries.common.soft]

  // Add role-specific skills based on detected categories
  if (isFrontend) {
    addSkillsFromCategory(result, skillDictionaries.frontend, normalizedText)
  }

  if (isBackend) {
    addSkillsFromCategory(result, skillDictionaries.backend, normalizedText)
  }

  if (isDataScience) {
    addSkillsFromCategory(result, skillDictionaries.dataScience, normalizedText)
  }

  if (isDevOps) {
    addSkillsFromCategory(result, skillDictionaries.devops, normalizedText)
  }

  // If no specific category was detected, check all categories
  if (!isFrontend && !isBackend && !isDataScience && !isDevOps) {
    addSkillsFromCategory(result, skillDictionaries.frontend, normalizedText)
    addSkillsFromCategory(result, skillDictionaries.backend, normalizedText)
    addSkillsFromCategory(result, skillDictionaries.dataScience, normalizedText)
    addSkillsFromCategory(result, skillDictionaries.devops, normalizedText)
  }

  // Deduplicate skills
  Object.keys(result).forEach((key) => {
    result[key] = [...new Set(result[key])]
  })

  return result
}

/**
 * Helper function to add skills from a category dictionary if they appear in the text
 */
function addSkillsFromCategory(result: ExtractedSkills, category: any, normalizedText: string) {
  Object.keys(category).forEach((key) => {
    if (key in result) {
      category[key].forEach((skill) => {
        // Create a regex that handles variations of the skill name
        const skillRegex = new RegExp(
          `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}\\b`,
          "i",
        )
        if (skillRegex.test(normalizedText)) {
          result[key].push(skill)
        }
      })
    }
  })
}

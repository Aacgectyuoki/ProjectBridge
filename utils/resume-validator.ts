/**
 * Utilities for validating resume content
 */

type ValidationResult = {
  isValid: boolean
  message?: string
  items?: string[]
}

export type LinkValidationResult = {
  url: string
  isValid: boolean
  message?: string
}

/**
 * Extract URLs from text content with a more lenient approach
 */
export function extractUrls(text: string): string[] {
  // Simple regex to find common URLs and domains
  const urlRegex = /(https?:\/\/[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+)/g
  const matches = text.match(urlRegex) || []

  // Filter out very short matches that are likely not URLs
  return matches
    .filter((url) => url.length > 5)
    .map((url) => {
      // Add https:// if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`
      }
      return url
    })
}

/**
 * Simple check for presence of contact information
 */
export function checkContactInfo(text: string): ValidationResult {
  const items: string[] = []

  // Very basic email check - just look for @ symbol
  if (text.includes("@")) {
    items.push("Email")
  }

  // Basic phone check - just look for number patterns
  if (/\d{3}[- .]?\d{3}[- .]?\d{4}/.test(text)) {
    items.push("Phone number")
  }

  // Check for common professional profile mentions
  if (/linkedin\.com|github\.com|portfolio|website/i.test(text)) {
    items.push("Online profile/website")
  }

  return {
    isValid: items.length > 0,
    message:
      items.length > 0 ? `Found ${items.length} type(s) of contact information` : "No contact information detected",
    items,
  }
}

/**
 * Extract skills from resume text with enhanced detection
 */
export function extractSkills(text: string): { technical: string[]; soft: string[] } {
  const technicalSkills = new Set<string>()
  const softSkills = new Set<string>()

  // Normalize text for better matching
  const normalizedText = text.toLowerCase()

  // Common technical skills to look for - expanded list
  const technicalKeywords = [
    // Programming Languages
    {
      name: "JavaScript",
      patterns: ["javascript", "js", "ecmascript", "es6", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020"],
    },
    { name: "TypeScript", patterns: ["typescript", "ts"] },
    { name: "Python", patterns: ["python", "py", "django", "flask", "fastapi", "pytest"] },
    { name: "Java", patterns: ["java", "spring", "spring boot", "j2ee", "jakarta ee"] },
    { name: "C#", patterns: ["c#", "csharp", ".net", "dotnet", "asp.net", "xamarin"] },
    { name: "C++", patterns: ["c\\+\\+", "cpp"] },
    { name: "Ruby", patterns: ["ruby", "rails", "ruby on rails"] },
    { name: "PHP", patterns: ["php", "laravel", "symfony", "wordpress", "drupal"] },
    { name: "Swift", patterns: ["swift", "ios development", "swiftui"] },
    { name: "Kotlin", patterns: ["kotlin", "android development"] },
    { name: "Go", patterns: ["go", "golang"] },
    { name: "Rust", patterns: ["rust", "rustlang"] },
    { name: "Scala", patterns: ["scala", "akka"] },
    { name: "R", patterns: ["\\br\\b", "rstudio", "r language"] },
    { name: "Perl", patterns: ["perl"] },
    { name: "Haskell", patterns: ["haskell"] },
    { name: "Clojure", patterns: ["clojure"] },
    { name: "Elixir", patterns: ["elixir", "phoenix framework"] },
    { name: "Dart", patterns: ["dart", "flutter"] },

    // Web Technologies
    { name: "HTML", patterns: ["html", "html5", "xhtml"] },
    { name: "CSS", patterns: ["css", "css3", "sass", "scss", "less", "stylus", "tailwind", "bootstrap", "bulma"] },
    { name: "React", patterns: ["react", "reactjs", "react.js", "react native", "redux", "react hooks"] },
    {
      name: "Angular",
      patterns: [
        "angular",
        "angularjs",
        "angular 2",
        "angular 4",
        "angular 5",
        "angular 6",
        "angular 7",
        "angular 8",
        "angular 9",
        "angular 10",
        "angular 11",
        "angular 12",
      ],
    },
    { name: "Vue", patterns: ["vue", "vuejs", "vue.js", "vuex", "nuxt"] },
    { name: "Svelte", patterns: ["svelte", "sveltekit"] },
    { name: "Node.js", patterns: ["node.js", "nodejs", "node"] },
    { name: "Express", patterns: ["express", "expressjs", "express.js"] },
    { name: "Next.js", patterns: ["next.js", "nextjs", "next"] },
    { name: "Gatsby", patterns: ["gatsby", "gatsbyjs"] },
    { name: "Redux", patterns: ["redux", "react-redux", "redux toolkit", "rtk"] },
    { name: "GraphQL", patterns: ["graphql", "apollo", "relay"] },
    { name: "REST API", patterns: ["rest", "rest api", "restful", "restful api"] },
    { name: "WebSockets", patterns: ["websockets", "websocket", "socket.io"] },
    { name: "jQuery", patterns: ["jquery"] },
    { name: "Webpack", patterns: ["webpack"] },
    { name: "Babel", patterns: ["babel"] },
    { name: "ESLint", patterns: ["eslint"] },
    { name: "Prettier", patterns: ["prettier"] },
    { name: "Jest", patterns: ["jest"] },
    { name: "Mocha", patterns: ["mocha"] },
    { name: "Chai", patterns: ["chai"] },
    { name: "Cypress", patterns: ["cypress"] },
    { name: "Selenium", patterns: ["selenium"] },
    { name: "Puppeteer", patterns: ["puppeteer"] },
    { name: "Storybook", patterns: ["storybook"] },

    // Databases
    { name: "SQL", patterns: ["sql", "structured query language"] },
    { name: "MySQL", patterns: ["mysql"] },
    { name: "PostgreSQL", patterns: ["postgresql", "postgres"] },
    { name: "MongoDB", patterns: ["mongodb", "mongo"] },
    { name: "Firebase", patterns: ["firebase", "firestore", "firebase realtime database"] },
    { name: "DynamoDB", patterns: ["dynamodb"] },
    { name: "Oracle", patterns: ["oracle", "oracle database", "plsql", "pl/sql"] },
    { name: "SQLite", patterns: ["sqlite"] },
    { name: "NoSQL", patterns: ["nosql"] },
    { name: "Redis", patterns: ["redis"] },
    { name: "Cassandra", patterns: ["cassandra"] },
    { name: "Elasticsearch", patterns: ["elasticsearch", "elk stack"] },
    { name: "Neo4j", patterns: ["neo4j"] },
    { name: "CouchDB", patterns: ["couchdb"] },

    // Cloud & DevOps
    {
      name: "AWS",
      patterns: [
        "aws",
        "amazon web services",
        "ec2",
        "s3",
        "lambda",
        "cloudfront",
        "route53",
        "cloudwatch",
        "iam",
        "rds",
        "sqs",
        "sns",
        "ecs",
        "eks",
      ],
    },
    { name: "Azure", patterns: ["azure", "microsoft azure", "azure functions", "azure devops"] },
    { name: "GCP", patterns: ["gcp", "google cloud", "google cloud platform"] },
    { name: "Docker", patterns: ["docker", "dockerfile", "docker-compose"] },
    { name: "Kubernetes", patterns: ["kubernetes", "k8s"] },
    {
      name: "CI/CD",
      patterns: ["ci/cd", "ci", "cd", "continuous integration", "continuous delivery", "continuous deployment"],
    },
    { name: "Jenkins", patterns: ["jenkins"] },
    { name: "GitHub Actions", patterns: ["github actions", "github workflow"] },
    { name: "CircleCI", patterns: ["circleci"] },
    { name: "Travis CI", patterns: ["travis", "travis ci"] },
    { name: "Terraform", patterns: ["terraform", "infrastructure as code", "iac"] },
    { name: "Ansible", patterns: ["ansible"] },
    { name: "Puppet", patterns: ["puppet"] },
    { name: "Chef", patterns: ["chef"] },
    { name: "Nginx", patterns: ["nginx"] },
    { name: "Apache", patterns: ["apache", "apache http server"] },
    { name: "Linux", patterns: ["linux", "ubuntu", "debian", "centos", "fedora", "red hat", "rhel"] },
    { name: "Unix", patterns: ["unix"] },
    { name: "Shell Scripting", patterns: ["shell", "bash", "shell scripting", "bash scripting", "zsh"] },

    // Mobile
    { name: "iOS", patterns: ["ios", "ios development", "iphone", "ipad"] },
    { name: "Android", patterns: ["android", "android development"] },
    { name: "React Native", patterns: ["react native"] },
    { name: "Flutter", patterns: ["flutter"] },
    { name: "Xamarin", patterns: ["xamarin"] },
    { name: "Ionic", patterns: ["ionic"] },
    { name: "Cordova", patterns: ["cordova", "phonegap"] },

    // Data Science & AI
    { name: "Machine Learning", patterns: ["machine learning", "ml"] },
    { name: "AI", patterns: ["ai", "artificial intelligence", "deep learning", "neural networks"] },
    { name: "Data Analysis", patterns: ["data analysis", "data analytics", "data science", "big data"] },
    { name: "TensorFlow", patterns: ["tensorflow", "tf"] },
    { name: "PyTorch", patterns: ["pytorch"] },
    { name: "Keras", patterns: ["keras"] },
    { name: "Scikit-learn", patterns: ["scikit-learn", "sklearn"] },
    { name: "Pandas", patterns: ["pandas"] },
    { name: "NumPy", patterns: ["numpy"] },
    { name: "SciPy", patterns: ["scipy"] },
    { name: "Matplotlib", patterns: ["matplotlib"] },
    { name: "Seaborn", patterns: ["seaborn"] },
    { name: "Tableau", patterns: ["tableau"] },
    { name: "Power BI", patterns: ["power bi", "powerbi"] },
    { name: "NLTK", patterns: ["nltk", "natural language toolkit"] },
    { name: "OpenCV", patterns: ["opencv"] },

    // Tools & Version Control
    { name: "Git", patterns: ["git", "version control"] },
    { name: "GitHub", patterns: ["github"] },
    { name: "GitLab", patterns: ["gitlab"] },
    { name: "Bitbucket", patterns: ["bitbucket"] },
    { name: "Jira", patterns: ["jira"] },
    { name: "Confluence", patterns: ["confluence"] },
    { name: "Trello", patterns: ["trello"] },
    { name: "Asana", patterns: ["asana"] },
    { name: "Figma", patterns: ["figma"] },
    { name: "Sketch", patterns: ["sketch"] },
    { name: "Adobe XD", patterns: ["adobe xd", "xd"] },
    { name: "Photoshop", patterns: ["photoshop", "ps"] },
    { name: "Illustrator", patterns: ["illustrator", "ai"] },

    // Other
    { name: "RESTful APIs", patterns: ["restful apis", "rest apis", "api development", "api design"] },
    { name: "Microservices", patterns: ["microservices", "microservice architecture"] },
    { name: "Serverless", patterns: ["serverless", "faas", "function as a service"] },
    { name: "WebRTC", patterns: ["webrtc"] },
    { name: "Progressive Web Apps", patterns: ["progressive web apps", "pwa"] },
    { name: "Web Components", patterns: ["web components"] },
    { name: "Responsive Design", patterns: ["responsive design", "responsive web design", "mobile-first"] },
    { name: "Accessibility", patterns: ["accessibility", "a11y", "wcag"] },
    { name: "SEO", patterns: ["seo", "search engine optimization"] },
    { name: "Web Performance", patterns: ["web performance", "performance optimization"] },
    {
      name: "Testing",
      patterns: [
        "testing",
        "unit testing",
        "integration testing",
        "e2e testing",
        "end-to-end testing",
        "test automation",
      ],
    },
    { name: "Agile", patterns: ["agile", "agile development", "agile methodology"] },
    { name: "Scrum", patterns: ["scrum", "scrum master"] },
    { name: "Kanban", patterns: ["kanban"] },
    { name: "DevOps", patterns: ["devops"] },
    { name: "SRE", patterns: ["sre", "site reliability engineering"] },
  ]

  // Common soft skills to look for - expanded list
  const softKeywords = [
    {
      name: "Communication",
      patterns: ["communication", "verbal communication", "written communication", "public speaking", "presentation"],
    },
    { name: "Teamwork", patterns: ["teamwork", "team player", "team building", "team management"] },
    {
      name: "Leadership",
      patterns: ["leadership", "team lead", "team leader", "project lead", "leading", "mentoring", "mentorship"],
    },
    {
      name: "Problem Solving",
      patterns: ["problem solving", "problem-solving", "troubleshooting", "debugging", "analytical thinking"],
    },
    { name: "Critical Thinking", patterns: ["critical thinking", "analytical", "analysis"] },
    {
      name: "Time Management",
      patterns: ["time management", "prioritization", "multitasking", "organization", "organizational"],
    },
    { name: "Adaptability", patterns: ["adaptability", "flexibility", "adaptable", "flexible"] },
    { name: "Creativity", patterns: ["creativity", "creative thinking", "innovation", "innovative"] },
    { name: "Collaboration", patterns: ["collaboration", "collaborative", "cross-functional", "cross functional"] },
    { name: "Presentation", patterns: ["presentation", "presenting", "public speaking"] },
    { name: "Project Management", patterns: ["project management", "project planning", "project coordination"] },
    { name: "Agile", patterns: ["agile", "scrum", "kanban", "sprint planning", "sprint review", "retrospective"] },
    { name: "Mentoring", patterns: ["mentoring", "coaching", "training", "knowledge sharing"] },
    {
      name: "Customer Service",
      patterns: ["customer service", "client relations", "client management", "customer support"],
    },
    { name: "Negotiation", patterns: ["negotiation", "conflict resolution", "mediation"] },
    { name: "Decision Making", patterns: ["decision making", "judgment", "decisiveness"] },
    {
      name: "Emotional Intelligence",
      patterns: ["emotional intelligence", "empathy", "self-awareness", "social skills"],
    },
    { name: "Attention to Detail", patterns: ["attention to detail", "detail-oriented", "precision", "accuracy"] },
    { name: "Research", patterns: ["research", "investigation", "data gathering"] },
    { name: "Strategic Thinking", patterns: ["strategic thinking", "strategic planning", "strategy development"] },
    { name: "Self-motivation", patterns: ["self-motivation", "initiative", "self-starter", "proactive"] },
    { name: "Work Ethic", patterns: ["work ethic", "dedication", "commitment", "reliability"] },
    { name: "Interpersonal Skills", patterns: ["interpersonal skills", "relationship building", "networking"] },
    { name: "Cultural Awareness", patterns: ["cultural awareness", "diversity", "inclusion", "cultural sensitivity"] },
    { name: "Active Listening", patterns: ["active listening", "listening skills"] },
    { name: "Stress Management", patterns: ["stress management", "pressure", "deadline", "deadlines"] },
  ]

  // Function to check for skill patterns in text
  const checkForSkill = (text: string, patterns: string[]): boolean => {
    for (const pattern of patterns) {
      try {
        // Create a regex that can match the pattern as part of a word
        const regex = new RegExp(`\\b${pattern}\\b`, "i")
        if (regex.test(text)) {
          return true
        }
      } catch (error) {
        console.error(`Error with regex for pattern: ${pattern}`, error)
        // Try a simple string includes as fallback
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          return true
        }
      }
    }
    return false
  }

  // Check for technical skills
  for (const skill of technicalKeywords) {
    if (skill.patterns.some((pattern) => checkForSkill(normalizedText, [pattern]))) {
      technicalSkills.add(skill.name)
    }
  }

  // Check for soft skills
  for (const skill of softKeywords) {
    if (skill.patterns.some((pattern) => checkForSkill(normalizedText, [pattern]))) {
      softSkills.add(skill.name)
    }
  }

  // Additional context-based skill extraction
  // Look for sections that might contain skills
  const sections = [
    { name: "skills", regex: /\b(skills|technical skills|core competencies|technologies|proficiencies)\b/i },
    { name: "education", regex: /\b(education|academic background|qualifications|degrees)\b/i },
    { name: "experience", regex: /\b(experience|work experience|employment|work history|professional experience)\b/i },
    { name: "projects", regex: /\b(projects|personal projects|portfolio|side projects)\b/i },
  ]

  // Split text into lines for better section detection
  const lines = text.split(/\r?\n/)
  let currentSection = ""

  for (const line of lines) {
    // Determine if this line is a section header
    for (const section of sections) {
      if (section.regex.test(line)) {
        currentSection = section.name
        break
      }
    }

    // If we're in a skills section, look for list items or comma-separated values
    if (currentSection === "skills") {
      // Look for bullet points or list items
      const listItemMatch = line.match(/[•\-*]\s*([^:]+)/)
      if (listItemMatch && listItemMatch[1]) {
        const skillText = listItemMatch[1].trim()

        // Check if this matches any known technical skill
        for (const skill of technicalKeywords) {
          if (skill.patterns.some((pattern) => checkForSkill(skillText, [pattern]))) {
            technicalSkills.add(skill.name)
          }
        }

        // Check if this matches any known soft skill
        for (const skill of softKeywords) {
          if (skill.patterns.some((pattern) => checkForSkill(skillText, [pattern]))) {
            softSkills.add(skill.name)
          }
        }
      }

      // Look for comma-separated values
      const commaSeparated = line
        .split(/,|;/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
      for (const item of commaSeparated) {
        // Check if this matches any known technical skill
        for (const skill of technicalKeywords) {
          if (skill.patterns.some((pattern) => checkForSkill(item, [pattern]))) {
            technicalSkills.add(skill.name)
          }
        }

        // Check if this matches any known soft skill
        for (const skill of softKeywords) {
          if (skill.patterns.some((pattern) => checkForSkill(item, [pattern]))) {
            softSkills.add(skill.name)
          }
        }
      }
    }
  }

  return {
    technical: Array.from(technicalSkills),
    soft: Array.from(softSkills),
  }
}

/**
 * Simple resume validator that checks for basic elements
 */
export function validateResume(text: string) {
  const results = {
    hasEmail: false,
    hasPhone: false,
    hasLinks: false,
    foundLinks: [] as string[],
    suggestions: [] as string[],
    skills: {
      technical: [] as string[],
      soft: [] as string[],
    },
  }

  // Check for email
  results.hasEmail = text.includes("@")

  // Check for phone (simple check for digits)
  results.hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)

  // Extract potential links
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(linkedin\.com\/[^\s]+)|(github\.com\/[^\s]+)/g
  const matches = text.match(urlRegex) || []

  results.hasLinks = matches.length > 0
  results.foundLinks = matches.map((link) => {
    // Add https:// if it's missing
    if (link.startsWith("www.")) {
      return "https://" + link
    }
    if (!link.startsWith("http")) {
      return "https://" + link
    }
    return link
  })

  // Extract skills
  const extractedSkills = extractSkills(text)
  results.skills.technical = extractedSkills.technical
  results.skills.soft = extractedSkills.soft

  // Add suggestions
  if (!results.hasEmail) {
    results.suggestions.push("Consider adding an email address for contact information")
  }

  if (!results.hasPhone) {
    results.suggestions.push("Consider adding a phone number for contact information")
  }

  if (!results.hasLinks) {
    results.suggestions.push("Consider adding professional profile links (LinkedIn, GitHub, etc.)")
  }

  if (results.skills.technical.length === 0) {
    results.suggestions.push("Consider highlighting more technical skills in your resume")
  }

  return results
}

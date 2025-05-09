import { type SkillNode, SkillCategory, SkillDomain, SkillRelationshipType } from "../types"
import { SkillsGraph } from "../graph"

/**
 * Backend development skills knowledge graph
 */
export function buildBackendSkillsGraph(): SkillsGraph {
  const graph = new SkillsGraph()

  // Programming Languages
  const javascript: SkillNode = {
    id: "javascript",
    name: "JavaScript",
    aliases: ["JS", "ECMAScript"],
    normalizedName: "javascript",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.FRONTEND, SkillDomain.BACKEND, SkillDomain.FULLSTACK],
    description: "A high-level, interpreted programming language used for web development",
    popularity: 95,
    versions: ["ES5", "ES6", "ES2020", "ES2021"],
  }

  const typescript: SkillNode = {
    id: "typescript",
    name: "TypeScript",
    aliases: ["TS"],
    normalizedName: "typescript",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.FRONTEND, SkillDomain.BACKEND, SkillDomain.FULLSTACK],
    description: "A strongly typed programming language that builds on JavaScript",
    popularity: 85,
  }

  const python: SkillNode = {
    id: "python",
    name: "Python",
    aliases: [],
    normalizedName: "python",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.BACKEND, SkillDomain.DATA, SkillDomain.AI_ML],
    description: "A high-level, interpreted programming language",
    popularity: 90,
    versions: ["Python 2", "Python 3"],
  }

  const java: SkillNode = {
    id: "java",
    name: "Java",
    aliases: [],
    normalizedName: "java",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.BACKEND, SkillDomain.MOBILE],
    description: "A class-based, object-oriented programming language",
    popularity: 80,
  }

  const csharp: SkillNode = {
    id: "csharp",
    name: "C#",
    aliases: ["CSharp", "C Sharp"],
    normalizedName: "csharp",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.BACKEND],
    description: "A multi-paradigm programming language developed by Microsoft",
    popularity: 75,
  }

  const go: SkillNode = {
    id: "go",
    name: "Go",
    aliases: ["Golang"],
    normalizedName: "go",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.BACKEND, SkillDomain.DEVOPS],
    description: "A statically typed, compiled programming language designed at Google",
    popularity: 70,
  }

  const php: SkillNode = {
    id: "php",
    name: "PHP",
    aliases: [],
    normalizedName: "php",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.BACKEND],
    description: "A popular general-purpose scripting language suited for web development",
    popularity: 65,
  }

  const ruby: SkillNode = {
    id: "ruby",
    name: "Ruby",
    aliases: [],
    normalizedName: "ruby",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.BACKEND],
    description: "A dynamic, open source programming language with a focus on simplicity and productivity",
    popularity: 60,
  }

  // Backend Frameworks
  const nodejs: SkillNode = {
    id: "nodejs",
    name: "Node.js",
    aliases: ["Node"],
    normalizedName: "nodejs",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description: "A JavaScript runtime built on Chrome's V8 JavaScript engine",
    popularity: 90,
  }

  const express: SkillNode = {
    id: "express",
    name: "Express.js",
    aliases: ["Express"],
    normalizedName: "expressjs",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description: "A minimal and flexible Node.js web application framework",
    popularity: 85,
  }

  const django: SkillNode = {
    id: "django",
    name: "Django",
    aliases: [],
    normalizedName: "django",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description: "A high-level Python web framework",
    popularity: 75,
  }

  const flask: SkillNode = {
    id: "flask",
    name: "Flask",
    aliases: [],
    normalizedName: "flask",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description: "A micro web framework written in Python",
    popularity: 70,
  }

  const springBoot: SkillNode = {
    id: "spring-boot",
    name: "Spring Boot",
    aliases: ["Spring"],
    normalizedName: "springboot",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description: "An extension of the Spring framework that simplifies the initial setup",
    popularity: 80,
  }

  const dotnet: SkillNode = {
    id: "dotnet",
    name: ".NET",
    aliases: ["dotNET", "ASP.NET"],
    normalizedName: "dotnet",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description:
      "A free, cross-platform, open-source developer platform for building many different types of applications",
    popularity: 75,
  }

  const laravel: SkillNode = {
    id: "laravel",
    name: "Laravel",
    aliases: [],
    normalizedName: "laravel",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description: "A PHP web application framework",
    popularity: 65,
  }

  const rubyOnRails: SkillNode = {
    id: "ruby-on-rails",
    name: "Ruby on Rails",
    aliases: ["Rails"],
    normalizedName: "rubyonrails",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.BACKEND],
    description: "A server-side web application framework written in Ruby",
    popularity: 60,
  }

  // Databases
  const mongodb: SkillNode = {
    id: "mongodb",
    name: "MongoDB",
    aliases: [],
    normalizedName: "mongodb",
    category: SkillCategory.DATABASE,
    domains: [SkillDomain.BACKEND, SkillDomain.DATA],
    description: "A NoSQL database program that uses JSON-like documents",
    popularity: 85,
  }

  const postgresql: SkillNode = {
    id: "postgresql",
    name: "PostgreSQL",
    aliases: ["Postgres"],
    normalizedName: "postgresql",
    category: SkillCategory.DATABASE,
    domains: [SkillDomain.BACKEND, SkillDomain.DATA],
    description: "A powerful, open source object-relational database system",
    popularity: 85,
  }

  const mysql: SkillNode = {
    id: "mysql",
    name: "MySQL",
    aliases: [],
    normalizedName: "mysql",
    category: SkillCategory.DATABASE,
    domains: [SkillDomain.BACKEND, SkillDomain.DATA],
    description: "An open-source relational database management system",
    popularity: 80,
  }

  const redis: SkillNode = {
    id: "redis",
    name: "Redis",
    aliases: [],
    normalizedName: "redis",
    category: SkillCategory.DATABASE,
    domains: [SkillDomain.BACKEND],
    description: "An in-memory data structure store, used as a database, cache, and message broker",
    popularity: 75,
  }

  const elasticsearch: SkillNode = {
    id: "elasticsearch",
    name: "Elasticsearch",
    aliases: [],
    normalizedName: "elasticsearch",
    category: SkillCategory.DATABASE,
    domains: [SkillDomain.BACKEND, SkillDomain.DATA],
    description: "A distributed, RESTful search and analytics engine",
    popularity: 70,
  }

  // API
  const restfulApi: SkillNode = {
    id: "restful-api",
    name: "RESTful API",
    aliases: ["REST API", "REST", "RESTful API Design"],
    normalizedName: "restfulapi",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.BACKEND, SkillDomain.FRONTEND],
    description: "An architectural style for an application program interface (API) that uses HTTP requests",
    popularity: 85,
  }

  const graphql: SkillNode = {
    id: "graphql",
    name: "GraphQL",
    aliases: [],
    normalizedName: "graphql",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.BACKEND, SkillDomain.FRONTEND],
    description: "A query language for APIs and a runtime for executing those queries",
    popularity: 75,
  }

  // Architecture
  const microservices: SkillNode = {
    id: "microservices",
    name: "Microservices",
    aliases: ["Microservices Architecture"],
    normalizedName: "microservices",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.BACKEND, SkillDomain.DEVOPS],
    description: "An architectural style that structures an application as a collection of services",
    popularity: 80,
  }

  const serverless: SkillNode = {
    id: "serverless",
    name: "Serverless",
    aliases: ["Serverless Architecture", "FaaS"],
    normalizedName: "serverless",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.BACKEND, SkillDomain.DEVOPS],
    description: "A cloud computing execution model where the cloud provider runs the server",
    popularity: 75,
  }

  // Cloud Services
  const aws: SkillNode = {
    id: "aws",
    name: "AWS",
    aliases: ["Amazon Web Services"],
    normalizedName: "aws",
    category: SkillCategory.PLATFORM,
    domains: [SkillDomain.BACKEND, SkillDomain.DEVOPS, SkillDomain.FULLSTACK],
    description: "A cloud computing platform provided by Amazon",
    popularity: 90,
  }

  const azure: SkillNode = {
    id: "azure",
    name: "Azure",
    aliases: ["Microsoft Azure"],
    normalizedName: "azure",
    category: SkillCategory.PLATFORM,
    domains: [SkillDomain.BACKEND, SkillDomain.DEVOPS, SkillDomain.FULLSTACK],
    description: "A cloud computing platform provided by Microsoft",
    popularity: 85,
  }

  const gcp: SkillNode = {
    id: "gcp",
    name: "GCP",
    aliases: ["Google Cloud Platform"],
    normalizedName: "gcp",
    category: SkillCategory.PLATFORM,
    domains: [SkillDomain.BACKEND, SkillDomain.DEVOPS, SkillDomain.FULLSTACK],
    description: "A cloud computing platform provided by Google",
    popularity: 80,
  }

  // DevOps
  const docker: SkillNode = {
    id: "docker",
    name: "Docker",
    aliases: [],
    normalizedName: "docker",
    category: SkillCategory.TOOL,
    domains: [SkillDomain.DEVOPS, SkillDomain.BACKEND],
    description: "A platform for developing, shipping, and running applications in containers",
    popularity: 85,
  }

  const kubernetes: SkillNode = {
    id: "kubernetes",
    name: "Kubernetes",
    aliases: ["K8s"],
    normalizedName: "kubernetes",
    category: SkillCategory.TOOL,
    domains: [SkillDomain.DEVOPS, SkillDomain.BACKEND],
    description:
      "An open-source container orchestration system for automating application deployment, scaling, and management",
    popularity: 80,
  }

  const cicd: SkillNode = {
    id: "cicd",
    name: "CI/CD",
    aliases: ["Continuous Integration", "Continuous Deployment", "CI/CD Pipelines"],
    normalizedName: "cicd",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.DEVOPS, SkillDomain.BACKEND],
    description: "The combined practices of continuous integration and continuous deployment",
    popularity: 85,
  }

  // Security
  const securityBestPractices: SkillNode = {
    id: "security-best-practices",
    name: "Security Best Practices",
    aliases: ["Web Security"],
    normalizedName: "securitybestpractices",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.SECURITY, SkillDomain.FRONTEND, SkillDomain.BACKEND],
    description: "Guidelines and practices for securing web applications",
    popularity: 80,
  }

  const oauth: SkillNode = {
    id: "oauth",
    name: "OAuth",
    aliases: ["OAuth 2.0"],
    normalizedName: "oauth",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.SECURITY, SkillDomain.BACKEND],
    description: "An open standard for access delegation",
    popularity: 75,
  }

  const jwt: SkillNode = {
    id: "jwt",
    name: "JWT",
    aliases: ["JSON Web Token"],
    normalizedName: "jwt",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.SECURITY, SkillDomain.BACKEND],
    description: "A compact, URL-safe means of representing claims to be transferred between two parties",
    popularity: 75,
  }

  // Add all nodes to the graph
  ;[
    javascript,
    typescript,
    python,
    java,
    csharp,
    go,
    php,
    ruby,
    nodejs,
    express,
    django,
    flask,
    springBoot,
    dotnet,
    laravel,
    rubyOnRails,
    mongodb,
    postgresql,
    mysql,
    redis,
    elasticsearch,
    restfulApi,
    graphql,
    microservices,
    serverless,
    aws,
    azure,
    gcp,
    docker,
    kubernetes,
    cicd,
    securityBestPractices,
    oauth,
    jwt,
  ].forEach((node) => graph.addSkill(node))

  // Add relationships

  // Language to framework relationships
  graph.addRelationship({
    sourceId: "nodejs",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.95,
  })

  graph.addRelationship({
    sourceId: "express",
    targetId: "nodejs",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "django",
    targetId: "python",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "flask",
    targetId: "python",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "springBoot",
    targetId: "java",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.95,
  })

  graph.addRelationship({
    sourceId: "dotnet",
    targetId: "csharp",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "laravel",
    targetId: "php",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.95,
  })

  graph.addRelationship({
    sourceId: "rubyOnRails",
    targetId: "ruby",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.95,
  })

  // Framework alternatives
  graph.addRelationship({
    sourceId: "express",
    targetId: "django",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.7,
  })

  graph.addRelationship({
    sourceId: "django",
    targetId: "flask",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.8,
    context: "Within the Python ecosystem",
  })

  graph.addRelationship({
    sourceId: "springBoot",
    targetId: "dotnet",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.7,
  })

  // Database relationships
  graph.addRelationship({
    sourceId: "postgresql",
    targetId: "mysql",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "mongodb",
    targetId: "postgresql",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.6,
    context: "NoSQL vs SQL",
  })

  // API relationships
  graph.addRelationship({
    sourceId: "graphql",
    targetId: "restfulApi",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.8,
  })

  // Architecture relationships
  graph.addRelationship({
    sourceId: "microservices",
    targetId: "serverless",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.7,
  })

  // Cloud relationships
  graph.addRelationship({
    sourceId: "aws",
    targetId: "azure",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "aws",
    targetId: "gcp",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.8,
  })

  // DevOps relationships
  graph.addRelationship({
    sourceId: "kubernetes",
    targetId: "docker",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "cicd",
    targetId: "docker",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.8,
  })

  // Security relationships
  graph.addRelationship({
    sourceId: "jwt",
    targetId: "oauth",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "securityBestPractices",
    targetId: "oauth",
    type: SkillRelationshipType.PARENT_OF,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "securityBestPractices",
    targetId: "jwt",
    type: SkillRelationshipType.PARENT_OF,
    strength: 0.8,
  })

  return graph
}

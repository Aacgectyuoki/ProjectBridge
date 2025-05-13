import { type SkillNode, SkillCategory, SkillDomain, SkillRelationshipType } from "../types"
import { SkillsGraph } from "../graph"

/**
 * Frontend development skills knowledge graph
 */
export function buildFrontendSkillsGraph(): SkillsGraph {
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

  const html: SkillNode = {
    id: "html",
    name: "HTML",
    aliases: ["HTML5"],
    normalizedName: "html",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.FRONTEND],
    description: "The standard markup language for documents designed to be displayed in a web browser",
    popularity: 95,
    versions: ["HTML4", "HTML5"],
  }

  const css: SkillNode = {
    id: "css",
    name: "CSS",
    aliases: ["CSS3", "Cascading Style Sheets"],
    normalizedName: "css",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    domains: [SkillDomain.FRONTEND],
    description: "A style sheet language used for describing the presentation of a document",
    popularity: 95,
    versions: ["CSS2", "CSS3"],
  }

  // Frontend Frameworks
  const react: SkillNode = {
    id: "react",
    name: "React",
    aliases: ["React.js", "ReactJS"],
    normalizedName: "react",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.FRONTEND],
    description: "A JavaScript library for building user interfaces",
    popularity: 90,
  }

  const angular: SkillNode = {
    id: "angular",
    name: "Angular",
    aliases: ["Angular.js", "AngularJS"],
    normalizedName: "angular",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.FRONTEND],
    description: "A platform for building mobile and desktop web applications",
    popularity: 75,
    versions: ["AngularJS", "Angular 2+"],
  }

  const vue: SkillNode = {
    id: "vue",
    name: "Vue",
    aliases: ["Vue.js", "VueJS"],
    normalizedName: "vue",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.FRONTEND],
    description: "A progressive framework for building user interfaces",
    popularity: 70,
  }

  const nextjs: SkillNode = {
    id: "nextjs",
    name: "Next.js",
    aliases: ["Next"],
    normalizedName: "nextjs",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.FRONTEND, SkillDomain.FULLSTACK],
    description: "A React framework for production",
    popularity: 80,
  }

  // CSS Frameworks
  const tailwind: SkillNode = {
    id: "tailwind",
    name: "Tailwind CSS",
    aliases: ["Tailwind"],
    normalizedName: "tailwindcss",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.FRONTEND],
    description: "A utility-first CSS framework",
    popularity: 85,
  }

  const bootstrap: SkillNode = {
    id: "bootstrap",
    name: "Bootstrap",
    aliases: [],
    normalizedName: "bootstrap",
    category: SkillCategory.FRAMEWORK,
    domains: [SkillDomain.FRONTEND],
    description: "A CSS framework directed at responsive, mobile-first front-end web development",
    popularity: 80,
  }

  const sass: SkillNode = {
    id: "sass",
    name: "Sass",
    aliases: ["SCSS"],
    normalizedName: "sass",
    category: SkillCategory.LIBRARY,
    domains: [SkillDomain.FRONTEND],
    description: "A preprocessor scripting language that is interpreted or compiled into CSS",
    popularity: 75,
  }

  // State Management
  const redux: SkillNode = {
    id: "redux",
    name: "Redux",
    aliases: [],
    normalizedName: "redux",
    category: SkillCategory.LIBRARY,
    domains: [SkillDomain.FRONTEND],
    description: "A predictable state container for JavaScript apps",
    popularity: 75,
  }

  // Animation Libraries
  const gsap: SkillNode = {
    id: "gsap",
    name: "GSAP",
    aliases: ["GreenSock Animation Platform"],
    normalizedName: "gsap",
    category: SkillCategory.LIBRARY,
    domains: [SkillDomain.FRONTEND],
    description: "A JavaScript animation library for creating animations",
    popularity: 65,
  }

  const framerMotion: SkillNode = {
    id: "framer-motion",
    name: "Framer Motion",
    aliases: ["Motion"],
    normalizedName: "framermotion",
    category: SkillCategory.LIBRARY,
    domains: [SkillDomain.FRONTEND],
    description: "A production-ready motion library for React",
    popularity: 60,
  }

  // Testing Libraries
  const jest: SkillNode = {
    id: "jest",
    name: "Jest",
    aliases: [],
    normalizedName: "jest",
    category: SkillCategory.TOOL,
    domains: [SkillDomain.FRONTEND, SkillDomain.BACKEND],
    description: "A JavaScript testing framework",
    popularity: 80,
  }

  const cypress: SkillNode = {
    id: "cypress",
    name: "Cypress",
    aliases: [],
    normalizedName: "cypress",
    category: SkillCategory.TOOL,
    domains: [SkillDomain.FRONTEND],
    description: "A JavaScript end-to-end testing framework",
    popularity: 75,
  }

  // 3D Libraries
  const threejs: SkillNode = {
    id: "threejs",
    name: "Three.js",
    aliases: ["ThreeJS"],
    normalizedName: "threejs",
    category: SkillCategory.LIBRARY,
    domains: [SkillDomain.FRONTEND],
    description: "A JavaScript 3D library",
    popularity: 60,
  }

  // CMS
  const sanity: SkillNode = {
    id: "sanity",
    name: "Sanity",
    aliases: ["Sanity.io"],
    normalizedName: "sanity",
    category: SkillCategory.PLATFORM,
    domains: [SkillDomain.FRONTEND, SkillDomain.BACKEND],
    description: "A headless CMS platform",
    popularity: 55,
  }

  // Concepts
  const responsiveDesign: SkillNode = {
    id: "responsive-design",
    name: "Responsive Design",
    aliases: ["Responsive Web Design"],
    normalizedName: "responsivedesign",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.FRONTEND, SkillDomain.DESIGN],
    description: "An approach to web design that makes web pages render well on a variety of devices",
    popularity: 90,
  }

  const componentLibrary: SkillNode = {
    id: "component-library",
    name: "Component Library",
    aliases: ["UI Library", "Design System"],
    normalizedName: "componentlibrary",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.FRONTEND, SkillDomain.DESIGN],
    description: "A collection of reusable UI components",
    popularity: 80,
  }

  const seo: SkillNode = {
    id: "seo",
    name: "SEO",
    aliases: ["Search Engine Optimization"],
    normalizedName: "seo",
    category: SkillCategory.CONCEPT,
    domains: [SkillDomain.FRONTEND, SkillDomain.MARKETING],
    description: "The process of improving the quality and quantity of website traffic to a website",
    popularity: 75,
  }

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

  // Add all nodes to the graph
  ;[
    javascript,
    typescript,
    html,
    css,
    react,
    angular,
    vue,
    nextjs,
    tailwind,
    bootstrap,
    sass,
    redux,
    gsap,
    framerMotion,
    jest,
    cypress,
    threejs,
    sanity,
    responsiveDesign,
    componentLibrary,
    seo,
    restfulApi,
    securityBestPractices,
  ].forEach((node) => graph.addSkill(node))

  // Add relationships

  // Language relationships
  graph.addRelationship({
    sourceId: "typescript",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
    context: "TypeScript is a superset of JavaScript",
  })

  // Framework requirements
  graph.addRelationship({
    sourceId: "react",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "angular",
    targetId: "typescript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "vue",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "nextjs",
    targetId: "react",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.95,
    context: "Next.js is a React framework",
  })

  // Framework alternatives
  graph.addRelationship({
    sourceId: "react",
    targetId: "angular",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "react",
    targetId: "vue",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.8,
  })

  // CSS frameworks
  graph.addRelationship({
    sourceId: "tailwind",
    targetId: "css",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "bootstrap",
    targetId: "css",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "sass",
    targetId: "css",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "tailwind",
    targetId: "bootstrap",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.7,
  })

  // State management
  graph.addRelationship({
    sourceId: "redux",
    targetId: "react",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.8,
  })

  // Animation libraries
  graph.addRelationship({
    sourceId: "gsap",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "framer-motion",
    targetId: "react",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "gsap",
    targetId: "framer-motion",
    type: SkillRelationshipType.ALTERNATIVE_TO,
    strength: 0.7,
    context: "For React applications",
  })

  // Testing
  graph.addRelationship({
    sourceId: "jest",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "cypress",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.8,
  })

  // 3D
  graph.addRelationship({
    sourceId: "threejs",
    targetId: "javascript",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.8,
  })

  // Concepts
  graph.addRelationship({
    sourceId: "responsiveDesign",
    targetId: "css",
    type: SkillRelationshipType.REQUIRES,
    strength: 0.9,
  })

  graph.addRelationship({
    sourceId: "componentLibrary",
    targetId: "react",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "componentLibrary",
    targetId: "angular",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.8,
  })

  graph.addRelationship({
    sourceId: "componentLibrary",
    targetId: "vue",
    type: SkillRelationshipType.USED_WITH,
    strength: 0.8,
  })

  return graph
}

/**
 * Types for the Skills Knowledge Graph
 */

// Relationship types between skills
export enum SkillRelationshipType {
  PARENT_OF = "PARENT_OF", // Broader category (e.g., JavaScript is PARENT_OF React)
  CHILD_OF = "CHILD_OF", // More specific skill (e.g., React is CHILD_OF JavaScript)
  REQUIRES = "REQUIRES", // Prerequisite (e.g., React REQUIRES JavaScript)
  SIMILAR_TO = "SIMILAR_TO", // Similar skills (e.g., React is SIMILAR_TO Vue)
  ALTERNATIVE_TO = "ALTERNATIVE_TO", // Alternative skills (e.g., PostgreSQL is ALTERNATIVE_TO MySQL)
  USED_WITH = "USED_WITH", // Commonly used together (e.g., React is USED_WITH Redux)
  SUCCESSOR_OF = "SUCCESSOR_OF", // Newer version (e.g., ES6 is SUCCESSOR_OF ES5)
  PREDECESSOR_OF = "PREDECESSOR_OF", // Older version (e.g., ES5 is PREDECESSOR_OF ES6)
}

// Skill categories
export enum SkillCategory {
  PROGRAMMING_LANGUAGE = "PROGRAMMING_LANGUAGE",
  FRAMEWORK = "FRAMEWORK",
  LIBRARY = "LIBRARY",
  DATABASE = "DATABASE",
  TOOL = "TOOL",
  PLATFORM = "PLATFORM",
  METHODOLOGY = "METHODOLOGY",
  CONCEPT = "CONCEPT",
  SOFT_SKILL = "SOFT_SKILL",
}

// Skill domains
export enum SkillDomain {
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND",
  FULLSTACK = "FULLSTACK",
  DEVOPS = "DEVOPS",
  DATA = "DATA",
  MOBILE = "MOBILE",
  AI_ML = "AI_ML",
  SECURITY = "SECURITY",
  DESIGN = "DESIGN",
  MANAGEMENT = "MANAGEMENT",
}

// Skill proficiency levels
export enum SkillProficiencyLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

// Skill node in the knowledge graph
export interface SkillNode {
  id: string // Unique identifier
  name: string // Primary name
  aliases: string[] // Alternative names (e.g., "JS" for "JavaScript")
  normalizedName: string // Lowercase, no spaces version for matching
  category: SkillCategory // Type of skill
  domains: SkillDomain[] // Applicable domains
  description?: string // Brief description
  popularity?: number // Relative popularity (0-100)
  isDeprecated?: boolean // Whether the skill is deprecated
  versions?: string[] // Different versions if applicable
}

// Relationship between skills
export interface SkillRelationship {
  sourceId: string // Source skill ID
  targetId: string // Target skill ID
  type: SkillRelationshipType // Type of relationship
  strength: number // Strength of relationship (0-1)
  context?: string // Additional context about the relationship
}

// The complete knowledge graph
export interface SkillsKnowledgeGraph {
  nodes: Record<string, SkillNode> // Map of skill nodes by ID
  relationships: SkillRelationship[] // List of relationships between skills
  getRelatedSkills(skillId: string, types?: SkillRelationshipType[]): SkillNode[]
  findSkillByName(name: string): SkillNode | null
  findSimilarSkills(name: string, threshold?: number): SkillNode[]
  isSkillRelatedTo(skillId1: string, skillId2: string, types?: SkillRelationshipType[]): boolean
  getSkillHierarchy(skillId: string): SkillNode[]
  normalizeSkillName(name: string): string
}

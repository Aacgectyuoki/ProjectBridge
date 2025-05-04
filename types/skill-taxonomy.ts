export interface Skill {
  id: string
  name: string
  normalized_name: string
  category: string
  description?: string
  popularity?: number
  created_at?: string
  updated_at?: string
}

export interface SkillRelationship {
  id: string
  parent_skill_id: string
  child_skill_id: string
  relationship_type: "parent-child" | "requires" | "similar" | "alternative"
  strength: number // 0-1 indicating how strong the relationship is
  created_at?: string
  updated_at?: string
}

export interface SkillEquivalent {
  id: string
  skill_id: string
  equivalent_term: string
  normalized_term: string
  created_at?: string
  updated_at?: string
}

export interface SkillCategory {
  id: string
  name: string
  description?: string
  parent_category_id?: string
  created_at?: string
  updated_at?: string
}

export interface SkillExtractionResult {
  skills: {
    name: string
    category: string
    level: string
    context: string
  }[]
  summary: string
}

import { createClient } from "@supabase/supabase-js"
import type { Skill, SkillRelationship, SkillEquivalent } from "../types/skill-taxonomy"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Normalize a skill name for consistent matching
 */
export function normalizeSkillName(skillName: string): string {
  return skillName.toLowerCase().trim()
}

/**
 * Find a skill by name
 */
export async function findSkill(skillName: string): Promise<Skill | null> {
  const normalizedName = normalizeSkillName(skillName)

  const { data, error } = await supabase.from("skills").select("*").eq("normalized_name", normalizedName).maybeSingle()

  if (error) {
    console.error("Error finding skill:", error)
    return null
  }

  return data as Skill
}

/**
 * Find all skills by category
 */
export async function findSkillsByCategory(category: string): Promise<Skill[]> {
  const { data, error } = await supabase.from("skills").select("*").eq("category", category)

  if (error) {
    console.error("Error finding skills by category:", error)
    return []
  }

  return data as Skill[]
}

/**
 * Find all related skills for a given skill
 */
export async function findRelatedSkills(skillName: string): Promise<Skill[]> {
  const skill = await findSkill(skillName)
  if (!skill) return []

  // Get all child skills from relationships
  const { data: relationships, error } = await supabase
    .from("skill_relationships")
    .select("child_skill_id")
    .eq("parent_skill_id", skill.id)

  if (error || !relationships.length) {
    return []
  }

  const childSkillIds = relationships.map((rel) => rel.child_skill_id)

  const { data: skills, error: skillsError } = await supabase.from("skills").select("*").in("id", childSkillIds)

  if (skillsError) {
    console.error("Error finding related skills:", skillsError)
    return []
  }

  return skills as Skill[]
}

/**
 * Find all equivalent terms for a skill
 */
export async function findEquivalentTerms(skillName: string): Promise<string[]> {
  const skill = await findSkill(skillName)
  if (!skill) return []

  const { data, error } = await supabase.from("skill_equivalents").select("equivalent_term").eq("skill_id", skill.id)

  if (error) {
    console.error("Error finding equivalent terms:", error)
    return []
  }

  return data.map((item) => item.equivalent_term)
}

/**
 * Check if two skills are semantically equivalent
 */
export async function areSkillsEquivalent(skillA: string, skillB: string): Promise<boolean> {
  const normalizedA = normalizeSkillName(skillA)
  const normalizedB = normalizeSkillName(skillB)

  // Direct match
  if (normalizedA === normalizedB) return true

  // Check if skillB is an equivalent of skillA
  const equivalentsA = await findEquivalentTerms(skillA)
  if (equivalentsA.some((term) => normalizeSkillName(term) === normalizedB)) return true

  // Check if skillA is an equivalent of skillB
  const equivalentsB = await findEquivalentTerms(skillB)
  if (equivalentsB.some((term) => normalizeSkillName(term) === normalizedA)) return true

  return false
}

/**
 * Find semantic matches between resume skills and job skills
 */
export async function findSemanticMatches(resumeSkills: string[], jobSkills: string[]): Promise<Map<string, string[]>> {
  const matches = new Map<string, string[]>()

  for (const resumeSkill of resumeSkills) {
    const matchedJobSkills: string[] = []

    for (const jobSkill of jobSkills) {
      const isEquivalent = await areSkillsEquivalent(resumeSkill, jobSkill)
      if (isEquivalent) {
        matchedJobSkills.push(jobSkill)
      }
    }

    if (matchedJobSkills.length > 0) {
      matches.set(resumeSkill, matchedJobSkills)
    }
  }

  return matches
}

/**
 * Add a new skill to the database
 */
export async function addSkill(skill: Omit<Skill, "id" | "created_at" | "updated_at">): Promise<Skill | null> {
  const { data, error } = await supabase
    .from("skills")
    .insert({
      ...skill,
      normalized_name: normalizeSkillName(skill.name),
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding skill:", error)
    return null
  }

  return data as Skill
}

/**
 * Add an equivalent term for a skill
 */
export async function addEquivalentTerm(skillId: string, term: string): Promise<SkillEquivalent | null> {
  const { data, error } = await supabase
    .from("skill_equivalents")
    .insert({
      skill_id: skillId,
      equivalent_term: term,
      normalized_term: normalizeSkillName(term),
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding equivalent term:", error)
    return null
  }

  return data as SkillEquivalent
}

/**
 * Add a relationship between two skills
 */
export async function addSkillRelationship(
  parentSkillId: string,
  childSkillId: string,
  type: string,
  strength = 1.0,
): Promise<SkillRelationship | null> {
  const { data, error } = await supabase
    .from("skill_relationships")
    .insert({
      parent_skill_id: parentSkillId,
      child_skill_id: childSkillId,
      relationship_type: type,
      strength,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding skill relationship:", error)
    return null
  }

  return data as SkillRelationship
}

/**
 * Search for skills by name (partial match)
 */
export async function searchSkills(query: string): Promise<Skill[]> {
  const normalizedQuery = normalizeSkillName(query)

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .ilike("normalized_name", `%${normalizedQuery}%`)
    .order("popularity", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error searching skills:", error)
    return []
  }

  return data as Skill[]
}

/**
 * Get all skill categories
 */
export async function getAllCategories(): Promise<string[]> {
  const { data, error } = await supabase.from("skill_categories").select("name").order("name")

  if (error) {
    console.error("Error getting categories:", error)
    return []
  }

  return data.map((category) => category.name)
}

/**
 * Get popular skills
 */
export async function getPopularSkills(limit = 20): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("popularity", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error getting popular skills:", error)
    return []
  }

  return data as Skill[]
}

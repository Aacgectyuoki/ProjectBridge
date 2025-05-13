import { type SkillNode, type SkillRelationship, SkillRelationshipType, type SkillsKnowledgeGraph } from "./types"

/**
 * Implementation of the Skills Knowledge Graph
 */
export class SkillsGraph implements SkillsKnowledgeGraph {
  nodes: Record<string, SkillNode> = {}
  relationships: SkillRelationship[] = []

  /**
   * Add a skill node to the graph
   */
  addSkill(skill: SkillNode): void {
    this.nodes[skill.id] = {
      ...skill,
      normalizedName: this.normalizeSkillName(skill.name),
      aliases: skill.aliases || [],
    }
  }

  /**
   * Add a relationship between skills
   */
  addRelationship(relationship: SkillRelationship): void {
    // Validate that both skills exist
    if (!this.nodes[relationship.sourceId] || !this.nodes[relationship.targetId]) {
      throw new Error(`Cannot add relationship: one or both skills do not exist`)
    }

    this.relationships.push(relationship)

    // Add the inverse relationship if it's bidirectional
    if (this.isInversableRelationship(relationship.type)) {
      this.relationships.push({
        sourceId: relationship.targetId,
        targetId: relationship.sourceId,
        type: this.getInverseRelationshipType(relationship.type),
        strength: relationship.strength,
        context: relationship.context,
      })
    }
  }

  /**
   * Get all skills related to a given skill
   */
  getRelatedSkills(skillId: string, types?: SkillRelationshipType[]): SkillNode[] {
    if (!this.nodes[skillId]) {
      return []
    }

    const relatedSkillIds = this.relationships
      .filter((rel) => rel.sourceId === skillId && (!types || types.includes(rel.type)))
      .map((rel) => rel.targetId)

    return relatedSkillIds.map((id) => this.nodes[id])
  }

  /**
   * Find a skill by name or alias
   */
  findSkillByName(name: string): SkillNode | null {
    const normalizedName = this.normalizeSkillName(name)

    // First try exact match on normalized name
    const exactMatch = Object.values(this.nodes).find((node) => node.normalizedName === normalizedName)

    if (exactMatch) {
      return exactMatch
    }

    // Then try matching aliases
    return (
      Object.values(this.nodes).find((node) =>
        node.aliases.some((alias) => this.normalizeSkillName(alias) === normalizedName),
      ) || null
    )
  }

  /**
   * Find skills similar to the given name
   */
  findSimilarSkills(name: string, threshold = 0.7): SkillNode[] {
    const normalizedName = this.normalizeSkillName(name)

    return Object.values(this.nodes)
      .filter((node) => {
        // Check main name
        if (this.calculateSimilarity(normalizedName, node.normalizedName) >= threshold) {
          return true
        }

        // Check aliases
        return node.aliases.some(
          (alias) => this.calculateSimilarity(normalizedName, this.normalizeSkillName(alias)) >= threshold,
        )
      })
      .sort((a, b) => {
        // Sort by similarity score (highest first)
        const scoreA = Math.max(
          this.calculateSimilarity(normalizedName, a.normalizedName),
          ...a.aliases.map((alias) => this.calculateSimilarity(normalizedName, this.normalizeSkillName(alias))),
        )

        const scoreB = Math.max(
          this.calculateSimilarity(normalizedName, b.normalizedName),
          ...b.aliases.map((alias) => this.calculateSimilarity(normalizedName, this.normalizeSkillName(alias))),
        )

        return scoreB - scoreA
      })
  }

  /**
   * Check if two skills are related
   */
  isSkillRelatedTo(skillId1: string, skillId2: string, types?: SkillRelationshipType[]): boolean {
    return this.relationships.some(
      (rel) => rel.sourceId === skillId1 && rel.targetId === skillId2 && (!types || types.includes(rel.type)),
    )
  }

  /**
   * Get the hierarchy of a skill (parents and children)
   */
  getSkillHierarchy(skillId: string): SkillNode[] {
    if (!this.nodes[skillId]) {
      return []
    }

    const hierarchy: SkillNode[] = [this.nodes[skillId]]

    // Add parents
    const parents = this.getRelatedSkills(skillId, [SkillRelationshipType.CHILD_OF])
    hierarchy.push(...parents)

    // Add children
    const children = this.getRelatedSkills(skillId, [SkillRelationshipType.PARENT_OF])
    hierarchy.push(...children)

    return hierarchy
  }

  /**
   * Normalize a skill name for comparison
   */
  normalizeSkillName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, "") // Remove spaces
      .trim()
  }

  /**
   * Calculate similarity between two strings (0-1)
   * Using Levenshtein distance
   */
  private calculateSimilarity(a: string, b: string): number {
    if (a.length === 0) return b.length === 0 ? 1 : 0
    if (b.length === 0) return 0

    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null))

    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        )
      }
    }

    const distance = matrix[b.length][a.length]
    const maxLength = Math.max(a.length, b.length)
    return 1 - distance / maxLength
  }

  /**
   * Check if a relationship type has an inverse
   */
  private isInversableRelationship(type: SkillRelationshipType): boolean {
    return [
      SkillRelationshipType.PARENT_OF,
      SkillRelationshipType.CHILD_OF,
      SkillRelationshipType.REQUIRES,
      SkillRelationshipType.SIMILAR_TO,
      SkillRelationshipType.ALTERNATIVE_TO,
      SkillRelationshipType.SUCCESSOR_OF,
      SkillRelationshipType.PREDECESSOR_OF,
    ].includes(type)
  }

  /**
   * Get the inverse relationship type
   */
  private getInverseRelationshipType(type: SkillRelationshipType): SkillRelationshipType {
    switch (type) {
      case SkillRelationshipType.PARENT_OF:
        return SkillRelationshipType.CHILD_OF
      case SkillRelationshipType.CHILD_OF:
        return SkillRelationshipType.PARENT_OF
      case SkillRelationshipType.REQUIRES:
        return SkillRelationshipType.USED_WITH // Not perfect but close
      case SkillRelationshipType.SIMILAR_TO:
        return SkillRelationshipType.SIMILAR_TO
      case SkillRelationshipType.ALTERNATIVE_TO:
        return SkillRelationshipType.ALTERNATIVE_TO
      case SkillRelationshipType.SUCCESSOR_OF:
        return SkillRelationshipType.PREDECESSOR_OF
      case SkillRelationshipType.PREDECESSOR_OF:
        return SkillRelationshipType.SUCCESSOR_OF
      default:
        return type
    }
  }
}

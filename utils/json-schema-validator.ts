/**
 * JSON Schema validator for skills gap analysis data
 */

/**
 * Validates that an object conforms to the skills gap analysis schema
 * @param data Object to validate
 * @returns Boolean indicating if data is valid
 */
export function validateSkillsGapSchema(data: any): boolean {
  if (!data || typeof data !== "object") return false

  // Required top-level properties
  const requiredProps = ["matchPercentage", "missingSkills", "matchedSkills", "recommendations", "summary"]

  // Check if all required properties exist
  const hasAllRequiredProps = requiredProps.every((prop) => prop in data)
  if (!hasAllRequiredProps) return false

  // Validate property types
  if (typeof data.matchPercentage !== "number") return false
  if (!Array.isArray(data.missingSkills)) return false
  if (!Array.isArray(data.matchedSkills)) return false
  if (!Array.isArray(data.recommendations)) return false
  if (typeof data.summary !== "string") return false

  // Validate array structures

  // All missingSkills items should have required properties
  if (data.missingSkills.some((skill: any) => !skill.name || !skill.level || !skill.priority || !skill.context))
    return false

  // All matchedSkills items should have required properties
  if (data.matchedSkills.some((skill: any) => !skill.name || !skill.proficiency || !skill.relevance)) return false

  // All recommendations items should have required properties
  if (data.recommendations.some((rec: any) => !rec.type || !rec.description || !rec.timeToAcquire || !rec.priority))
    return false

  return true
}

/**
 * Attempts to fix data to conform to the skills gap analysis schema
 * @param data Object to fix
 * @returns Fixed object that conforms to schema
 */
export function repairSkillsGapData(data: any, defaultData: any): any {
  if (!data || typeof data !== "object") return defaultData

  // Create a new object with default properties
  const result = { ...defaultData }

  // Copy valid properties
  if (typeof data.matchPercentage === "number") {
    result.matchPercentage = data.matchPercentage
  }

  if (typeof data.summary === "string") {
    result.summary = data.summary
  }

  // Fix arrays
  if (Array.isArray(data.missingSkills)) {
    result.missingSkills = data.missingSkills
      .filter((skill: any) => skill && typeof skill === "object")
      .map((skill: any) => ({
        name: typeof skill.name === "string" ? skill.name : "",
        level: typeof skill.level === "string" ? skill.level : "Intermediate",
        priority: typeof skill.priority === "string" ? skill.priority : "Medium",
        context: typeof skill.context === "string" ? skill.context : "",
      }))
  }

  if (Array.isArray(data.matchedSkills)) {
    result.matchedSkills = data.matchedSkills
      .filter((skill: any) => skill && typeof skill === "object")
      .map((skill: any) => ({
        name: typeof skill.name === "string" ? skill.name : "",
        proficiency: typeof skill.proficiency === "string" ? skill.proficiency : "Intermediate",
        relevance: typeof skill.relevance === "string" ? skill.relevance : "Medium",
      }))
  }

  if (Array.isArray(data.recommendations)) {
    result.recommendations = data.recommendations
      .filter((rec: any) => rec && typeof rec === "object")
      .map((rec: any) => ({
        type: typeof rec.type === "string" ? rec.type : "Project",
        description: typeof rec.description === "string" ? rec.description : "",
        timeToAcquire: typeof rec.timeToAcquire === "string" ? rec.timeToAcquire : "1-2 months",
        priority: typeof rec.priority === "string" ? rec.priority : "Medium",
      }))
  }

  return result
}

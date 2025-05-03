import { EnhancedSkillsLogger } from "../enhanced-skills-logger"

/**
 * Manages prompt templates with variable substitution
 */
export class PromptTemplate {
  private template: string
  private name: string

  /**
   * Creates a new prompt template
   * @param template The template string with {variable} placeholders
   * @param name Optional name for logging purposes
   */
  constructor(template: string, name = "unnamed-prompt") {
    this.template = template
    this.name = name
  }

  /**
   * Formats the template by replacing variables with their values
   * @param variables Object containing variable names and values
   * @returns Formatted prompt string
   */
  format(variables: Record<string, string>): string {
    console.log(`PromptTemplate: Formatting prompt "${this.name}" with variables:`, Object.keys(variables))

    let result = this.template
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, "g"), value)
    }

    // Log the formatted prompt (truncated for brevity)
    const truncatedPrompt = result.length > 500 ? result.substring(0, 500) + "..." : result
    console.log(`PromptTemplate: Formatted prompt "${this.name}" (truncated): ${truncatedPrompt}`)

    // Log to EnhancedSkillsLogger if this is a skill extraction prompt
    if (this.name.includes("skill") || this.name.includes("Skill")) {
      EnhancedSkillsLogger.logExtractedSkills(
        "prompt-template",
        { technical: [], soft: [] }, // No skills extracted yet
        "prompt-generation",
        0,
      )
    }

    return result
  }

  /**
   * Gets the name of this prompt template
   */
  getName(): string {
    return this.name
  }
}

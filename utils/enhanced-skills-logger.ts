// Enhanced version of the SkillsLogger with more detailed logging capabilities
export type ExtractedSkillsLog = {
  source: string
  timestamp: string
  rawInput: string // Store a snippet of the raw input
  extractedSkills: {
    technical: string[]
    soft: string[]
    tools: string[]
    frameworks: string[]
    languages: string[]
    databases: string[]
    methodologies: string[]
    platforms: string[]
    other: string[]
  }
  processingTime?: number // Optional timing information
}

export class EnhancedSkillsLogger {
  private static readonly STORAGE_KEY = "enhancedSkillsLogs"
  private static readonly MAX_INPUT_LENGTH = 500 // Limit the stored raw input length

  static logExtractedSkills(rawInput: string, extractedSkills: any, source = "resume", processingTime?: number): void {
    // Truncate the raw input to avoid storing too much data
    const truncatedInput =
      rawInput.length > this.MAX_INPUT_LENGTH ? rawInput.substring(0, this.MAX_INPUT_LENGTH) + "..." : rawInput

    const logData: ExtractedSkillsLog = {
      source,
      timestamp: new Date().toISOString(),
      rawInput: truncatedInput,
      extractedSkills: {
        technical: extractedSkills.technical || [],
        soft: extractedSkills.soft || [],
        tools: extractedSkills.tools || [],
        frameworks: extractedSkills.frameworks || [],
        languages: extractedSkills.languages || [],
        databases: extractedSkills.databases || [],
        methodologies: extractedSkills.methodologies || [],
        platforms: extractedSkills.platforms || [],
        other: extractedSkills.other || [],
      },
      processingTime,
    }

    // Log to console
    console.group(`Skills Extraction Log (${source})`)
    console.log(`Time: ${new Date().toLocaleTimeString()}`)
    console.log(`Raw Input (truncated): ${truncatedInput}`)
    console.log("Extracted Skills:", extractedSkills)
    if (processingTime) {
      console.log(`Processing Time: ${processingTime}ms`)
    }
    console.groupEnd()

    // Store in localStorage
    try {
      const existingLogs = localStorage.getItem(this.STORAGE_KEY)
      let logs: ExtractedSkillsLog[] = []

      if (existingLogs) {
        logs = JSON.parse(existingLogs)
      }

      logs.push(logData)

      // Limit the number of logs to prevent localStorage from getting too full
      if (logs.length > 50) {
        logs = logs.slice(-50)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs))
    } catch (error) {
      console.error("Error saving enhanced skills log:", error)
    }
  }

  static getLogs(): ExtractedSkillsLog[] {
    try {
      const logs = localStorage.getItem(this.STORAGE_KEY)
      return logs ? JSON.parse(logs) : []
    } catch (error) {
      console.error("Error retrieving enhanced skills logs:", error)
      return []
    }
  }

  static clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static getSkillCounts(): Record<string, number> {
    const logs = this.getLogs()
    const skillCounts: Record<string, number> = {}

    logs.forEach((log) => {
      Object.values(log.extractedSkills)
        .flat()
        .forEach((skill) => {
          if (skill) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1
          }
        })
    })

    return skillCounts
  }
}

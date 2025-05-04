/**
 * Utility for logging skill extraction results
 */

/**
 * Log extracted skills for analysis and debugging
 */
export function logSkillExtraction(sourceText: string, extractionResult: any): void {
  console.log("Skill extraction completed")

  // Log technical skills if available
  if (extractionResult?.skills?.technical?.length > 0) {
    console.log("Technical skills:", extractionResult.skills.technical)
  }

  // Log soft skills if available
  if (extractionResult?.skills?.soft?.length > 0) {
    console.log("Soft skills:", extractionResult.skills.soft)
  }

  // Log specialized skill categories if available
  const specializedCategories = ["tools", "frameworks", "languages", "databases", "methodologies", "platforms", "other"]

  specializedCategories.forEach((category) => {
    if (extractionResult?.skills?.[category]?.length > 0) {
      console.log(`${category.charAt(0).toUpperCase() + category.slice(1)}:`, extractionResult.skills[category])
    }
  })
}

type SkillsLogData = {
  technicalSkills: string[]
  softSkills: string[]
  timestamp: string
  source: string
}

/**
 * Log skills for analysis
 */
export const SkillsLogger = {
  logSkills: (data: any): void => {
    console.log("Skills logged:", data)
  },
  logSkillsOld: (technicalSkills: string[], softSkills: string[] = [], source = "resume"): void => {
    const logData: SkillsLogData = {
      technicalSkills,
      softSkills,
      timestamp: new Date().toISOString(),
      source,
    }

    // Log to console
    console.group("Skills Analysis Log")
    console.log(`Source: ${source}`)
    console.log(`Time: ${new Date().toLocaleTimeString()}`)
    console.log("Technical Skills:", technicalSkills)
    console.log("Soft Skills:", softSkills)
    console.groupEnd()

    // Store in localStorage for persistence
    try {
      const existingLogs = localStorage.getItem("skillsAnalysisLogs")
      let logs: SkillsLogData[] = []

      if (existingLogs) {
        logs = JSON.parse(existingLogs)
      }

      logs.push(logData)
      localStorage.setItem("skillsAnalysisLogs", JSON.stringify(logs))
    } catch (error) {
      console.error("Error saving skills log:", error)
    }
  },

  getSkillsLogs(): SkillsLogData[] {
    try {
      const logs = localStorage.getItem("skillsAnalysisLogs")
      return logs ? JSON.parse(logs) : []
    } catch (error) {
      console.error("Error retrieving skills logs:", error)
      return []
    }
  },

  clearLogs(): void {
    localStorage.removeItem("skillsAnalysisLogs")
  },

  // Add a method to get a complete list of all skills detected
  getAllDetectedSkills(): { technical: string[]; soft: string[] } {
    const logs = this.getSkillsLogs()

    // Create sets to avoid duplicates
    const technicalSkillsSet = new Set<string>()
    const softSkillsSet = new Set<string>()

    logs.forEach((log) => {
      // Check if technicalSkills exists and is an array before using forEach
      if (log.technicalSkills && Array.isArray(log.technicalSkills)) {
        log.technicalSkills.forEach((skill) => technicalSkillsSet.add(skill))
      }

      // Check if softSkills exists and is an array before using forEach
      if (log.softSkills && Array.isArray(log.softSkills)) {
        log.softSkills.forEach((skill) => softSkillsSet.add(skill))
      }

      // Handle job description logs with requiredSkills and preferredSkills
      if (log.requiredSkills && Array.isArray(log.requiredSkills)) {
        log.requiredSkills.forEach((skill) => technicalSkillsSet.add(skill))
      }

      if (log.preferredSkills && Array.isArray(log.preferredSkills)) {
        log.preferredSkills.forEach((skill) => technicalSkillsSet.add(skill))
      }
    })

    return {
      technical: Array.from(technicalSkillsSet),
      soft: Array.from(softSkillsSet),
    }
  },

  logRoleFocus(roleFocus: string): void {
    console.group("Role Focus Selection")
    console.log(`Selected Role: ${roleFocus}`)
    console.log(`Time: ${new Date().toLocaleTimeString()}`)
    console.groupEnd()

    // Store in localStorage for persistence
    try {
      const existingLogs = localStorage.getItem("skillsAnalysisLogs")
      let logs = []

      if (existingLogs) {
        logs = JSON.parse(existingLogs)
      }

      logs.push({
        roleFocus,
        timestamp: new Date().toISOString(),
        source: "role-selection",
        technicalSkills: [],
        softSkills: [],
      })
      localStorage.setItem("skillsAnalysisLogs", JSON.stringify(logs))
    } catch (error) {
      console.error("Error saving role focus log:", error)
    }
  },

  logJobSkills(requiredSkills: string[], preferredSkills: string[]): void {
    const logData = {
      requiredSkills,
      preferredSkills,
      timestamp: new Date().toISOString(),
      source: "job-description",
    }

    // Log to console
    console.group("Job Skills Analysis Log")
    console.log(`Time: ${new Date().toLocaleTimeString()}`)
    console.log("Required Skills:", requiredSkills)
    console.log("Preferred Skills:", preferredSkills)
    console.groupEnd()

    // Store in localStorage for persistence
    try {
      const existingLogs = localStorage.getItem("jobSkillsLogs")
      let logs = []

      if (existingLogs) {
        logs = JSON.parse(existingLogs)
      }

      logs.push(logData)
      localStorage.setItem("jobSkillsLogs", JSON.stringify(logs))
    } catch (error) {
      console.error("Error saving job skills log:", error)
    }
  },
}

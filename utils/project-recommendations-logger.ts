export type ProjectRecommendationLog = {
  timestamp: string
  projectId: string
  projectTitle: string
  skillsAddressed: string[]
  targetRole: string
  estimatedMatchImprovement: number
  currentMatchPercentage?: number
  projectedMatchPercentage?: number
  userId?: string
}

export class ProjectRecommendationsLogger {
  private static readonly STORAGE_KEY = "projectRecommendationsLogs"

  static logRecommendation(
    projectId: string,
    projectTitle: string,
    skillsAddressed: string[],
    targetRole: string,
    estimatedMatchImprovement: number,
    currentMatchPercentage?: number,
    userId?: string,
  ): void {
    const logData: ProjectRecommendationLog = {
      timestamp: new Date().toISOString(),
      projectId,
      projectTitle,
      skillsAddressed,
      targetRole,
      estimatedMatchImprovement,
      currentMatchPercentage,
      projectedMatchPercentage: currentMatchPercentage
        ? Math.min(100, currentMatchPercentage + estimatedMatchImprovement)
        : undefined,
      userId,
    }

    // Log to console
    console.group(`Project Recommendation Log`)
    console.log(`Time: ${new Date().toLocaleTimeString()}`)
    console.log(`Project: ${projectTitle}`)
    console.log(`Target Role: ${targetRole}`)
    console.log(`Skills Addressed: ${skillsAddressed.join(", ")}`)
    console.log(`Estimated Match Improvement: +${estimatedMatchImprovement}%`)
    if (currentMatchPercentage) {
      console.log(`Current Match: ${currentMatchPercentage}%`)
      console.log(`Projected Match: ${Math.min(100, currentMatchPercentage + estimatedMatchImprovement)}%`)
    }
    console.groupEnd()

    // Store in localStorage
    try {
      const existingLogs = localStorage.getItem(this.STORAGE_KEY)
      let logs: ProjectRecommendationLog[] = []

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
      console.error("Error saving project recommendation log:", error)
    }
  }

  static getLogs(): ProjectRecommendationLog[] {
    try {
      const logs = localStorage.getItem(this.STORAGE_KEY)
      return logs ? JSON.parse(logs) : []
    } catch (error) {
      console.error("Error retrieving project recommendation logs:", error)
      return []
    }
  }

  static clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static getProjectRecommendationStats(): {
    totalRecommendations: number
    mostRecommendedProject: { id: string; title: string; count: number } | null
    mostAddressedSkill: { skill: string; count: number } | null
  } {
    const logs = this.getLogs()

    if (logs.length === 0) {
      return {
        totalRecommendations: 0,
        mostRecommendedProject: null,
        mostAddressedSkill: null,
      }
    }

    // Count project recommendations
    const projectCounts: Record<string, { count: number; title: string }> = {}
    logs.forEach((log) => {
      if (!projectCounts[log.projectId]) {
        projectCounts[log.projectId] = { count: 0, title: log.projectTitle }
      }
      projectCounts[log.projectId].count++
    })

    // Count skills addressed
    const skillCounts: Record<string, number> = {}
    logs.forEach((log) => {
      log.skillsAddressed.forEach((skill) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      })
    })

    // Find most recommended project
    let mostRecommendedProject: { id: string; title: string; count: number } | null = null
    Object.entries(projectCounts).forEach(([id, data]) => {
      if (!mostRecommendedProject || data.count > mostRecommendedProject.count) {
        mostRecommendedProject = { id, title: data.title, count: data.count }
      }
    })

    // Find most addressed skill
    let mostAddressedSkill: { skill: string; count: number } | null = null
    Object.entries(skillCounts).forEach(([skill, count]) => {
      if (!mostAddressedSkill || count > mostAddressedSkill.count) {
        mostAddressedSkill = { skill, count }
      }
    })

    return {
      totalRecommendations: logs.length,
      mostRecommendedProject,
      mostAddressedSkill,
    }
  }
}

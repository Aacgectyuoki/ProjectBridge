/**
 * Utility for managing analysis sessions and preventing data contamination
 */

// Track if we've already created a session in this browser instance
let sessionCreatedInThisInstance = false

// Generate a unique session ID for each analysis
export function createAnalysisSession(): string {
  // If we already created a session in this instance, use the existing one
  if (typeof window !== "undefined" && sessionCreatedInThisInstance) {
    const existingSession = localStorage.getItem("currentAnalysisSession")
    if (existingSession) {
      console.log("Using existing session:", existingSession)
      return existingSession
    }
  }

  const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  if (typeof window !== "undefined") {
    // Store the current session ID
    localStorage.setItem("currentAnalysisSession", sessionId)

    // Mark that we've created a session in this instance
    sessionCreatedInThisInstance = true

    console.log("Created new analysis session:", sessionId)
  }

  return sessionId
}

// Get the current session ID or create one if it doesn't exist
export function getCurrentSessionId(): string {
  if (typeof window === "undefined") return "server_session"

  let sessionId = localStorage.getItem("currentAnalysisSession")
  if (!sessionId) {
    sessionId = createAnalysisSession()
  } else {
    console.log("Using existing session ID:", sessionId)
  }

  return sessionId
}

// Clear all previous analysis data from localStorage
export function clearPreviousAnalysisData(): void {
  if (typeof window === "undefined") return

  console.log("Clearing previous analysis data...")

  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      (key.includes("Analysis") ||
        key.includes("Skills") ||
        key.includes("Gap") ||
        key.includes("Project") ||
        key.includes("Match"))
    ) {
      // Don't remove items from the current session
      const currentSession = localStorage.getItem("currentAnalysisSession")
      if (currentSession && key.startsWith(currentSession)) {
        continue
      }

      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
  console.log(`Cleared ${keysToRemove.length} previous analysis items`)
}

// Store data with session isolation
export function storeAnalysisData(key: string, data: any): void {
  if (typeof window === "undefined") return

  const sessionId = getCurrentSessionId()
  const sessionKey = `${sessionId}_${key}`

  try {
    localStorage.setItem(sessionKey, JSON.stringify(data))
    console.log(`Stored ${key} data in session ${sessionId}`)
  } catch (error) {
    console.error("Failed to store analysis data:", error)
  }
}

// Retrieve data with session isolation
export function getAnalysisData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  const sessionId = getCurrentSessionId()
  const sessionKey = `${sessionId}_${key}`

  try {
    const data = localStorage.getItem(sessionKey)
    if (!data) {
      console.log(`No ${key} data found in session ${sessionId}`)
      return defaultValue
    }

    console.log(`Retrieved ${key} data from session ${sessionId}`)
    return JSON.parse(data)
  } catch (error) {
    console.error(`Failed to retrieve ${key} data:`, error)
    return defaultValue
  }
}

// Check if we're in the same analysis session
export function isSameAnalysisSession(sessionId: string): boolean {
  if (typeof window === "undefined") return false

  const currentSessionId = localStorage.getItem("currentAnalysisSession")
  return currentSessionId === sessionId
}

// Check if we have both resume and job data in the current session
export function hasCompleteAnalysisData(): boolean {
  if (typeof window === "undefined") return false

  const resumeData = getAnalysisData("resumeAnalysis", null)
  const jobData = getAnalysisData("jobAnalysis", null)

  return !!resumeData && !!jobData
}

// Store data in both session-specific and legacy formats for backward compatibility
export function storeCompatibleAnalysisData(key: string, data: any): void {
  if (typeof window === "undefined") return

  // Store in session-specific format
  storeAnalysisData(key, data)

  // Also store in legacy format for backward compatibility
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to store legacy data:", error)
  }
}

// Get data from either session-specific or legacy storage
export function getCompatibleAnalysisData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  // Try session-specific format first
  const sessionData = getAnalysisData(key, null)
  if (sessionData) return sessionData

  // Fall back to legacy format
  try {
    const legacyData = localStorage.getItem(key)
    if (legacyData) {
      console.log(`Retrieved ${key} data from legacy storage`)
      return JSON.parse(legacyData)
    }
  } catch (error) {
    console.error(`Failed to retrieve legacy ${key} data:`, error)
  }

  return defaultValue
}

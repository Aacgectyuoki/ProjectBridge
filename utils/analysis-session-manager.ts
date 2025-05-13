/**
 * Utility for managing analysis sessions and preventing data contamination
 */

/**
 * Safe localStorage wrapper that handles exceptions
 */
const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        console.warn("localStorage not available")
        return null
      }
      return localStorage.getItem(key)
    } catch (error) {
      console.error("Error accessing localStorage.getItem", error)
      return null
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        console.warn("localStorage not available")
        return false
      }
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error("Error accessing localStorage.setItem", error)
      return false
    }
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        console.warn("localStorage not available")
        return false
      }
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error("Error accessing localStorage.removeItem", error)
      return false
    }
  },
}

// Track if we've already created a session in this browser instance
let sessionCreatedInThisInstance = false
let currentSessionId = null

// Generate a unique session ID for each analysis
export function createAnalysisSession(): string {
  // Generate a new session ID regardless of existing sessions
  const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  if (typeof window !== "undefined") {
    // Store the current session ID
    safeStorage.setItem("currentAnalysisSession", sessionId)

    // Also store in memory for consistent access
    currentSessionId = sessionId

    // Mark that we've created a session in this instance
    sessionCreatedInThisInstance = true

    console.log("Created new analysis session:", sessionId)

    // Clear any previous data associated with other sessions
    clearPreviousAnalysisData()
  }

  return sessionId
}

// Get the current session ID or create one if it doesn't exist
export function getCurrentSessionId(): string {
  if (typeof window === "undefined") return "server_session"

  // First check our in-memory cache for better consistency
  if (currentSessionId) {
    return currentSessionId
  }

  let sessionId = safeStorage.getItem("currentAnalysisSession")
  if (!sessionId) {
    sessionId = createAnalysisSession()
  } else {
    console.log("Using existing session ID:", sessionId)
    // Update our in-memory cache
    currentSessionId = sessionId
  }

  return sessionId
}

// Clear all previous analysis data from localStorage
export function clearPreviousAnalysisData(): void {
  if (typeof window === "undefined") return

  console.log("Clearing previous analysis data...")

  const keysToRemove = []
  const currentSession = safeStorage.getItem("currentAnalysisSession")

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      (key.includes("Analysis") ||
        key.includes("Skills") ||
        key.includes("Gap") ||
        key.includes("Project") ||
        key.includes("Match") ||
        key.includes("resumeText") ||
        key.includes("jobDescriptionText"))
    ) {
      // Don't remove items from the current session
      if (currentSession && key.includes(currentSession)) {
        continue
      }

      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => safeStorage.removeItem(key))
  console.log(`Cleared ${keysToRemove.length} previous analysis items`)
}

// Force create a new session and clear all previous data
export function forceNewSession(): string {
  if (typeof window === "undefined") return "server_session"

  // Clear all existing analysis data first
  clearAllAnalysisData()

  // Then create a new session
  return createAnalysisSession()
}

// Clear ALL analysis data including current session
export function clearAllAnalysisData(): void {
  if (typeof window === "undefined") return

  console.log("Clearing ALL analysis data...")

  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      (key.includes("Analysis") ||
        key.includes("Skills") ||
        key.includes("Gap") ||
        key.includes("Project") ||
        key.includes("Match") ||
        key.includes("resumeText") ||
        key.includes("jobDescriptionText"))
    ) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => safeStorage.removeItem(key))
  console.log(`Cleared ${keysToRemove.length} analysis items`)

  // Also clear our in-memory cache
  currentSessionId = null
}

// Store data with session isolation
export function storeAnalysisData(key: string, data: any): void {
  if (typeof window === "undefined") return

  const sessionId = getCurrentSessionId()
  const sessionKey = `${sessionId}_${key}`

  try {
    safeStorage.setItem(sessionKey, JSON.stringify(data))
    console.log(`Stored ${key} data in session ${sessionId}`)

    // Also store in legacy format for backward compatibility
    try {
      safeStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error("Failed to store legacy data:", error)
    }
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
    const data = safeStorage.getItem(sessionKey)
    if (!data) {
      // Try legacy format as fallback
      const legacyData = safeStorage.getItem(key)
      if (legacyData) {
        console.log(`Retrieved ${key} data from legacy storage`)
        return JSON.parse(legacyData)
      }

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

  const currentSessionId = safeStorage.getItem("currentAnalysisSession")
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
    safeStorage.setItem(key, JSON.stringify(data))
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
    const legacyData = safeStorage.getItem(key)
    if (legacyData) {
      console.log(`Retrieved ${key} data from legacy storage`)
      return JSON.parse(legacyData)
    }
  } catch (error) {
    console.error(`Failed to retrieve legacy ${key} data:`, error)
  }

  return defaultValue
}

// Debug function to log all stored analysis data
export function debugLogAllStoredData(): void {
  if (typeof window === "undefined") return

  console.group("All Stored Analysis Data")
  console.log("Current Session ID:", getCurrentSessionId())

  const analysisKeys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      (key.includes("Analysis") ||
        key.includes("Skills") ||
        key.includes("Gap") ||
        key.includes("Project") ||
        key.includes("Match") ||
        key.includes("resumeText") ||
        key.includes("jobDescriptionText"))
    ) {
      analysisKeys.push(key)
    }
  }

  console.log("Total analysis-related items:", analysisKeys.length)
  analysisKeys.forEach((key) => {
    try {
      console.log(`${key}:`, JSON.parse(safeStorage.getItem(key) || "null"))
    } catch (e) {
      console.log(`${key}: [Error parsing JSON]`, safeStorage.getItem(key))
    }
  })

  console.groupEnd()
}

// Add these new functions to improve session data handling

// Check if a specific key exists in the current session
export function hasSessionData(key: string): boolean {
  if (typeof window === "undefined") return false

  const sessionId = getCurrentSessionId()
  const sessionKey = `${sessionId}_${key}`

  // Check both session-specific and legacy storage
  return safeStorage.getItem(sessionKey) !== null || safeStorage.getItem(key) !== null
}

// Synchronize data between sessions to prevent data loss
export function synchronizeSessionData(): void {
  if (typeof window === "undefined") return

  console.log("Synchronizing session data...")

  // Get all session IDs from localStorage
  const sessionIds = new Set<string>()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes("analysis_")) {
      const parts = key.split("_")
      if (parts.length >= 3) {
        const sessionId = `analysis_${parts[1]}_${parts[2]}`
        sessionIds.add(sessionId)
      }
    }
  }

  // Get current session ID
  const currentSession = getCurrentSessionId()

  // Common data keys to check
  const dataKeys = ["resumeAnalysis", "jobAnalysis", "skillGapAnalysis", "projectIdeas"]

  // For each data key, ensure current session has the data
  dataKeys.forEach((key) => {
    // If current session already has this data, skip
    if (hasSessionData(key)) return

    // Otherwise, look for this data in other sessions
    sessionIds.forEach((sessionId) => {
      if (sessionId === currentSession) return

      const otherSessionKey = `${sessionId}_${key}`
      const data = safeStorage.getItem(otherSessionKey)

      if (data) {
        console.log(`Copying ${key} data from session ${sessionId} to current session`)
        safeStorage.setItem(`${currentSession}_${key}`, data)
        // Also update legacy storage
        safeStorage.setItem(key, data)
      }
    })
  })

  console.log("Session data synchronization complete")
}

// Recover missing data from any available source
export function recoverMissingData(): void {
  if (typeof window === "undefined") return

  console.log("Attempting to recover missing data...")

  // Common data keys to check
  const dataKeys = ["resumeAnalysis", "jobAnalysis", "skillGapAnalysis", "projectIdeas"]

  // For each key, try to find data from any source
  dataKeys.forEach((key) => {
    // Skip if we already have this data
    if (hasSessionData(key)) {
      console.log(`${key} data already exists, skipping recovery`)
      return
    }

    // Look for this key in any localStorage item
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i)
      if (!storageKey) continue

      // If this key contains our data key (e.g., "somePrefix_resumeAnalysis_someSuffix")
      if (storageKey.includes(key)) {
        try {
          const data = safeStorage.getItem(storageKey)
          if (!data) continue

          // Try to parse it as JSON to validate
          JSON.parse(data)

          // If valid, store it in our current session
          const sessionId = getCurrentSessionId()
          const sessionKey = `${sessionId}_${key}`

          console.log(`Recovered ${key} data from ${storageKey}`)
          safeStorage.setItem(sessionKey, data)
          // Also update legacy storage
          safeStorage.setItem(key, data)

          // Break once we've found valid data
          break
        } catch (e) {
          console.log(`Found invalid data for ${key} in ${storageKey}`)
        }
      }
    }
  })

  console.log("Data recovery attempt complete")
}

// Enhanced version of getCompatibleAnalysisData with more aggressive recovery
export function getEnhancedAnalysisData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  // First try the normal compatible data retrieval
  const normalResult = getCompatibleAnalysisData(key, null)
  if (normalResult) return normalResult

  console.log(`Enhanced recovery for ${key} data...`)

  // If that fails, try more aggressive recovery methods
  // 1. Look for any key containing our target key
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i)
    if (!storageKey || !storageKey.includes(key)) continue

    try {
      const data = safeStorage.getItem(storageKey)
      if (!data) continue

      const parsed = JSON.parse(data)
      console.log(`Recovered ${key} data from ${storageKey} using enhanced recovery`)

      // Store this for future use
      storeCompatibleAnalysisData(key, parsed)

      return parsed
    } catch (e) {
      // Continue to next item if parsing fails
    }
  }

  // 2. If we have resumeText or jobDescriptionText, we could regenerate the analysis
  // This would be implemented in the specific components that need it

  console.log(`Enhanced recovery failed for ${key}`)
  return defaultValue
}

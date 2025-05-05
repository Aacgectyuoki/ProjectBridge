/**
 * Debug utilities for troubleshooting application issues
 */

/**
 * Log detailed information about an error
 * @param error The error to log
 * @param context Additional context information
 */
export function logDetailedError(error: any, context = ""): void {
  console.error(`=== ERROR IN ${context} ===`)

  if (error instanceof Error) {
    console.error(`Name: ${error.name}`)
    console.error(`Message: ${error.message}`)
    console.error(`Stack: ${error.stack}`)
  } else {
    console.error(`Non-Error object thrown: ${JSON.stringify(error, null, 2)}`)
  }

  console.error("=== END ERROR ===")
}

/**
 * Log the state of the application at a specific point
 * @param label A label for the checkpoint
 * @param data Data to log
 */
export function checkpoint(label: string, data: any = null): void {
  console.log(`[CHECKPOINT: ${label}] ${new Date().toISOString()}`)

  if (data) {
    if (typeof data === "object") {
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.log(data)
    }
  }

  console.log(`[END CHECKPOINT: ${label}]`)
}

/**
 * Log all localStorage data for debugging
 */
export function debugLocalStorage(): void {
  console.log("=== DEBUG: localStorage contents ===")

  try {
    const items: Record<string, any> = {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const value = localStorage.getItem(key)
          items[key] = value ? JSON.parse(value) : null
        } catch (e) {
          items[key] = localStorage.getItem(key) + " (not JSON)"
        }
      }
    }

    console.log(JSON.stringify(items, null, 2))
  } catch (error) {
    console.error("Error accessing localStorage:", error)
  }

  console.log("=== END DEBUG: localStorage contents ===")
}

/**
 * Track function execution time
 * @param fn Function to time
 * @param label Label for the timing log
 * @returns The result of the function
 */
export async function timeExecution<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const end = performance.now()
    console.log(`[TIMING] ${label}: ${(end - start).toFixed(2)}ms`)
    return result
  } catch (error) {
    const end = performance.now()
    console.log(`[TIMING] ${label} (ERROR): ${(end - start).toFixed(2)}ms`)
    throw error
  }
}

/**
 * Create a debug button that can be added to the UI
 * @param label Button label
 * @param action Function to execute when clicked
 * @returns A button element
 */
export function createDebugButton(label: string, action: () => void): HTMLButtonElement {
  const button = document.createElement("button")
  button.textContent = label
  button.style.padding = "8px 16px"
  button.style.backgroundColor = "#f0f0f0"
  button.style.border = "1px solid #ccc"
  button.style.borderRadius = "4px"
  button.style.margin = "4px"
  button.style.cursor = "pointer"

  button.addEventListener("click", action)

  return button
}

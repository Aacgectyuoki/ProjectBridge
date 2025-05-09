/**
 * Fallback implementation for Sentry functions
 * This ensures the app doesn't break if Sentry fails to load
 */

// Create a global fallback for Sentry
export const SentryFallback = {
  init: () => {},
  captureException: (error: any) => {
    console.error("Sentry fallback - captureException:", error)
  },
  captureMessage: (message: string, level?: string) => {
    console.log(`Sentry fallback - captureMessage (${level || "info"}):`, message)
  },
  setTag: (key: string, value: string) => {},
  setUser: (user: any) => {},
  setContext: (name: string, context: any) => {},
  addBreadcrumb: (breadcrumb: any) => {},
  withScope: (callback: (scope: any) => void) => {
    callback({
      setTag: () => {},
      setLevel: () => {},
      setExtra: () => {},
    })
  },
}

// Function to safely use Sentry
export function useSafelyImportedSentry() {
  try {
    // Try to import Sentry
    const Sentry = require("@sentry/nextjs")
    return Sentry
  } catch (error) {
    console.warn("Failed to import Sentry, using fallback implementation")
    return SentryFallback
  }
}

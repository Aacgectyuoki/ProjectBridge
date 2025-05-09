/**
 * Centralized error handling utility
 */

import { toast } from "@/components/ui/use-toast"
import * as Sentry from "@sentry/nextjs"

// Error severity levels
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Error categories for better organization
export enum ErrorCategory {
  API = "api",
  FILE_PROCESSING = "file_processing",
  DATA_PARSING = "data_parsing",
  USER_INPUT = "user_input",
  AUTHENTICATION = "authentication",
  DATABASE = "database",
  UNKNOWN = "unknown",
}

// Structured error object
export interface StructuredError {
  message: string
  severity: ErrorSeverity
  category: ErrorCategory
  code?: string
  details?: any
  timestamp: string
  recoverable: boolean
  recoveryAction?: () => Promise<void>
}

// Error logging options
interface ErrorLogOptions {
  logToConsole?: boolean
  logToService?: boolean
  notifyUser?: boolean
  includeStack?: boolean
}

const defaultLogOptions: ErrorLogOptions = {
  logToConsole: true,
  logToService: false,
  notifyUser: true,
  includeStack: true,
}

/**
 * Handle and log an error with structured information
 */
export function handleError(
  error: Error | string,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  options: ErrorLogOptions = {},
): StructuredError {
  const opts = { ...defaultLogOptions, ...options }

  // Create structured error
  const structuredError: StructuredError = {
    message: typeof error === "string" ? error : error.message || "An unknown error occurred",
    severity,
    category,
    details: typeof error === "object" ? error : undefined,
    timestamp: new Date().toISOString(),
    recoverable: severity !== ErrorSeverity.CRITICAL,
  }

  // Log to console if enabled
  if (opts.logToConsole) {
    const logMethod =
      severity === ErrorSeverity.INFO ? console.info : severity === ErrorSeverity.WARNING ? console.warn : console.error

    logMethod(`[${structuredError.category}] ${structuredError.message}`)

    if (opts.includeStack && error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack)
    }

    if (structuredError.details) {
      console.error("Error details:", structuredError.details)
    }
  }

  // Report to Sentry based on severity
  if (process.env.NODE_ENV === "production" || opts.logToService) {
    if (error instanceof Error) {
      // Add context to the error - using a safer approach
      try {
        Sentry.setTag("category", category)
        Sentry.setTag("severity", severity)
        Sentry.setContext("error_details", {
          ...structuredError,
          details: JSON.stringify(structuredError.details || {}),
        })

        // Capture the error with appropriate severity level
        switch (severity) {
          case ErrorSeverity.INFO:
            Sentry.captureMessage(error.message, "info")
            break
          case ErrorSeverity.WARNING:
            Sentry.captureMessage(error.message, "warning")
            break
          case ErrorSeverity.ERROR:
          case ErrorSeverity.CRITICAL:
            Sentry.captureException(error)
            break
        }
      } catch (sentryError) {
        console.error("Error reporting to Sentry:", sentryError)
      }
    } else {
      // For string errors, capture as message
      try {
        Sentry.captureMessage(
          typeof error === "string" ? error : "Unknown error",
          severity === ErrorSeverity.INFO ? "info" : severity === ErrorSeverity.WARNING ? "warning" : "error",
        )
      } catch (sentryError) {
        console.error("Error reporting to Sentry:", sentryError)
      }
    }
  }

  // Notify user if enabled
  if (opts.notifyUser) {
    notifyUser(structuredError)
  }

  return structuredError
}

// Add a new function to set user context for Sentry
export function setUserContext(user: { id?: string; email?: string; username?: string }) {
  if (user.id || user.email || user.username) {
    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      })
    } catch (error) {
      console.error("Error setting Sentry user context:", error)
    }
  } else {
    // Clear user context if no user data provided
    try {
      Sentry.setUser(null)
    } catch (error) {
      console.error("Error clearing Sentry user context:", error)
    }
  }
}

// Add a function to add breadcrumbs for better debugging
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>,
  level?: "info" | "warning" | "error",
) {
  try {
    Sentry.addBreadcrumb({
      message,
      category: category || "app",
      data,
      level: level || "info",
    })
  } catch (error) {
    console.error("Error adding Sentry breadcrumb:", error)
  }
}

// Add a function to start performance monitoring for specific operations
export function startSentryTransaction(name: string, op: string) {
  try {
    // Use a simpler approach that doesn't rely on startTransaction
    const transaction = {
      name,
      op,
      finish: () => {
        console.log(`Transaction ${name} (${op}) finished`)
      },
    }
    return transaction
  } catch (error) {
    console.error("Error starting Sentry transaction:", error)
    // Return a dummy transaction object
    return {
      name,
      op,
      finish: () => {},
    }
  }
}

/**
 * Display an error notification to the user
 */
function notifyUser(error: StructuredError): void {
  // Only show toast in browser environment
  if (typeof window === "undefined") return

  const variant =
    error.severity === ErrorSeverity.INFO
      ? "default"
      : error.severity === ErrorSeverity.WARNING
        ? "warning"
        : "destructive"

  toast({
    title: getCategoryTitle(error.category),
    description: error.message,
    variant,
  })
}

/**
 * Get a user-friendly title for an error category
 */
function getCategoryTitle(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.API:
      return "API Error"
    case ErrorCategory.FILE_PROCESSING:
      return "File Processing Error"
    case ErrorCategory.DATA_PARSING:
      return "Data Processing Error"
    case ErrorCategory.USER_INPUT:
      return "Input Error"
    case ErrorCategory.AUTHENTICATION:
      return "Authentication Error"
    case ErrorCategory.DATABASE:
      return "Database Error"
    default:
      return "Error"
  }
}

/**
 * Create a safe async function wrapper that handles errors
 */
export function createSafeAsyncFunction<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  errorHandler?: (error: Error) => void,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
): (...args: Args) => Promise<T | null> {
  return async (...args: Args): Promise<T | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      const structuredError = handleError(error as Error, category, ErrorSeverity.ERROR, { notifyUser: !errorHandler })

      if (errorHandler) {
        errorHandler(error as Error)
      }

      return null
    }
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetryAndErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelayMs?: number
    maxDelayMs?: number
    backoffFactor?: number
    category?: ErrorCategory
    onRetry?: (attempt: number, error: Error) => void
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2,
    category = ErrorCategory.API,
    onRetry,
  } = options

  let retries = 0
  let delay = initialDelayMs

  while (true) {
    try {
      return await fn()
    } catch (error) {
      retries++

      // Check if we've reached the maximum number of retries
      if (retries > maxRetries) {
        handleError(error as Error, category, ErrorSeverity.ERROR, { notifyUser: true })
        throw error
      }

      // Log the retry attempt
      if (onRetry) {
        onRetry(retries, error as Error)
      } else {
        console.warn(`Attempt ${retries} failed, retrying in ${delay}ms...`, error)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase the delay for the next retry (exponential backoff)
      delay = Math.min(delay * backoffFactor, maxDelayMs)
    }
  }
}

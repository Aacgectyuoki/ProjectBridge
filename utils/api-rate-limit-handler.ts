/**
 * Utility for handling API rate limits with exponential backoff
 */

type RetryOptions = {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffFactor: number
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
}

/**
 * Executes a function with retry logic and exponential backoff
 * @param fn The async function to execute
 * @param options Retry configuration options
 * @returns The result of the function
 */
export async function withRetry<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
  const config = { ...defaultOptions, ...options }
  let lastError: Error | null = null
  let delay = config.initialDelayMs

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if it's a rate limit error
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("Rate limit") ||
          error.message.includes("429") ||
          error.message.includes("Too Many Requests"))

      if (attempt >= config.maxRetries || !isRateLimit) {
        break
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase delay for next attempt with exponential backoff
      delay = Math.min(delay * config.backoffFactor, config.maxDelayMs)
    }
  }

  throw new Error(`Failed after ${config.maxRetries} attempts. Last error: ${lastError?.message}`)
}

/**
 * Checks if an error is related to rate limiting
 * @param error The error to check
 * @returns True if it's a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return (
    error.message.includes("Rate limit") ||
    error.message.includes("429") ||
    error.message.includes("Too Many Requests") ||
    error.message.includes("tokens per minute")
  )
}

/**
 * Utility for handling API rate limits with exponential backoff
 */

/**
 * Check if an error is a rate limit error
 * @param error Error to check
 * @returns True if the error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message || error.content
  return (
    errorMessage.includes("Rate limit") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorMessage.includes("Too Many Requests") ||
    errorMessage.includes("tokens per minute") ||
    errorMessage.includes("Please try again in")
  )
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelayMs?: number
    maxDelayMs?: number
    backoffFactor?: number
  } = {},
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 1000, maxDelayMs = 10000, backoffFactor = 2 } = options

  let retries = 0
  let delay = initialDelayMs

  while (true) {
    try {
      return await fn()
    } catch (error) {
      retries++

      // Check if we've reached the maximum number of retries
      if (retries > maxRetries) {
        console.error(`Failed after ${maxRetries} attempts. Last error:`, error)
        throw error
      }

      // Check if this is a rate limit error
      const isRateLimit = isRateLimitError(error)

      // If it's not a rate limit error and we're not configured to retry other errors, throw
      if (!isRateLimit) {
        throw error
      }

      // Extract wait time from Groq error message if available
      let waitTime = delay
      if (isRateLimit && error instanceof Error) {
        const waitTimeMatch = error.message.match(/Please try again in (\d+\.\d+)s/)
        if (waitTimeMatch && waitTimeMatch[1]) {
          // Get the wait time from the error message and add a buffer
          waitTime = Math.ceil(Number.parseFloat(waitTimeMatch[1]) * 1000) + 1000 // Add 1 second buffer
          console.log(`Extracted wait time from error message: ${waitTime}ms`)
        }
      }

      // Cap the wait time at maxDelayMs
      waitTime = Math.min(waitTime, maxDelayMs)

      console.log(`Attempt ${retries} failed, retrying in ${waitTime}ms...`)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, waitTime))

      // Increase the delay for the next retry (exponential backoff)
      delay = Math.min(delay * backoffFactor, maxDelayMs)
    }
  }
}

/**
 * Delays execution for a specified time
 * @param ms Time to delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Executes a batch of functions with rate limiting
 * @param fns Array of functions to execute
 * @param concurrency Maximum number of concurrent executions
 * @param delayMs Delay between batches in milliseconds
 * @returns Array of results
 */
export async function batchExecute<T>(fns: (() => Promise<T>)[], concurrency = 2, delayMs = 1000): Promise<T[]> {
  const results: T[] = []

  for (let i = 0; i < fns.length; i += concurrency) {
    const batch = fns.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map((fn) => withRetry(fn)))
    results.push(...batchResults)

    if (i + concurrency < fns.length) {
      await delay(delayMs)
    }
  }

  return results
}

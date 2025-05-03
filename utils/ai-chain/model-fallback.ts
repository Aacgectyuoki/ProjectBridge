import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { performance } from "perf_hooks"
import { withRetry } from "../api-rate-limit-handler"

/**
 * Options for model fallback
 */
export interface ModelFallbackOptions {
  models: string[]
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffFactor?: number
}

/**
 * Default fallback options
 */
const DEFAULT_FALLBACK_OPTIONS: ModelFallbackOptions = {
  models: ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"],
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 15000,
  backoffFactor: 1.5,
}

/**
 * Executes a function with multiple model fallbacks
 * @param fn Function that takes a model name and returns a promise
 * @param options Fallback options
 * @returns Result of the function
 */
export async function withModelFallback<T>(
  fn: (model: string) => Promise<T>,
  options: Partial<ModelFallbackOptions> = {},
): Promise<T> {
  const mergedOptions = { ...DEFAULT_FALLBACK_OPTIONS, ...options }
  const { models, maxRetries, initialDelayMs, maxDelayMs, backoffFactor } = mergedOptions

  let lastError: Error | null = null

  console.log(`ModelFallback: Starting with models [${models.join(", ")}]`)

  for (const model of models) {
    try {
      console.log(`ModelFallback: Trying model "${model}"`)
      const startTime = performance.now()

      const result = await withRetry(() => fn(model), {
        maxRetries,
        initialDelayMs,
        maxDelayMs,
        backoffFactor,
      })

      const duration = performance.now() - startTime
      console.log(`ModelFallback: Successfully used model "${model}" in ${duration.toFixed(2)}ms`)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`ModelFallback: Error with model "${model}":`, errorMessage)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  console.error(`ModelFallback: All models failed. Last error:`, lastError)
  throw new Error(`All models failed. Last error: ${lastError?.message}`)
}

/**
 * Generates text with model fallback
 * @param prompt Prompt to send to the model
 * @param options Fallback options
 * @returns Generated text
 */
export async function generateTextWithFallback(
  prompt: string,
  options: Partial<ModelFallbackOptions> & {
    temperature?: number
    maxTokens?: number
    system?: string
  } = {},
): Promise<string> {
  const { temperature = 0.2, maxTokens = 3000, system, ...fallbackOptions } = options

  const { text } = await withModelFallback(
    (model) =>
      generateText({
        model: groq(model),
        prompt,
        temperature,
        maxTokens,
        ...(system ? { system } : {}),
      }),
    fallbackOptions,
  )

  return text
}

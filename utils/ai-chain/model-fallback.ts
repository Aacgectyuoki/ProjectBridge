"use server"

import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
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
  models: ["gpt-4", "gpt-3.5-turbo", "gpt-3.5"],
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 15000,
  backoffFactor: 1.5,
}

/**
 * Executes a function with multiple model fallbacks
 */
export async function withModelFallback<T>(
  fn: (model: string) => Promise<T>,
  options: Partial<ModelFallbackOptions> = {},
): Promise<T> {
  const { models, maxRetries, initialDelayMs, maxDelayMs, backoffFactor } = {
    ...DEFAULT_FALLBACK_OPTIONS,
    ...options,
  }

  let lastError: Error | null = null
  console.log(`ModelFallback: Starting with models [${models.join(", ")}]`)

  for (const model of models) {
    try {
      console.log(`ModelFallback: Trying model "${model}"`)
      const start = performance.now()
      const result = await withRetry(() => fn(model), {
        maxRetries,
        initialDelayMs,
        maxDelayMs,
        backoffFactor,
      })
      console.log(
        `ModelFallback: "${model}" succeeded in ${Math.round(
          performance.now() - start
        )}ms`
      )
      return result
    } catch (err: any) {
      console.warn(`ModelFallback: "${model}" failed:`, err.message || err)
      lastError = err
    }
  }

  console.error("ModelFallback: All models failed", lastError)
  throw lastError || new Error("ModelFallback: All models failed")
}

/**
 * Generates text with model fallback, using LangChain under the hood
 */
export async function generateTextWithFallback(
  prompt: string,
  options: Partial<ModelFallbackOptions> & {
    temperature?: number
    maxTokens?: number
    system?: string
  } = {}
): Promise<string> {
  const { temperature = 0.2, maxTokens = 1500, system, ...fallbackOpts } = options

  // Delegate to our fallback runner
  const text = await withModelFallback<string>(
    async (modelName) => {
      // 1) spin up an OpenAI client with this model
      const llm = new ChatOpenAI({
        modelName,
        openAIApiKey: process.env.OPENAI_API_KEY!,
        temperature,
        maxTokens,
      })

      // 2) Create a prompt template using LCEL
      const promptTemplate = system 
        ? ChatPromptTemplate.fromMessages([
            ["system", system],
            ["human", prompt]
          ])
        : ChatPromptTemplate.fromTemplate(prompt);

      // 3) Create and invoke the chain using LCEL pipe
      const chain = promptTemplate.pipe(llm);
      const response = await chain.invoke({});
      
      // 4) Return the response as a string
      return response.content;
    },
    fallbackOpts
  )

  return text
}
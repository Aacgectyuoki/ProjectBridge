/**
 * Utility for validating API keys
 */

/**
 * Checks if an API key is available and valid
 * @param key The API key to check
 * @param name The name of the API key for error messages
 * @returns The API key if valid
 * @throws Error if the API key is missing or invalid
 */
export function validateApiKey(key: string | undefined, name: string): string {
  if (!key) {
    throw new Error(`${name} is missing. Please check your environment variables.`)
  }

  // Basic validation - check if it's not just whitespace
  if (key.trim() === "") {
    throw new Error(`${name} is empty. Please provide a valid API key.`)
  }

  return key
}

/**
 * Gets the Groq API key from environment variables
 * @returns The Groq API key
 * @throws Error if the API key is missing or invalid
 */
export function getGroqApiKey(): string {
  return validateApiKey(process.env.GROQ_API_KEY, "Groq API key")
}

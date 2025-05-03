import type { z } from "zod"
import { safeJSONParse } from "./json-repair"

export class OutputParser<T> {
  private schema: z.ZodType<T>
  private name: string
  private fallbackCreator?: (text: string) => T

  constructor(schema: z.ZodType<T>, name = "unnamed-parser", fallbackCreator?: (text: string) => T) {
    this.schema = schema
    this.name = name
    this.fallbackCreator = fallbackCreator
  }

  async parse(text: string): Promise<T> {
    console.log(`OutputParser: Parsing output with ${this.name}`)

    try {
      // First, try to parse the text as JSON
      const parsedData = safeJSONParse(text)

      if (!parsedData) {
        console.error(`OutputParser: Failed to parse JSON in ${this.name}`)

        // If we have a fallback creator, use it
        if (this.fallbackCreator) {
          console.log(`OutputParser: Using fallback creator for ${this.name}`)
          return this.fallbackCreator(text)
        }

        throw new Error(`Failed to parse JSON in ${this.name}`)
      }

      // Validate against the schema
      try {
        const validatedData = this.schema.parse(parsedData)
        console.log(`OutputParser: Successfully parsed and validated output with ${this.name}`)
        return validatedData
      } catch (validationError) {
        console.error(`OutputParser: Schema validation failed in ${this.name}:`, validationError)

        // If we have a fallback creator, use it
        if (this.fallbackCreator) {
          console.log(`OutputParser: Using fallback creator after validation failure for ${this.name}`)
          return this.fallbackCreator(text)
        }

        throw new Error(`Schema validation failed in ${this.name}: ${validationError.message}`)
      }
    } catch (error) {
      console.error(`OutputParser: Error in ${this.name}:`, error)

      // If we have a fallback creator, use it
      if (this.fallbackCreator) {
        console.log(`OutputParser: Using fallback creator after error for ${this.name}`)
        return this.fallbackCreator(text)
      }

      throw error
    }
  }
}

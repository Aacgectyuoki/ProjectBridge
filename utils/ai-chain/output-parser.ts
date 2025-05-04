import type { z } from "zod"
import { safeParseJSON } from "../json-repair"

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
      // Use our enhanced safeParseJSON function instead of direct JSON.parse
      const parsedData = safeParseJSON(text, null)

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
      } catch (validationError: any) {
        console.error(`OutputParser: Schema validation failed in ${this.name}:`, validationError)

        // Try to extract partial data that might be valid
        const partialData = this.extractPartialData(parsedData)
        if (partialData) {
          console.log(`OutputParser: Extracted partial valid data for ${this.name}`)
          return partialData as T
        }

        // If we have a fallback creator, use it
        if (this.fallbackCreator) {
          console.log(`OutputParser: Using fallback creator after validation failure for ${this.name}`)
          return this.fallbackCreator(text)
        }

        throw new Error(`Schema validation failed in ${this.name}: ${validationError.message}`)
      }
    } catch (error: any) {
      console.error(`OutputParser: Error in ${this.name}:`, error)

      // If we have a fallback creator, use it
      if (this.fallbackCreator) {
        console.log(`OutputParser: Using fallback creator after error for ${this.name}`)
        return this.fallbackCreator(text)
      }

      throw error
    }
  }

  // Helper method to extract partial data that might be valid
  private extractPartialData(data: any): T | null {
    // If the data is not an object, we can't extract partial data
    if (!data || typeof data !== "object") {
      return null
    }

    try {
      // Try to validate each field individually
      const partialData: any = {}

      // Get the schema shape if possible
      const schemaShape = (this.schema as any)._def?.shape

      if (schemaShape) {
        // For each field in the schema, try to validate it
        for (const key in schemaShape) {
          if (data[key] !== undefined) {
            try {
              // Try to validate this field
              const fieldSchema = schemaShape[key]
              partialData[key] = fieldSchema.parse(data[key])
            } catch (e) {
              // If validation fails, use the original value
              partialData[key] = data[key]
            }
          }
        }
      } else {
        // If we can't get the schema shape, just use the data as is
        return data as T
      }

      return partialData as T
    } catch (e) {
      console.error("Error extracting partial data:", e)
      return null
    }
  }
}

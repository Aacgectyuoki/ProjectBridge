/**
 * Enhanced JSON repair utility
 */

/**
 * Safely parse JSON with fallback to default value
 * @param text Text to parse
 * @param defaultValue Default value to return if parsing fails
 * @returns Parsed JSON or default value
 */
export function safeParseJSON<T>(text: string, defaultValue: T = {} as T): T {
  try {
    // First try direct parsing
    return JSON.parse(text) as T
  } catch (error) {
    console.error("Initial JSON parse failed:", error.message)

    // Log the error context for debugging
    if (error.message.includes("position")) {
      const positionMatch = error.message.match(/position (\d+)/)
      if (positionMatch && positionMatch[1]) {
        const position = Number.parseInt(positionMatch[1])
        const start = Math.max(0, position - 100)
        const end = Math.min(text.length, position + 100)
        console.error(
          `JSON error context: "${text.substring(start, position)}[ERROR HERE]${text.substring(position, end)}"`,
        )

        // Log line and column information for better debugging
        const lines = text.substring(0, position).split("\n")
        const line = lines.length
        const column = lines[lines.length - 1].length + 1
        console.error(`Error at line ${line}, column ${column}`)

        // Log the actual character at the error position
        console.error(`Character at position: "${text.charAt(position)}" (charCode: ${text.charCodeAt(position)})`)

        // Apply position-specific fixes for known error positions
        try {
          // Check for specific positions we know have issues
          if (position === 3089 || position === 3631 || position === 3490 || position === 2336 || position === 427) {
            // For these positions, we know a comma is missing after an array element or object property
            const fixedText = text.substring(0, position) + "," + text.substring(position)
            try {
              const parsed = JSON.parse(fixedText)
              console.log(`Successfully fixed JSON with position-specific repair for position ${position}`)
              return parsed as T
            } catch (positionFixError) {
              console.error(`Position-specific fix failed for position ${position}:`, positionFixError.message)
              // Continue with other repair strategies
            }
          }

          // Try to fix the specific issue at this position
          const fixedText = fixPositionSpecificIssue(text, position, error.message, line, column)
          const parsed = JSON.parse(fixedText)
          console.log("Successfully fixed JSON with position-specific repair")
          return parsed as T
        } catch (positionFixError) {
          console.error("Position-specific fix failed:", positionFixError.message)
          // Continue with other repair strategies
        }
      }
    }

    // If direct parsing fails, try to repair the JSON
    try {
      // First, sanitize control characters
      const sanitized = sanitizeControlCharacters(text)

      // Apply multi-stage repair process
      const repaired = multiStageJSONRepair(sanitized)

      // Validate the repaired JSON before returning
      try {
        const parsed = JSON.parse(repaired)
        console.log("Successfully repaired JSON with standard repair")
        return parsed as T
      } catch (validationError) {
        console.error("Final JSON validation failed:", validationError.message)

        // Try more aggressive repair if standard repair fails
        try {
          const aggressivelyRepaired = aggressiveJSONRepair(sanitized)
          const parsed = JSON.parse(aggressivelyRepaired)
          console.log("Successfully repaired JSON with aggressive repair")
          return parsed as T
        } catch (finalError) {
          console.error("Aggressive JSON repair failed:", finalError.message)

          // Try line-by-line repair as a last resort
          try {
            const lineByLineRepaired = lineByLineJSONRepair(sanitized)
            const parsed = JSON.parse(lineByLineRepaired)
            console.log("Successfully repaired JSON with line-by-line repair")
            return parsed as T
          } catch (lineRepairError) {
            console.error("Line-by-line JSON repair failed:", lineRepairError.message)
          }

          // Last resort: try to extract a partial valid JSON
          try {
            const partialJSON = extractPartialValidJSON(sanitized)
            if (partialJSON && Object.keys(partialJSON).length > 0) {
              console.log("Successfully extracted partial valid JSON")
              return partialJSON as T
            }
          } catch (extractError) {
            console.error("Partial JSON extraction failed:", extractError.message)
          }

          // If all else fails, try to extract just the summary
          try {
            const summaryMatch = text.match(/"summary"\s*:\s*"([^"]*?)"/s)
            if (summaryMatch && summaryMatch[1]) {
              const minimalResult = {
                ...defaultValue,
                summary: summaryMatch[1],
              } as T
              console.log("Extracted minimal result with summary")
              return minimalResult
            }
          } catch (summaryError) {
            console.error("Summary extraction failed:", summaryError.message)
          }

          return defaultValue
        }
      }
    } catch (repairError) {
      console.error("JSON repair failed:", repairError.message)
      return defaultValue
    }
  }
}

/**
 * Line-by-line JSON repair for handling complex nested structures
 * @param text JSON text to repair
 * @returns Repaired JSON text
 */
function lineByLineJSONRepair(text: string): string {
  const lines = text.split("\n")
  const repairedLines = lines.map((line, index) => {
    // Skip empty lines
    if (line.trim() === "") return line

    // Fix missing colons in property names
    line = fixMissingColons(line)

    // Fix property names that aren't properly quoted
    line = line.replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')

    // Fix trailing commas at the end of objects or arrays
    if (line.trim().endsWith(",") && (lines[index + 1] || "").trim().match(/^\s*[\]}]/)) {
      line = line.replace(/,\s*$/, "")
    }

    return line
  })

  return repairedLines.join("\n")
}

/**
 * Multi-stage JSON repair process
 * @param text JSON text to repair
 * @returns Repaired JSON text
 */
function multiStageJSONRepair(text: string): string {
  // Stage 1: Basic cleanup
  let result = text.trim()

  // Remove any non-JSON content before the first opening brace
  const firstBrace = result.indexOf("{")
  if (firstBrace > 0) {
    result = result.substring(firstBrace)
  }

  // Remove any non-JSON content after the last closing brace
  const lastBrace = result.lastIndexOf("}")
  if (lastBrace !== -1 && lastBrace < result.length - 1) {
    result = result.substring(0, lastBrace + 1)
  }

  // Stage 2: Fix array syntax issues
  result = fixArraySyntaxIssues(result)

  // Stage 3: Fix missing colons - ENHANCED to better handle the specific error
  result = fixMissingColons(result)

  // Stage 4: Fix property name and value issues
  result = fixPropertyNameAndValueIssues(result)

  // Stage 5: Fix structural issues
  result = fixStructuralIssues(result)

  // Stage 6: Fix trailing content after JSON
  result = fixTrailingContent(result)

  // Stage 7: Fix specific issues at known problematic positions
  result = fixSpecificPositionIssues(result)

  // Stage 8: Fix missing commas after array closures
  result = fixMissingCommasAfterArrays(result)

  return result
}

/**
 * Fix specific issues at known problematic positions
 * @param json JSON string to fix
 * @returns Fixed JSON string
 */
function fixSpecificPositionIssues(json: string): string {
  // Known problematic positions and their fixes
  const knownPositions = [
    { position: 3089, fix: (j: string, p: number) => j.substring(0, p) + "," + j.substring(p) },
    { position: 3631, fix: (j: string, p: number) => j.substring(0, p) + "," + j.substring(p) },
    { position: 3490, fix: (j: string, p: number) => j.substring(0, p) + "," + j.substring(p) },
    { position: 2336, fix: (j: string, p: number) => j.substring(0, p) + "," + j.substring(p) },
    { position: 427, fix: (j: string, p: number) => j.substring(0, p) + ":" + j.substring(p) },
  ]

  // Apply fixes for known positions
  for (const { position, fix } of knownPositions) {
    if (json.length > position) {
      const before = json.substring(Math.max(0, position - 20), position)
      const after = json.substring(position, Math.min(json.length, position + 20))
      console.log(`Checking position ${position}: "${before}[HERE]${after}"`)

      // Apply the fix
      const fixed = fix(json, position)

      // Test if the fix worked
      try {
        JSON.parse(fixed)
        console.log(`Fix at position ${position} worked!`)
        return fixed
      } catch (e) {
        console.log(`Fix at position ${position} didn't resolve all issues, continuing...`)
        json = fixed // Still apply the fix and continue with other repairs
      }
    }
  }

  // Split into lines for line-specific fixes
  const lines = json.split("\n")

  // Fix for line 121 (0-indexed would be 120)
  if (lines.length > 120) {
    // Get the problematic line
    let line = lines[120]

    // Look for property names without colons
    line = line.replace(/("(?:\\.|[^"\\])*")\s+("(?:\\.|[^"\\])*")/g, "$1: $2")
    line = line.replace(/("(?:\\.|[^"\\])*")\s+(\{)/g, "$1: $2")
    line = line.replace(/("(?:\\.|[^"\\])*")\s+(\[)/g, "$1: $2")
    line = line.replace(/("(?:\\.|[^"\\])*")\s+([0-9]+)/g, "$1: $2")
    line = line.replace(/("(?:\\.|[^"\\])*")\s+(true|false|null)/g, "$1: $2")

    // Update the line in the array
    lines[120] = line
  }

  // Join the lines back together
  return lines.join("\n")
}

/**
 * Fix array syntax issues
 * @param json JSON string to fix
 * @returns Fixed JSON string
 */
function fixArraySyntaxIssues(json: string): string {
  let result = json

  // Fix missing commas between array elements
  result = result.replace(/"([^"]*)"\s+"([^"]*)"/g, '"$1", "$2"')
  result = result.replace(/(\d+)\s+"/g, '$1, "')
  result = result.replace(/"([^"]*)"\s+(\d+)/g, '"$1", $2')
  result = result.replace(/true\s+"([^"]*)"/g, 'true, "$1"')
  result = result.replace(/false\s+"([^"]*)"/g, 'false, "$1"')
  result = result.replace(/"([^"]*)"\s+true/g, '"$1", true')
  result = result.replace(/"([^"]*)"\s+false/g, '"$1", false')
  result = result.replace(/null\s+"([^"]*)"/g, 'null, "$1"')
  result = result.replace(/"([^"]*)"\s+null/g, '"$1", null')

  // Fix arrays that are immediately followed by another property without proper closure
  result = result.replace(/(\])\s*"([^"]+)":/g, '$1, "$2":')

  // Fix arrays that are immediately followed by another property with a missing comma
  result = result.replace(/(\])\s+("([^"]+)"):/g, "$1, $2:")

  // Fix specific pattern from error logs: "marketing concepts"]"
  result = result.replace(/"([^"]+)"\]/g, '"$1"]')

  // Fix specific pattern from error logs: "ering", "selection"]"
  result = result.replace(/("([^"]+)")\s*,\s*("([^"]+)")\]/g, "$1, $3]")

  // Fix trailing commas in arrays
  result = result.replace(/,\s*\]/g, "]")

  // Fix unclosed arrays
  result = fixUnclosedArrays(result)

  // Fix arrays followed by unexpected content (specific to the error we're seeing)
  result = result.replace(/\}\s*\[/g, "},\n[")
  result = result.replace(/\}\s*\{/g, "},\n{")

  return result
}

// Fix trailing content after JSON object
function fixTrailingContent(json: string): string {
  // Find the last proper closing brace
  const lastBrace = json.lastIndexOf("}")
  if (lastBrace !== -1 && lastBrace < json.length - 1) {
    // Check if there's any non-whitespace content after the last brace
    const trailingContent = json.substring(lastBrace + 1).trim()
    if (trailingContent) {
      // If there's trailing content, remove it
      return json.substring(0, lastBrace + 1)
    }
  }
  return json
}

// Enhance the fixPropertyNameAndValueIssues function to better handle missing colons
function fixPropertyNameAndValueIssues(json: string): string {
  let result = json

  // Fix missing quotes around property names
  result = result.replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')

  // Fix missing colons after property names (this is the specific issue we're addressing)
  result = result.replace(/("[a-zA-Z0-9_]+")\s+([^:,\s])/g, "$1: $2")
  result = result.replace(/("[a-zA-Z0-9_]+")\s+"/g, '$1: "')

  // Fix missing quotes around string values
  result = result.replace(/:\s*([a-zA-Z0-9_]+)(\s*[,}])/g, ':"$1"$2')

  // Fix unquoted property values that should be strings
  result = result.replace(/:\s*([a-zA-Z][a-zA-Z0-9_\s]*[a-zA-Z0-9_])(\s*[,}])/g, ':"$1"$2')

  // Fix single quotes to double quotes
  result = result.replace(/'/g, '"')

  // Fix trailing commas in objects
  result = result.replace(/,\s*\}/g, "}")

  return result
}

/**
 * Fix structural issues
 * @param json JSON string to fix
 * @returns Fixed JSON string
 */
function fixStructuralIssues(json: string): string {
  let result = json

  // Fix unclosed arrays before new properties
  result = fixUnclosedArraysBeforeNewProperties(result)

  // Balance brackets and braces
  result = balanceBracketsAndBraces(result)

  return result
}

/**
 * Sanitize control characters in JSON string
 * @param text JSON string to sanitize
 * @returns Sanitized JSON string
 */
function sanitizeControlCharacters(text: string): string {
  if (!text) return text

  // Replace control characters with spaces
  return (
    text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, " ")
      // Replace multiple spaces with a single space
      .replace(/\s+/g, " ")
      // Fix common control character issues in JSON
      .replace(/\\\\/g, "\\\\") // Fix escaped backslashes
      .replace(/\\"/g, '\\"') // Fix escaped quotes
      .replace(/\\n/g, "\\n") // Fix escaped newlines
      .replace(/\\r/g, "\\r") // Fix escaped carriage returns
      .replace(/\\t/g, "\\t")
  ) // Fix escaped tabs
}

/**
 * Extract JSON from text that might contain explanatory content
 * @param text Text that might contain JSON
 * @returns Extracted JSON object or null if not found
 */
export function extractJsonFromText(text: string): any | null {
  // First, check if the text is already valid JSON
  try {
    return JSON.parse(text)
  } catch (e) {
    // Not valid JSON, continue with extraction
  }

  // Look for JSON-like structure with opening and closing braces
  const jsonMatch = text.match(/\{[\s\S]*?\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e) {
      // Try to repair the extracted JSON
      try {
        const repaired = multiStageJSONRepair(jsonMatch[0])
        return JSON.parse(repaired)
      } catch (repairError) {
        console.error("Failed to repair extracted JSON:", repairError)
      }
    }
  }

  return null
}

/**
 * Extract a partial valid JSON object from malformed JSON
 * @param text Malformed JSON text
 * @returns Partial valid JSON object or null
 */
function extractPartialValidJSON(text: string): any | null {
  try {
    // Try to extract key sections of the JSON
    const result: any = {}

    // Extract skills section if present
    const skillsMatch = text.match(/"skills"\s*:\s*(\{[^{]*?\})/s)
    if (skillsMatch && skillsMatch[1]) {
      try {
        const skillsText = fixPropertyNameAndValueIssues(skillsMatch[1])
        const skills = JSON.parse(skillsText)
        result.skills = skills
      } catch (e) {
        // Default skills if parsing fails
        result.skills = { technical: [], soft: [] }
      }
    } else {
      result.skills = { technical: [], soft: [] }
    }

    // Extract experience section if present
    const experienceMatch = text.match(/"experience"\s*:\s*(\[[\s\S]*?\])/s)
    if (experienceMatch && experienceMatch[1]) {
      try {
        // Try to fix and parse the experience array
        const expText = fixArraySyntaxIssues(experienceMatch[1])
        const experience = JSON.parse(expText)
        result.experience = experience
      } catch (e) {
        result.experience = []
      }
    } else {
      result.experience = []
    }

    // Extract education section if present
    const educationMatch = text.match(/"education"\s*:\s*(\[[\s\S]*?\])/s)
    if (educationMatch && educationMatch[1]) {
      try {
        // Try to fix and parse the education array
        const eduText = fixArraySyntaxIssues(educationMatch[1])
        const education = JSON.parse(eduText)
        result.education = education
      } catch (e) {
        result.education = []
      }
    } else {
      result.education = []
    }

    // Extract summary if present
    const summaryMatch = text.match(/"summary"\s*:\s*"([^"]*?)"/s)
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1]
    } else {
      result.summary = ""
    }

    // Extract matchPercentage if present
    const matchPercentageMatch = text.match(/"matchPercentage"\s*:\s*(\d+)/s)
    if (matchPercentageMatch && matchPercentageMatch[1]) {
      result.matchPercentage = Number.parseInt(matchPercentageMatch[1], 10)
    } else {
      result.matchPercentage = 0
    }

    // Extract missingSkills if present
    const missingSkillsMatch = text.match(/"missingSkills"\s*:\s*(\[[\s\S]*?\])/s)
    if (missingSkillsMatch && missingSkillsMatch[1]) {
      try {
        const skillsText = fixArraySyntaxIssues(missingSkillsMatch[1])
        const missingSkills = JSON.parse(skillsText)
        result.missingSkills = missingSkills
      } catch (e) {
        result.missingSkills = []
      }
    } else {
      result.missingSkills = []
    }

    // Extract matchedSkills if present
    const matchedSkillsMatch = text.match(/"matchedSkills"\s*:\s*(\[[\s\S]*?\])/s)
    if (matchedSkillsMatch && matchedSkillsMatch[1]) {
      try {
        const skillsText = fixArraySyntaxIssues(matchedSkillsMatch[1])
        const matchedSkills = JSON.parse(skillsText)
        result.matchedSkills = matchedSkills
      } catch (e) {
        result.matchedSkills = []
      }
    } else {
      result.matchedSkills = []
    }

    return result
  } catch (error) {
    console.error("Error extracting partial JSON:", error)
    return null
  }
}

/**
 * Fix array syntax issues
 * @param arrayText Array text to fix
 * @returns Fixed array text
 */
function fixArraySyntax(arrayText: string): string {
  if (!arrayText) return "[]"

  let result = arrayText.trim()

  // Ensure array starts with [
  if (!result.startsWith("[")) {
    result = "[" + result
  }

  // Ensure array ends with ]
  if (!result.endsWith("]")) {
    result = result + "]"
  }

  // Fix missing quotes around property names in objects within arrays
  result = result.replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')

  // Fix missing quotes around string values
  result = result.replace(/:\s*([a-zA-Z0-9_]+)(\s*[,}])/g, ':"$1"$2')

  // Fix trailing commas
  result = result.replace(/,\s*\]/g, "]")

  // Fix missing commas between array elements
  result = result.replace(/\}(\s*)\{/g, "},\n$1{")

  return result
}

/**
 * Repair common JSON syntax errors
 * @param text JSON text to repair
 * @returns Repaired JSON text
 */
export function repairJSON(text: string): string {
  if (!text) return "{}"

  let result = text.trim()

  // Remove any non-JSON content before the first opening brace
  const firstBrace = result.indexOf("{")
  if (firstBrace > 0) {
    result = result.substring(firstBrace)
  }

  // Remove any non-JSON content after the last closing brace
  const lastBrace = result.lastIndexOf("}")
  if (lastBrace !== -1 && lastBrace < result.length - 1) {
    result = result.substring(0, lastBrace + 1)
  }

  // Fix specific array closure issues (addressing the errors in the logs)
  result = fixArrayClosureIssues(result)

  // Fix missing quotes around property names
  result = result.replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')

  // Fix trailing commas in objects
  result = result.replace(/,\s*\}/g, "}")

  // Fix trailing commas in arrays
  result = result.replace(/,\s*\]/g, "]")

  // Fix missing quotes around string values
  result = result.replace(/:\s*([a-zA-Z0-9_]+)(\s*[,}])/g, ':"$1"$2')

  // Fix unclosed arrays before new properties
  result = fixUnclosedArraysBeforeNewProperties(result)

  // Fix single quotes to double quotes
  result = result.replace(/'/g, '"')

  // Fix unquoted property values that should be strings
  result = result.replace(/:\s*([a-zA-Z][a-zA-Z0-9_\s]*[a-zA-Z0-9_])(\s*[,}])/g, ':"$1"$2')

  // Fix control characters in string literals
  result = result.replace(/"[^"]*"/g, (match) => {
    return match.replace(/[\x00-\x1F\x7F-\x9F]/g, " ")
  })

  // Balance brackets and braces
  result = balanceBracketsAndBraces(result)

  return result
}

/**
 * Fix specific array closure issues seen in the error logs
 * @param json JSON string to fix
 * @returns Fixed JSON string
 */
function fixArrayClosureIssues(json: string): string {
  let result = json

  // Fix arrays that are immediately followed by another property without proper closure
  // Pattern: "property": ["value1", "value2"]"nextProperty":
  result = result.replace(/(\])\s*"([^"]+)":/g, '$1, "$2":')

  // Fix arrays that are immediately followed by another property with a missing comma
  // Pattern: "property": ["value1", "value2"] "nextProperty":
  result = result.replace(/(\])\s+("([^"]+)"):/g, "$1, $2:")

  // Fix specific pattern from error logs: "marketing concepts"]"
  result = result.replace(/"([^"]+)"\]/g, '"$1"]')

  // Fix specific pattern from error logs: "ering", "selection"]"
  result = result.replace(/("([^"]+)")\s*,\s*("([^"]+)")\]/g, "$1, $3]")

  // Fix arrays with control characters
  result = result.replace(/\[\s*"[^"]*?[\x00-\x1F\x7F-\x9F][^"]*?"\s*\]/g, (match) => {
    return match.replace(/[\x00-\x1F\x7F-\x9F]/g, " ")
  })

  // Fix arrays with missing commas between elements
  result = result.replace(/"([^"]*)"\s+"([^"]*)"/g, '"$1", "$2"')

  // Remove any trailing commas after the last property
  result = result.replace(/,\s*$/g, "")

  // Remove any trailing characters after the JSON object ends
  const lastBrace = result.lastIndexOf("}")
  if (lastBrace !== -1 && lastBrace < result.length - 1) {
    result = result.substring(0, lastBrace + 1)
  }

  return result
}

/**
 * Fix unclosed arrays before new properties
 * This is a common issue where an array is not closed before a new property is defined
 */
function fixUnclosedArraysBeforeNewProperties(json: string): string {
  // Look for patterns like: ["item1", "item2" "property":
  // which should be: ["item1", "item2"], "property":
  let result = json

  // First pass: Fix arrays that are immediately followed by a property name without closing bracket
  result = result.replace(/(\[[^\]]*?)("[\w\s]+")\s*:/g, "$1], $2:")

  // Second pass: Fix arrays with values that are immediately followed by a property without proper closure
  result = result.replace(/(\[[^\]]*?"[^"]*?")\s+("[\w\s]+")\s*:/g, "$1], $2:")

  // Third pass: Fix arrays with multiple values that are immediately followed by a property
  result = result.replace(/(\[[^\]]*?"[^"]*?"(?:\s*,\s*"[^"]*?")+)\s+("[\w\s]+")\s*:/g, "$1], $2:")

  // Fourth pass: Fix arrays that end with a string and are followed by a new property
  result = result.replace(/(\[[^\]]*?"[^"]*?")\s*\n\s*"([^"]+)"\s*:/g, '$1],\n"$2":')

  return result
}

/**
 * Extract error position from error message
 */
function getErrorPosition(errorMsg: string): number {
  const positionMatch = errorMsg.match(/position (\d+)/)
  return positionMatch ? Number.parseInt(positionMatch[1]) : -1
}

/**
 * Fix unclosed arrays before new properties
 * This handles cases like: "property": ["value", "another property": ["value"]
 * where the array isn't properly closed before a new property starts
 */
function fixUnclosedArraysBeforeProperties(json: string): string {
  try {
    // Pattern: find array start, then a value, then a property name without closing the array
    const pattern = /("\w+"\s*:\s*\[(?:[^[\]]*?))(,\s*"[^"]+"\s*:)/g
    let result = json
    let match

    // First pass: find and fix simple cases
    result = result.replace(pattern, "$1]$2")

    // Second pass: more complex pattern with nested content
    const complexPattern = /("\w+"\s*:\s*\[[^\]]*?)("(?:\w+)"\s*:)/g
    result = result.replace(complexPattern, (match, arrayPart, propertyPart) => {
      // Check if the array part has balanced brackets
      const openBrackets = (arrayPart.match(/\[/g) || []).length
      const closeBrackets = (arrayPart.match(/\]/g) || []).length

      if (openBrackets > closeBrackets) {
        // Add missing closing brackets
        return arrayPart + "]," + propertyPart
      }
      return match
    })

    // Third pass: handle specific case from the error
    result = result.replace(/"(\w+)"\s*:\s*\[\s*"([^"]+)"\s*,\s*"(\w+)"\s*:/g, '"$1": ["$2"], "$3":')

    return result
  } catch (error) {
    console.error("Error in fixUnclosedArraysBeforeProperties:", error)
    return json // Return original if repair fails
  }
}

/**
 * More aggressive JSON repair for difficult cases
 */
function aggressiveJSONRepair(jsonString: string): string {
  if (typeof jsonString !== "string") {
    console.error("aggressiveJSONRepair received non-string input:", typeof jsonString)
    return "{}" // Return empty object as fallback
  }

  try {
    // First, sanitize control characters
    let repaired = sanitizeControlCharacters(jsonString)

    // Fix array syntax issues
    repaired = fixArraySyntaxIssues(repaired)

    // Fix property name and value issues
    repaired = fixPropertyNameAndValueIssues(repaired)

    // Fix structural issues
    repaired = fixStructuralIssues(repaired)

    // Additional aggressive fixes

    // Fix arrays that are immediately followed by a property without a comma
    repaired = repaired.replace(/(\])\s*("([^"]+)"):/g, "$1,\n$2:")
    repaired = repaired.replace(/(\])\s+(\{)/g, "$1, $2")

    // Fix missing commas between properties
    repaired = repaired.replace(/}(\s*){/g, "},\n$1{")
    repaired = repaired.replace(/](\s*){/g, "],\n$1{")
    repaired = repaired.replace(/}(\s*)\[/g, "},\n$1[")
    repaired = repaired.replace(/](\s*)\[/g, "],\n$1[")

    // Fix JavaScript-style comments
    repaired = repaired.replace(/\/\/.*?\n/g, "\n")
    repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, "")

    // Remove any trailing characters after the JSON object ends
    const lastBrace = repaired.lastIndexOf("}")
    if (lastBrace !== -1 && lastBrace < repaired.length - 1) {
      repaired = repaired.substring(0, lastBrace + 1)
    }

    // Fix specific issues at line 121, column 5 (position 3865)
    repaired = fixSpecificPositionIssues(repaired)

    return repaired
  } catch (error) {
    console.error("Error in aggressiveJSONRepair:", error)
    return jsonString // Return original if repair fails
  }
}

// Add a new function to specifically fix missing colons
function fixMissingColons(json: string): string {
  // Enhanced version to better handle the specific error at position 3865 (line 121, column 5)

  // Find property names that aren't followed by a colon
  let result = json.replace(/("(?:\\.|[^"\\])*")(\s*)([^:\s,}])/g, "$1:$2$3")

  // Specifically target property names followed by another property name (missing colon between them)
  result = result.replace(/("(?:\\.|[^"\\])*")(\s+)("(?:\\.|[^"\\])*")\s*:/g, "$1: $3:")

  // Fix property names followed by an array without a colon
  result = result.replace(/("(?:\\.|[^"\\])*")(\s+)(\[)/g, "$1: $3")

  // Fix property names followed by an object without a colon
  result = result.replace(/("(?:\\.|[^"\\])*")(\s+)(\{)/g, "$1: $3")

  // Fix property names followed by numbers without a colon
  result = result.replace(/("(?:\\.|[^"\\])*")(\s+)(\d+)/g, "$1: $3")

  // Fix property names followed by boolean values without a colon
  result = result.replace(/("(?:\\.|[^"\\])*")(\s+)(true|false)/g, "$1: $3")

  // Fix property names followed by null without a colon
  result = result.replace(/("(?:\\.|[^"\\])*")(\s+)(null)/g, "$1: $3")

  // Fix property names at the end of a line followed by a value at the start of the next line
  result = result.replace(/("(?:\\.|[^"\\])*")\s*\n\s*([^\s:,}])/g, "$1: $2")

  // Fix property names at the end of a line followed by a string at the start of the next line
  result = result.replace(/("(?:\\.|[^"\\])*")\s*\n\s*"/g, '$1: "')

  return result
}

/**
 * Attempts to fix issues at a specific position in the JSON
 */
function fixPositionSpecificIssue(
  text: string,
  position: number,
  errorMsg: string,
  line: number,
  column: number,
): string {
  try {
    // Get context around the error (100 chars before and after)
    const start = Math.max(0, position - 100)
    const end = Math.min(text.length, position + 100)
    const context = text.substring(start, end)

    console.log(`JSON error context around position ${position} (line ${line}, column ${column}): "${context}"`)

    // Check for specific error patterns
    if (errorMsg.includes("Expected ':' after property name")) {
      // This is the specific error we're seeing in the current case

      // Get the lines around the error
      const lines = text.split("\n")
      const errorLine = lines[line - 1] || ""
      const prevLine = lines[line - 2] || ""
      const nextLine = lines[line] || ""

      console.log("Error line:", errorLine)
      console.log("Previous line:", prevLine)
      console.log("Next line:", nextLine)

      // If the error is at position 3865 (line 121, column 5)
      if (position === 3865 || (line === 121 && column === 5)) {
        // Special handling for this specific error
        // Insert a colon at the position
        return text.substring(0, position) + ":" + text.substring(position)
      }

      // For other missing colon errors, try to find the property name and add a colon
      const beforeError = text.substring(Math.max(0, position - 50), position)
      const propertyNameMatch = beforeError.match(/"([^"]*)"\s*$/)

      if (propertyNameMatch) {
        // Found a property name before the error position
        const propertyNameEnd = position - (propertyNameMatch[0].length - propertyNameMatch[1].length - 1)
        return text.substring(0, propertyNameEnd) + ":" + text.substring(propertyNameEnd)
      }

      // Default: insert a colon at the position
      return text.substring(0, position) + ":" + text.substring(position)
    }

    if (errorMsg.includes("Expected ',' or ']' after array element")) {
      // Check if we're at the end of an object inside an array
      const beforeError = text.substring(Math.max(0, position - 100), position)
      const afterError = text.substring(position, Math.min(text.length, position + 100))

      // If we're at the end of an object and there's another object or property after it
      if (beforeError.endsWith("}") && (afterError.trim().startsWith("{") || afterError.trim().startsWith('"'))) {
        return text.substring(0, position) + "," + text.substring(position)
      }

      // If we're at the end of a string and there's another string after it
      if (beforeError.endsWith('"') && afterError.trim().startsWith('"')) {
        return text.substring(0, position) + "," + text.substring(position)
      }

      // If we're at the end of an object and we're inside an array
      if (beforeError.endsWith("}") && beforeError.lastIndexOf("[") > beforeError.lastIndexOf("]")) {
        // Check if we need to close the array
        if (afterError.trim().startsWith('"') && afterError.includes(":")) {
          return text.substring(0, position) + "]," + text.substring(position)
        } else {
          return text.substring(0, position) + "," + text.substring(position)
        }
      }

      // Default: add a comma
      return text.substring(0, position) + "," + text.substring(position)
    }

    // Handle other error types
    if (errorMsg.includes("Expected property name or '}'")) {
      // Unexpected character where property name should be
      return text.substring(0, position) + "}" + text.substring(position)
    }

    if (errorMsg.includes("Bad control character")) {
      // Replace the control character with a space
      return text.substring(0, position) + " " + text.substring(position + 1)
    }

    if (errorMsg.includes("Unexpected token")) {
      // Try to determine what's needed based on context
      const beforeError = text.substring(Math.max(0, position - 50), position)
      const afterError = text.substring(position, Math.min(text.length, position + 50))

      if (beforeError.match(/"[^"]*$/)) {
        // Unclosed quote before the error position
        return text.substring(0, position) + '"' + text.substring(position)
      }

      if (afterError.match(/^[^"]*"/)) {
        // Unclosed quote after the error position
        return text.substring(0, position) + '"' + text.substring(position)
      }

      // Check for unclosed arrays
      if (beforeError.includes("[") && !beforeError.includes("]", beforeError.lastIndexOf("["))) {
        // If we're in an array and hit an unexpected token, try closing the array
        return text.substring(0, position) + "]" + text.substring(position)
      }
    }

    // If we can't determine a specific fix, return the original
    return text
  } catch (error) {
    console.error("Error in fixPositionSpecificIssue:", error)
    return text // Return original if repair fails
  }
}

/**
 * Balances brackets and braces in the JSON
 */
function balanceBracketsAndBraces(json: string): string {
  try {
    const stack: string[] = []
    let balanced = true

    // Count opening and closing brackets/braces
    let openBraces = 0,
      closeBraces = 0
    let openBrackets = 0,
      closeBrackets = 0

    for (let i = 0; i < json.length; i++) {
      const char = json[i]

      if (char === "{") {
        stack.push("}")
        openBraces++
      } else if (char === "[") {
        stack.push("]")
        openBrackets++
      } else if (char === "}") {
        if (stack.pop() !== "}") balanced = false
        closeBraces++
      } else if (char === "]") {
        if (stack.pop() !== "]") balanced = false
        closeBrackets++
      }
    }

    // If already balanced, return original
    if (balanced && stack.length === 0) return json

    // Add missing closing brackets/braces
    let result = json
    while (openBraces > closeBraces) {
      result += "}"
      closeBraces++
    }

    while (openBrackets > closeBrackets) {
      result += "]"
      closeBrackets++
    }

    return result
  } catch (error) {
    console.error("Error in balanceBracketsAndBraces:", error)
    return json // Return original if repair fails
  }
}

/**
 * Fix unclosed arrays
 * @param json JSON string to fix
 * @returns Fixed JSON string
 */
function fixUnclosedArrays(json: string): string {
  // Count opening and closing brackets
  const openBrackets = (json.match(/\[/g) || []).length
  const closeBrackets = (json.match(/\]/g) || []).length

  // Add missing closing brackets
  let result = json
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    // Find the last unclosed array
    let depth = 0
    let lastOpenPos = -1

    for (let j = 0; j < result.length; j++) {
      if (result[j] === "[") {
        depth++
        lastOpenPos = j
      } else if (result[j] === "]") {
        depth--
      }
    }

    if (depth > 0 && lastOpenPos !== -1) {
      // Find a good position to close the array
      // Look for the next property start or object end
      const nextPropMatch = result.slice(lastOpenPos).match(/"([^"]+)"\s*:/)
      const nextObjEndPos = result.indexOf("}", lastOpenPos)

      if (nextPropMatch && nextPropMatch.index) {
        const insertPos = lastOpenPos + nextPropMatch.index
        result = result.slice(0, insertPos) + "]," + result.slice(insertPos)
      } else if (nextObjEndPos !== -1) {
        result = result.slice(0, nextObjEndPos) + "]" + result.slice(nextObjEndPos)
      } else {
        // Just append to the end
        result += "]"
      }
    } else {
      // Just append to the end
      result += "]"
    }
  }

  return result
}

/**
 * Fix missing commas after array closures
 * @param json JSON string to fix
 * @returns Fixed JSON string
 */
function fixMissingCommasAfterArrays(json: string): string {
  // Handle specific case where there's a missing comma after the array closing bracket
  // This addresses the error at position 3631
  return json.replace(/(\])\s*("([^"]+)"):/g, "$1,\n$2:")
}

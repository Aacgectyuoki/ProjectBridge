/**
 * Enhanced JSON repair function to handle common AI response issues
 */
export function repairJSON(text: string): string {
  // Handle empty or undefined input
  if (!text || text.trim() === "") {
    console.log("Empty input provided to repairJSON")
    return "{}"
  }

  // Log the first few characters to help diagnose issues
  console.log("First 10 characters of input to repairJSON:", JSON.stringify(text.substring(0, 10)))

  // Check for invalid characters at the beginning
  const firstChar = text.trim()[0]
  if (firstChar !== "{" && firstChar !== "[") {
    console.log(`Invalid starting character: ${firstChar}`)

    // Try to find a valid JSON structure in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      console.log("Found valid JSON structure in text")
      text = jsonMatch[0]
    } else {
      console.log("No valid JSON structure found, creating empty object")
      return "{}"
    }
  }

  // First, try to extract just the JSON part if there's other text
  const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
  let repairedJSON = jsonMatch ? jsonMatch[0] : text

  // If no JSON-like structure was found, try to create one from the text
  if (!jsonMatch) {
    console.log("No JSON-like structure found, attempting to create one")
    // Check if the text contains any skill-related content
    if (text.toLowerCase().includes("skill") || text.toLowerCase().includes("experience")) {
      repairedJSON = `{ "skills": { "technical": [], "soft": [] }, "experience": [], "education": [], "summary": "", "strengths": [], "weaknesses": [] }`
    } else {
      // Return a minimal valid JSON if nothing else works
      return "{}"
    }
  }

  // NEW: Pre-process to handle specific position errors
  try {
    JSON.parse(repairedJSON)
  } catch (error) {
    if (error.message.includes("position")) {
      const positionMatch = error.message.match(/position (\d+)/)
      if (positionMatch && positionMatch[1]) {
        const position = Number.parseInt(positionMatch[1])
        console.log(`Attempting to fix error at position ${position}`)

        // Check a few characters before and after the error position
        const start = Math.max(0, position - 20)
        const end = Math.min(repairedJSON.length, position + 20)
        const errorContext = repairedJSON.substring(start, end)
        console.log(`Error context: "${errorContext}"`)

        // Handle error at the very beginning (position 0 or 1)
        if (position <= 1) {
          console.log("Error at the beginning of JSON, attempting to fix")
          // Check if the string starts with a valid JSON character
          const firstChar = repairedJSON.trim()[0]
          if (firstChar !== "{" && firstChar !== "[") {
            // Find the first valid JSON starting character
            const validStart = repairedJSON.indexOf("{")
            if (validStart >= 0) {
              repairedJSON = repairedJSON.substring(validStart)
              console.log("Trimmed invalid characters from the beginning")
            } else {
              // If no valid start found, return empty object
              return "{}"
            }
          }
        }
        // Try to fix common issues at the error position
        else if (position < repairedJSON.length) {
          const charAtError = repairedJSON[position]
          const charBeforeError = position > 0 ? repairedJSON[position - 1] : ""
          const prevFewChars = position > 10 ? repairedJSON.substring(position - 10, position) : ""

          // Missing colon after property name
          if (charAtError === '"' && prevFewChars.includes('"') && !prevFewChars.includes(":")) {
            repairedJSON = repairedJSON.slice(0, position) + ":" + repairedJSON.slice(position)
            console.log("Added missing colon after property name")
          }
          // Missing comma between properties
          else if (
            charAtError === '"' &&
            ["}", "]", '"', "'", "e", "l", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(charBeforeError)
          ) {
            repairedJSON = repairedJSON.slice(0, position) + "," + repairedJSON.slice(position)
            console.log("Added missing comma before property")
          }
          // Extra comma before closing bracket
          else if (charAtError === "}" && charBeforeError === ",") {
            repairedJSON = repairedJSON.slice(0, position - 1) + repairedJSON.slice(position)
            console.log("Removed extra comma before closing bracket")
          }
          // Missing quotes around property name
          else if (charAtError === ":" && !prevFewChars.includes('"')) {
            // Find the start of the property name
            let propStart = position - 1
            while (propStart >= 0 && /[a-zA-Z0-9_]/.test(repairedJSON[propStart])) {
              propStart--
            }
            propStart++ // Adjust to the actual start

            // Add quotes around the property name
            const propName = repairedJSON.substring(propStart, position)
            repairedJSON = repairedJSON.slice(0, propStart) + `"${propName}"` + repairedJSON.slice(position)
            console.log(`Added quotes around property name: ${propName}`)
          }
          // NEW: Missing comma after property value
          else if (charAtError === '"' && prevFewChars.match(/["}]\s*$/)) {
            repairedJSON = repairedJSON.slice(0, position) + "," + repairedJSON.slice(position)
            console.log("Added missing comma after property value")
          }
          // NEW: Unclosed string literal
          else if (prevFewChars.includes('"') && !prevFewChars.match(/[\\"]"/) && charAtError !== '"') {
            repairedJSON = repairedJSON.slice(0, position) + '"' + repairedJSON.slice(position)
            console.log("Added missing closing quote for string literal")
          }
          // NEW: Handle property value followed by another property without comma
          else if (charAtError === '"' && prevFewChars.match(/[^,{[]"[^"]*"$/)) {
            repairedJSON = repairedJSON.slice(0, position) + "," + repairedJSON.slice(position)
            console.log("Added missing comma between property value and next property")
          }
        }
      }
    }
  }

  // Pre-process: Handle commas inside quoted strings
  let inQuote = false
  let processedJSON = ""

  for (let i = 0; i < repairedJSON.length; i++) {
    const char = repairedJSON[i]

    // Track if we're inside a quoted string
    if (char === '"' && (i === 0 || repairedJSON[i - 1] !== "\\")) {
      inQuote = !inQuote
    }

    // If we're inside a quoted string, replace commas with a placeholder
    if (inQuote && char === ",") {
      processedJSON += "##COMMA##"
    } else {
      processedJSON += char
    }
  }

  // NEW: Handle unclosed quotes at the end of the string
  if (inQuote) {
    processedJSON += '"'
    console.log("Added missing closing quote at the end of JSON")
  }

  // Fix common JSON syntax issues
  processedJSON = processedJSON
    // Fix property names without quotes
    .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":')

    // Fix missing commas in arrays
    .replace(/\]([^,\]}])/g, "],$1")

    // Fix trailing commas
    .replace(/,(\s*[\]}])/g, "$1")

    // Fix missing quotes around string values
    .replace(/:(\s*)([a-zA-Z][a-zA-Z0-9_]*)/g, ':"$2"')

    // Fix URLs without proper string escaping
    .replace(/"url":\s*([^"].+?)(,|\})/g, '"url": "$1"$2')

    // Fix missing commas between objects in arrays
    .replace(/\}(\s*)\{/g, "},\n{")

    // Fix newlines in string literals
    .replace(/([^\\])(\n+)([^"])/g, "$1\\n$3")

    // Fix array formatting issues
    .replace(/\[\s*"([^"]+)"\s*"([^"]+)"/g, '["$1","$2"')
    .replace(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*"([^"]+)"/g, '["$1","$2","$3"')

    // NEW: Fix property value followed by property name without comma
    .replace(/"([^"]*)"(\s*)"([^"]*)"/g, '"$1",$2"$3"')

    // NEW: Fix missing commas after numeric values
    .replace(/(\d+)(\s+)"([^"]+)"/g, '$1,$2"$3"')

    // NEW: Fix missing commas after boolean values
    .replace(/(true|false)(\s+)"([^"]+)"/g, '$1,$2"$3"')

  // Restore commas in quoted strings
  processedJSON = processedJSON.replace(/##COMMA##/g, ",")

  // Final validation - if still invalid, return empty object
  try {
    JSON.parse(processedJSON)
    return processedJSON
  } catch (error) {
    console.error("Final JSON validation failed:", error.message)

    // NEW: Try one more aggressive approach - extract and rebuild the JSON structure
    try {
      return rebuildJSONStructure(repairedJSON)
    } catch (rebuildError) {
      console.error("JSON structure rebuild failed:", rebuildError.message)
      return "{}"
    }
  }
}

/**
 * NEW: Function to rebuild JSON structure from scratch by extracting key-value pairs
 */
function rebuildJSONStructure(text: string): string {
  console.log("Attempting to rebuild JSON structure from scratch")

  // Extract all property names and values
  const properties = []
  const propertyRegex = /"([^"]+)"\s*:\s*("[^"]*"|[\d.]+|true|false|null|\{[\s\S]*?\}|\[[\s\S]*?\])/g
  let match

  while ((match = propertyRegex.exec(text)) !== null) {
    properties.push(`"${match[1]}": ${match[2]}`)
  }

  if (properties.length === 0) {
    throw new Error("No valid properties found")
  }

  // Rebuild the JSON object
  return `{${properties.join(",")}}`
}

/**
 * Safe JSON parse with multiple fallback strategies
 */
export function safeParseJSON<T>(text: string, defaultValue: T): T {
  // Handle empty or undefined input
  if (!text || text.trim() === "") {
    console.log("Empty input provided to safeParseJSON")
    return defaultValue
  }

  // Log the first few characters to help diagnose issues
  console.log("First 20 characters of input:", JSON.stringify(text.substring(0, 20)))

  try {
    // First try direct parsing
    return JSON.parse(text)
  } catch (initialError) {
    console.error("Initial JSON parse failed:", initialError.message)

    // Log the problematic area of the JSON
    if (initialError.message.includes("position")) {
      const positionMatch = initialError.message.match(/position (\d+)/)
      if (positionMatch && positionMatch[1]) {
        const position = Number.parseInt(positionMatch[1])
        const start = Math.max(0, position - 20)
        const end = Math.min(text.length, position + 20)
        console.error(
          `JSON error context: "${text.substring(start, position)}[ERROR HERE]${text.substring(position, end)}"`,
        )

        // NEW: Log the character code at the error position for better debugging
        if (position < text.length) {
          const charCode = text.charCodeAt(position)
          console.error(`Character at error position: '${text[position]}' (code: ${charCode})`)
        }
      }
    }

    // Handle specific error at the beginning of JSON
    if (initialError.message.includes("position 1") || initialError.message.includes("position 0")) {
      console.log("Error at the beginning of JSON, attempting to fix")

      // Try to find a valid JSON structure in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        console.log("Found valid JSON structure in text")
        try {
          return JSON.parse(jsonMatch[0])
        } catch (matchError) {
          console.error("Extracted JSON structure is still invalid:", matchError.message)
        }
      }

      // If extraction failed, create a minimal valid response
      console.log("Creating minimal valid response")
      return createMinimalValidResponse(defaultValue)
    }

    try {
      // Try parsing after repair
      const repairedJSON = repairJSON(text)
      console.log("Repaired JSON (first 50 chars):", repairedJSON.substring(0, 50))
      return JSON.parse(repairedJSON)
    } catch (repairError) {
      console.error("JSON repair failed:", repairError.message)

      try {
        // Try more aggressive repair
        const aggressivelyRepairedJSON = aggressiveJSONRepair(text)
        console.log("Aggressively repaired JSON (first 50 chars):", aggressivelyRepairedJSON.substring(0, 50))
        return JSON.parse(aggressivelyRepairedJSON)
      } catch (aggressiveRepairError) {
        console.error("Aggressive JSON repair also failed:", aggressiveRepairError.message)

        try {
          // Try array-specific repair
          const arrayRepairedJSON = repairArrayFormatting(text)
          console.log("Array-repaired JSON (first 50 chars):", arrayRepairedJSON.substring(0, 50))
          return JSON.parse(arrayRepairedJSON)
        } catch (arrayRepairError) {
          console.error("Array-specific JSON repair also failed:", arrayRepairError.message)

          try {
            // Try direct skill extraction as a fallback
            console.log("Attempting direct skill extraction from bullet points")
            const extractedSkills = extractSkillsFromBulletPoints(text)

            if (Object.keys(extractedSkills).length > 0) {
              console.log("Successfully extracted skills from bullet points:", extractedSkills)

              // Create a valid JSON object with the extracted skills
              const mappedSkills = mapToStandardCategories(extractedSkills)
              const result = {
                ...defaultValue,
                skills: {
                  technical: mappedSkills.technical.concat(
                    mappedSkills.languages,
                    mappedSkills.frameworks,
                    mappedSkills.databases,
                    mappedSkills.platforms,
                  ),
                  soft: mappedSkills.soft,
                },
                extractedSkills: mappedSkills,
              }

              return result as T
            }
          } catch (extractionError) {
            console.error("Direct skill extraction failed:", extractionError.message)
          }

          try {
            // Try line-by-line repair
            const lineByLineRepairedJSON = lineByLineJSONRepair(text)
            console.log("Line-by-line repaired JSON (first 50 chars):", lineByLineRepairedJSON.substring(0, 50))
            return JSON.parse(lineByLineRepairedJSON)
          } catch (lineByLineRepairError) {
            console.error("Line-by-line JSON repair also failed:", lineByLineRepairError.message)

            try {
              // Last resort: try to extract any valid JSON object from the text
              const extractedJSON = extractValidJSON(text)
              if (extractedJSON) {
                console.log("Extracted valid JSON (first 50 chars):", extractedJSON.substring(0, 50))
                return JSON.parse(extractedJSON)
              }
            } catch (extractError) {
              console.error("JSON extraction also failed:", extractError.message)
            }
          }
        }
      }

      // Return default value if all parsing attempts fail
      console.log("All JSON repair attempts failed, returning default value")
      return createMinimalValidResponse(defaultValue)
    }
  }
}

/**
 * Create a minimal valid response based on the default value structure
 */
function createMinimalValidResponse<T>(defaultValue: T): T {
  // Create a basic structure with empty arrays for skills
  const minimalResponse = {
    ...defaultValue,
    skills: {
      technical: [],
      soft: [],
    },
    experience: [],
    education: [],
    summary: "Unable to parse resume data.",
    strengths: [],
    weaknesses: ["Data could not be properly analyzed."],
  }

  return minimalResponse as T
}

/**
 * More aggressive JSON repair for difficult cases
 */
export function aggressiveJSONRepair(text: string): string {
  // First, ensure we're starting with a valid JSON structure
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
    // Try to find a JSON-like structure in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      text = jsonMatch[0]
    } else {
      // If no JSON structure found, create a minimal valid one
      return '{"error": "No valid JSON structure found"}'
    }
  }

  // Handle arrays with problematic commas in quoted strings
  // First, temporarily replace commas inside quotes with a placeholder
  let inQuote = false
  let result = ""

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '"' && (i === 0 || text[i - 1] !== "\\")) {
      inQuote = !inQuote
    }

    if (inQuote && char === ",") {
      // Replace comma inside quotes with a placeholder
      result += "##COMMA##"
    } else {
      result += char
    }
  }

  // Handle unclosed quotes
  if (inQuote) {
    result += '"'
    console.log("Added missing closing quote in aggressive repair")
  }

  // Now fix the JSON structure issues
  result = result
    // Fix property names without quotes
    .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":')

    // Fix trailing commas
    .replace(/,(\s*[\]}])/g, "$1")

    // Fix missing commas between array elements
    .replace(/\]([^,\]}])/g, "],$1")

    // Fix missing quotes around string values
    .replace(/:(\s*)([a-zA-Z][a-zA-Z0-9_]*)/g, ':"$2"')

    // Fix missing commas between properties
    .replace(/("[^"]*":\s*"[^"]*")\s*(")/g, "$1,$2")
    .replace(/("[^"]*":\s*\d+)\s*(")/g, "$1,$2")
    .replace(/("[^"]*":\s*true|false)\s*(")/g, "$1,$2")
    .replace(/("[^"]*":\s*\{[^{}]*\})\s*(")/g, "$1,$2")
    .replace(/("[^"]*":\s*\[[^[\]]*\])\s*(")/g, "$1,$2")

    // Fix array formatting issues
    .replace(/\[\s*"([^"]+)"\s*"([^"]+)"/g, '["$1","$2"')
    .replace(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*"([^"]+)"/g, '["$1","$2","$3"')

    // NEW: Fix property value followed by property name without comma
    .replace(/"([^"]*)"(\s*)"([^"]*)"/g, '"$1",$2"$3"')

    // NEW: Fix missing commas after numeric values
    .replace(/(\d+)(\s+)"([^"]+)"/g, '$1,$2"$3"')

    // NEW: Fix missing commas after boolean values
    .replace(/(true|false)(\s+)"([^"]+)"/g, '$1,$2"$3"')

  // Restore the commas inside quotes
  result = result.replace(/##COMMA##/g, ",")

  // Final validation - if still invalid, return empty object
  try {
    JSON.parse(result)
    return result
  } catch (error) {
    console.error("Aggressive JSON repair validation failed:", error.message)
    return "{}"
  }
}

/**
 * Specialized repair function for array formatting issues
 */
export function repairArrayFormatting(text: string): string {
  // First, ensure we're starting with a valid JSON structure
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
    // Try to find a JSON-like structure in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      text = jsonMatch[0]
    } else {
      // If no JSON structure found, create a minimal valid one
      return '{"error": "No valid JSON structure found"}'
    }
  }

  // Find all array patterns in the text
  const arrayPattern = /\[([\s\S]*?)\]/g
  let match
  let result = text

  while ((match = arrayPattern.exec(text)) !== null) {
    const arrayContent = match[1]
    const fixedArrayContent = fixArrayContent(arrayContent)

    // Replace the original array content with the fixed content
    result = result.replace(match[0], `[${fixedArrayContent}]`)
  }

  return result
}

/**
 * Helper function to fix array content
 */
function fixArrayContent(arrayContent: string): string {
  // If empty, return empty
  if (!arrayContent.trim()) return ""

  // Split by potential array elements
  const elements = []
  let currentElement = ""
  let inQuote = false
  let inObject = 0
  let inArray = 0

  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i]

    // Track quotes
    if (char === '"' && (i === 0 || arrayContent[i - 1] !== "\\")) {
      inQuote = !inQuote
    }

    // Track nested objects
    if (!inQuote) {
      if (char === "{") inObject++
      if (char === "}") inObject--
      if (char === "[") inArray++
      if (char === "]") inArray--
    }

    // If we're at a comma and not inside quotes, object, or array, we've found an element
    if (char === "," && !inQuote && inObject === 0 && inArray === 0) {
      elements.push(currentElement.trim())
      currentElement = ""
    } else {
      currentElement += char
    }
  }

  // Add the last element
  if (currentElement.trim()) {
    elements.push(currentElement.trim())
  }

  // Join elements with proper commas
  return elements.join(",")
}

/**
 * Line-by-line JSON repair for handling structural issues
 */
export function lineByLineJSONRepair(text: string): string {
  // First, ensure we're starting with a valid JSON structure
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
    // Try to find a JSON-like structure in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      text = jsonMatch[0]
    } else {
      // If no JSON structure found, create a minimal valid one
      return '{"error": "No valid JSON structure found"}'
    }
  }

  // Split by lines and process each line
  const lines = text.split("\n")
  const processedLines = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    // Handle property lines
    if (line.includes(":")) {
      // Fix property name quotes
      line = line.replace(/^(\s*)([a-zA-Z0-9_]+)(\s*):/, '$1"$2"$3:')

      // Check if this is not the last line and needs a comma
      const nextNonEmptyLine = findNextNonEmptyLine(lines, i)
      if (
        nextNonEmptyLine &&
        !line.endsWith(",") &&
        !nextNonEmptyLine.startsWith("}") &&
        !nextNonEmptyLine.startsWith("]")
      ) {
        line += ","
      }

      // Remove comma if next line is closing brace or bracket
      if (
        line.endsWith(",") &&
        nextNonEmptyLine &&
        (nextNonEmptyLine.startsWith("}") || nextNonEmptyLine.startsWith("]"))
      ) {
        line = line.slice(0, -1)
      }
    }

    // Handle array item lines
    else if (line.startsWith('"') || line.match(/^\d+/) || line === "true" || line === "false" || line === "null") {
      // Check if this is not the last line and needs a comma
      const nextNonEmptyLine = findNextNonEmptyLine(lines, i)
      if (
        nextNonEmptyLine &&
        !line.endsWith(",") &&
        !nextNonEmptyLine.startsWith("}") &&
        !nextNonEmptyLine.startsWith("]")
      ) {
        line += ","
      }

      // Remove comma if next line is closing brace or bracket
      if (
        line.endsWith(",") &&
        nextNonEmptyLine &&
        (nextNonEmptyLine.startsWith("}") || nextNonEmptyLine.startsWith("]"))
      ) {
        line = line.slice(0, -1)
      }
    }

    processedLines.push(line)
  }

  return processedLines.join("\n")
}

/**
 * Helper function to find the next non-empty line
 */
function findNextNonEmptyLine(lines: string[], currentIndex: number): string | null {
  for (let i = currentIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line) return line
  }
  return null
}

/**
 * Extract any valid JSON object from text
 */
function extractValidJSON(text: string): string | null {
  // Try to find any JSON-like structure
  const jsonMatch = text.match(/\{[\s\S]*?\}/) || text.match(/\[[\s\S]*?\]/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  // If no valid JSON structure found, try to build one from key-value pairs
  const keyValuePairs = []
  const keyValueRegex = /"([^"]+)":\s*("[^"]*"|[\d.]+|true|false|null|\{[\s\S]*?\}|\[[\s\S]*?\])/g
  let match

  while ((match = keyValueRegex.exec(text)) !== null) {
    keyValuePairs.push(`"${match[1]}": ${match[2]}`)
  }

  if (keyValuePairs.length > 0) {
    return `{${keyValuePairs.join(",")}}`
  }

  return null
}

/**
 * Extract individual projects from malformed JSON
 */
function extractProjectsFromText(text: string): any[] {
  const projects = []
  const projectMatches = text.match(/\{\s*"id"[\s\S]*?("tags"[\s\S]*?\])\s*\}/g)

  if (projectMatches && projectMatches.length > 0) {
    for (const projectText of projectMatches) {
      try {
        // Try to repair and parse each individual project
        const repairedProject = repairJSON(projectText)
        const project = JSON.parse(repairedProject)
        projects.push(project)
      } catch (e) {
        console.log("Failed to parse individual project:", e)
      }
    }
  }

  return projects
}

// Import the skill extraction functions
import { extractSkillsFromBulletPoints, mapToStandardCategories } from "./skill-extraction-utils"

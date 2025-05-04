/**
 * Enhanced JSON repair utility to handle common JSON parsing errors
 */

/**
 * Attempts to repair malformed JSON strings
 * @param jsonString The potentially malformed JSON string
 * @returns Repaired JSON string or the original if repair fails
 */
export function repairJSON(jsonString: string): string {
  try {
    // First try parsing as-is
    JSON.parse(jsonString)
    return jsonString
  } catch (error) {
    // If parsing fails, attempt repairs
    const repaired = attemptJSONRepair(jsonString, error)
    return repaired
  }
}

/**
 * Safely parses JSON with repair attempts
 * @param jsonString The JSON string to parse
 * @param defaultValue Optional default value to return if parsing fails
 * @returns Parsed JSON object or defaultValue if parsing fails
 */
export function safeParseJSON<T>(jsonString: string, defaultValue?: T): any {
  if (typeof jsonString !== "string") {
    console.error("safeParseJSON received non-string input:", typeof jsonString)
    return defaultValue !== undefined ? defaultValue : null
  }

  try {
    // First, try to extract JSON from text that might contain explanatory content
    const extractedJson = extractJsonFromText(jsonString)
    if (extractedJson) {
      return extractedJson
    }

    // If no JSON was extracted, try to parse the original string
    return JSON.parse(jsonString)
  } catch (originalError) {
    console.error("Initial JSON parse failed:", originalError.message)

    // Log a snippet of the problematic JSON for debugging
    console.error("First 100 characters:", jsonString.substring(0, 100) + "...")

    try {
      // Attempt to repair and parse
      const repairedJSON = repairJSON(jsonString)
      try {
        return JSON.parse(repairedJSON)
      } catch (repairError) {
        console.error("JSON repair failed:", repairError.message)
      }

      // Try more aggressive repairs
      const aggressivelyRepairedJSON = aggressiveJSONRepair(jsonString)
      if (typeof aggressivelyRepairedJSON !== "string") {
        console.error("aggressiveJSONRepair returned non-string:", typeof aggressivelyRepairedJSON)
        throw new Error("Repair function returned non-string value")
      }
      try {
        return JSON.parse(aggressivelyRepairedJSON)
      } catch (aggressiveRepairError) {
        console.error("Aggressive JSON repair failed:", aggressiveRepairError.message)
      }

      // Last resort: try to extract valid JSON subset
      const extractedJSON = extractValidJSONSubset(jsonString)
      try {
        return JSON.parse(extractedJSON)
      } catch (extractError) {
        console.error("JSON extraction failed:", extractError.message)
      }

      // If all repair attempts fail, return the default value
      return defaultValue !== undefined ? defaultValue : null
    } catch (error) {
      console.error("All JSON repair attempts failed:", error)
      return defaultValue !== undefined ? defaultValue : null
    }
  }
}

/**
 * Attempts to extract JSON from a string that might contain additional text
 * @param text The text that might contain JSON
 * @returns Parsed JSON object or null if parsing fails
 */
function extractJsonFromText(text: string): any {
  if (!text) return null

  try {
    // First, try to find JSON-like structure with regex
    // Look for objects
    const objectRegex = /(\{[\s\S]*\})/g
    const objectMatches = text.match(objectRegex)

    if (objectMatches) {
      for (const match of objectMatches) {
        try {
          return JSON.parse(match)
        } catch (e) {
          // Continue to the next match
        }
      }
    }

    // Look for arrays
    const arrayRegex = /(\[[\s\S]*\])/g
    const arrayMatches = text.match(arrayRegex)

    if (arrayMatches) {
      for (const match of arrayMatches) {
        try {
          return JSON.parse(match)
        } catch (e) {
          // Continue to the next match
        }
      }
    }

    // Try to find the first { and last } in the text
    const firstBrace = text.indexOf("{")
    const lastBrace = text.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      const possibleJson = text.substring(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(possibleJson)
      } catch (e) {
        // Try with some repairs
        try {
          const repaired = repairJSON(possibleJson)
          return JSON.parse(repaired)
        } catch (e2) {
          // Continue to other strategies
        }
      }
    }

    // Try to find the first [ and last ] in the text
    const firstBracket = text.indexOf("[")
    const lastBracket = text.lastIndexOf("]")

    if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
      const possibleJson = text.substring(firstBracket, lastBracket + 1)
      try {
        return JSON.parse(possibleJson)
      } catch (e) {
        // Try with some repairs
        try {
          const repaired = repairJSON(possibleJson)
          return JSON.parse(repaired)
        } catch (e2) {
          // Continue to other strategies
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error extracting JSON from text:", error)
    return null
  }
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
 * Attempts to repair JSON based on specific error patterns
 */
function attemptJSONRepair(jsonString: string, error: Error): string {
  if (typeof jsonString !== "string") {
    console.error("attemptJSONRepair received non-string input:", typeof jsonString)
    return "{}" // Return empty object as fallback
  }

  // First, try to extract JSON if the string contains explanatory text
  const extractedJson = extractJsonFromText(jsonString)
  if (extractedJson) {
    return JSON.stringify(extractedJson)
  }

  let repairedJSON = jsonString

  // Get error message and position information
  const errorMsg = error.message
  const position = getErrorPosition(errorMsg)

  // Fix unclosed arrays before new properties
  repairedJSON = fixUnclosedArraysBeforeProperties(repairedJSON)

  // Apply specific repairs based on error message
  if (errorMsg.includes("Expected ':' after property name")) {
    repairedJSON = fixMissingColons(repairedJSON)
  }

  if (errorMsg.includes("Expected ',' or ']' after array element")) {
    repairedJSON = fixMissingCommasInArrays(repairedJSON)
  }

  if (errorMsg.includes("Expected ',' or '}' after property value")) {
    repairedJSON = fixMissingCommasInObjects(repairedJSON)
  }

  // Common repair strategies
  repairedJSON = fixTrailingCommas(repairedJSON)
  repairedJSON = fixMissingCommas(repairedJSON)
  repairedJSON = fixUnquotedPropertyNames(repairedJSON)
  repairedJSON = fixMissingQuotes(repairedJSON)

  // Position-specific repairs if we have position info
  if (position > 0) {
    repairedJSON = fixPositionSpecificIssue(repairedJSON, position, errorMsg)
  }

  // Balance brackets and braces
  repairedJSON = balanceBracketsAndBraces(repairedJSON)

  return repairedJSON
}

/**
 * More aggressive JSON repair for difficult cases
 */
function aggressiveJSONRepair(jsonString: string): string {
  if (typeof jsonString !== "string") {
    console.error("aggressiveJSONRepair received non-string input:", typeof jsonString)
    return "{}" // Return empty object as fallback
  }

  // First, try to extract JSON if the string contains explanatory text
  const extractedJson = extractJsonFromText(jsonString)
  if (extractedJson) {
    return JSON.stringify(extractedJson)
  }

  try {
    // First, fix unclosed arrays before new properties
    let repaired = fixUnclosedArraysBeforeProperties(jsonString)

    // Try to normalize the JSON structure
    repaired = repaired
      // Fix property names without quotes
      .replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*)([:}])/g, '$1"$2"$3$4')

      // Fix missing colons after property names
      .replace(/([{,]\s*"[^"]+")(\s*)([^:\s,}])/g, "$1:$2$3")

      // Fix values without quotes that should be strings
      .replace(/:(\s*)([a-zA-Z][a-zA-Z0-9_$]*)([,}])/g, ':"$2"$3')

      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, "$1")

      // Fix missing commas between properties
      .replace(/}(\s*){/g, "},\n$1{")
      .replace(/](\s*)\[/g, "],\n$1[")
      .replace(/"([^"]*)"(\s*)"([^"]*)"/g, '"$1",\n$2"$3"')

      // Fix missing commas in arrays
      .replace(/](\s*)\[/g, "],\n$1[")
      .replace(/([^,{[])\s*"([^"]+)"/g, (match, p1, p2) => {
        // Don't add comma after colons
        if (p1 === ":" || p1 === "{" || p1 === "[") return match
        return p1 + ',\n"' + p2 + '"'
      })

      // Fix unbalanced quotes
      .replace(/"([^"]*?)(?=[,}])/g, '"$1"')

      // Fix JavaScript-style comments
      .replace(/\/\/.*?\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")

      // Fix specific issues with qualifications property
      .replace(/"qualifications"\s*(\w+)/g, '"qualifications": $1')
      .replace(/"qualifications"\s*:\s*(\w+)/g, '"qualifications": {$1')

      // Fix specific case from the error
      .replace(/"strengths"\s*:\s*\[\s*"([^"]+)"\s*,\s*"weaknesses"/g, '"strengths": ["$1"], "weaknesses"')

    // Try to balance brackets and braces
    repaired = balanceBracketsAndBraces(repaired)

    return repaired
  } catch (error) {
    console.error("Error in aggressiveJSONRepair:", error)
    return jsonString // Return original if repair fails
  }
}

/**
 * Fixes missing colons after property names
 */
function fixMissingColons(json: string): string {
  // Find property names that aren't followed by a colon
  return json.replace(/("(?:\\.|[^"\\])*")(\s*)([^:\s,}])/g, "$1:$2$3")
}

/**
 * Fixes missing commas in arrays
 */
function fixMissingCommasInArrays(json: string): string {
  // Look for array elements not separated by commas
  return (
    json
      .replace(/\](\s*)\[/g, "],\n$1[")
      .replace(/(["\d\w}])\s*\[/g, "$1,\n[")
      .replace(/\](\s*)"/g, '],\n$1"')
      .replace(/(["\d\w}])(\s+)"/g, '$1,\n$2"')
      // Fix missing commas between array elements
      .replace(/("[^"]*")(\s+)("[^"]*")/g, "$1,$2$3")
  )
}

/**
 * Fixes missing commas in objects
 */
function fixMissingCommasInObjects(json: string): string {
  // Look for object properties not separated by commas
  return json
    .replace(/}(\s*){/g, "},\n$1{")
    .replace(/(["\d\w\]])\s*{/g, "$1,\n{")
    .replace(/}(\s*)"/g, '},\n$1"')
    .replace(/(["\d\w\]])(\s+)"/g, '$1,\n$2"')
}

/**
 * Fixes trailing commas in objects and arrays
 */
function fixTrailingCommas(json: string): string {
  // Fix trailing commas in objects
  json = json.replace(/,\s*}/g, "}")

  // Fix trailing commas in arrays
  json = json.replace(/,\s*\]/g, "]")

  return json
}

/**
 * Fixes missing commas between properties
 */
function fixMissingCommas(json: string): string {
  // Look for patterns where a property ends and another begins without a comma
  return json
    .replace(/}(\s*){/g, "},\n$1{")
    .replace(/](\s*)\[/g, "],\n$1[")
    .replace(/}(\s*)\[/g, "},\n$1[")
    .replace(/](\s*){/g, "],\n$1{")
    .replace(/"(\s*)"(?=\s*:)/g, '",\n$1"')
}

/**
 * Fixes unquoted property names
 */
function fixUnquotedPropertyNames(json: string): string {
  // Find property names that aren't quoted and quote them
  return json.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3')
}

/**
 * Fixes missing quotes around string values
 */
function fixMissingQuotes(json: string): string {
  // This is a simplified approach - a more robust solution would use a state machine
  return json.replace(/:(\s*)([a-zA-Z0-9_$]+)([,}])/g, ':"$2"$3')
}

/**
 * Attempts to fix issues at a specific position in the JSON
 */
function fixPositionSpecificIssue(json: string, position: number, errorMsg: string): string {
  try {
    // Get context around the error (50 chars before and after)
    const start = Math.max(0, position - 50)
    const end = Math.min(json.length, position + 50)
    const context = json.substring(start, end)

    console.log(`JSON error context around position ${position}: "${context}"`)

    // Check for specific error patterns
    if (errorMsg.includes("Expected ':' after property name")) {
      // Missing colon after property name
      return json.substring(0, position) + ":" + json.substring(position)
    }

    if (errorMsg.includes("Expected ',' or ']'")) {
      // Check if this is an unclosed array before a new property
      const beforeError = json.substring(Math.max(0, position - 100), position)
      const afterError = json.substring(position, Math.min(json.length, position + 100))

      // Check if we're in an array and a new property is starting
      if (beforeError.includes("[") && !beforeError.includes("]", beforeError.lastIndexOf("["))) {
        // If the next part looks like a property name, close the array
        if (afterError.match(/^\s*"[^"]+"\s*:/)) {
          return json.substring(0, position) + "]," + json.substring(position)
        }
      }

      // Otherwise just add a comma
      return json.substring(0, position) + "," + json.substring(position)
    }

    if (errorMsg.includes("Expected ',' or '}'")) {
      // Missing comma in object
      return json.substring(0, position) + "," + json.substring(position)
    }

    if (errorMsg.includes("Expected property name or '}'")) {
      // Unexpected character where property name should be
      return json.substring(0, position) + "}" + json.substring(position)
    }

    if (errorMsg.includes("Unexpected token")) {
      // Try to determine what's needed based on context
      const beforeError = json.substring(Math.max(0, position - 50), position)
      const afterError = json.substring(position, Math.min(json.length, position + 50))

      if (beforeError.match(/"[^"]*$/)) {
        // Unclosed quote before the error position
        return json.substring(0, position) + '"' + json.substring(position)
      }

      if (afterError.match(/^[^"]*"/)) {
        // Unclosed quote after the error position
        return json.substring(0, position) + '"' + json.substring(position)
      }

      // Check for unclosed arrays
      if (beforeError.includes("[") && !beforeError.includes("]", beforeError.lastIndexOf("["))) {
        // If we're in an array and hit an unexpected token, try closing the array
        return json.substring(0, position) + "]" + json.substring(position)
      }
    }

    // If we can't determine a specific fix, return the original
    return json
  } catch (error) {
    console.error("Error in fixPositionSpecificIssue:", error)
    return json // Return original if repair fails
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
 * Attempts to extract a valid JSON subset from malformed JSON
 */
function extractValidJSONSubset(json: string): string {
  try {
    // First, try to extract JSON if the string contains explanatory text
    const extractedJson = extractJsonFromText(json)
    if (extractedJson) {
      return JSON.stringify(extractedJson)
    }

    // Try to find the outermost complete JSON object
    const objectMatch = json.match(/({[\s\S]*})/)
    if (objectMatch) {
      try {
        JSON.parse(objectMatch[1])
        return objectMatch[1]
      } catch (e) {
        // If parsing fails, continue with other strategies
      }
    }

    // Try to find the outermost complete JSON array
    const arrayMatch = json.match(/(\[[\s\S]*\])/)
    if (arrayMatch) {
      try {
        JSON.parse(arrayMatch[1])
        return arrayMatch[1]
      } catch (e) {
        // If parsing fails, continue with other strategies
      }
    }

    // Try to construct a minimal valid object with the properties we can extract
    try {
      const result = {}

      // Extract skills
      const skillsMatch = json.match(/"skills"\s*:\s*({[^}]*})/)
      if (skillsMatch) {
        try {
          const skillsJson = fixMissingQuotes(skillsMatch[1])
          result.skills = JSON.parse(skillsJson)
        } catch (e) {
          // If parsing fails, set a default
          result.skills = { technical: [], soft: [] }
        }
      }

      // Extract other properties similarly
      const experienceMatch = json.match(/"experience"\s*:\s*(\[[^\]]*\])/)
      if (experienceMatch) {
        try {
          result.experience = JSON.parse(experienceMatch[1])
        } catch (e) {
          result.experience = []
        }
      }

      // Return the constructed object
      return JSON.stringify(result)
    } catch (e) {
      // If construction fails, return a minimal valid object
    }

    // Last resort: return a minimal valid JSON object
    return '{"error": "Could not extract valid JSON", "partial": true, "skills": {"technical": [], "soft": []}, "experience": [], "education": [], "summary": "", "strengths": [], "weaknesses": []}'
  } catch (error) {
    console.error("Error in extractValidJSONSubset:", error)
    return '{"error": "Could not extract valid JSON", "partial": true, "skills": {"technical": [], "soft": []}, "experience": [], "education": [], "summary": "", "strengths": [], "weaknesses": []}'
  }
}

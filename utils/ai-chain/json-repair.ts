/**
 * Super robust JSON repair function with enhanced array handling
 */
export function repairJSON(text: string): string {
  // Try to extract JSON-like content
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON-like content found")
  }

  let json = jsonMatch[0]

  // Step 1: Basic replacements
  // Replace single quotes with double quotes
  json = json.replace(/'/g, '"')

  // Step 2: Fix property names
  // Fix unquoted property names
  json = json.replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":')

  // Step 3: Fix array issues
  // First, identify array contexts to avoid false positives
  const arrayContexts = []
  let inString = false
  let arrayLevel = 0
  let arrayStart = -1

  for (let i = 0; i < json.length; i++) {
    const char = json[i]

    // Skip characters in strings
    if (char === '"' && (i === 0 || json[i - 1] !== "\\")) {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === "[") {
        if (arrayLevel === 0) {
          arrayStart = i
        }
        arrayLevel++
      } else if (char === "]") {
        arrayLevel--
        if (arrayLevel === 0 && arrayStart !== -1) {
          arrayContexts.push({
            start: arrayStart,
            end: i,
          })
          arrayStart = -1
        }
      }
    }
  }

  // Process each array context
  for (const context of arrayContexts) {
    const arrayContent = json.substring(context.start, context.end + 1)
    let fixedArrayContent = arrayContent

    // Fix missing commas between array elements
    fixedArrayContent = fixedArrayContent.replace(/\]([^,\]}])/g, "],$1")
    fixedArrayContent = fixedArrayContent.replace(/([^[,])"/g, '$1,"')
    fixedArrayContent = fixedArrayContent.replace(/(\d+|true|false|null)"/g, '$1,"')

    // Fix extra commas
    fixedArrayContent = fixedArrayContent.replace(/,\s*\]/g, "]")

    // Replace the original array content with fixed content
    json = json.substring(0, context.start) + fixedArrayContent + json.substring(context.end + 1)
  }

  // Step 4: Additional fixes
  // Fix trailing commas in objects
  json = json.replace(/,(\s*})/g, "$1")

  // Fix missing quotes around string values
  json = json.replace(/:(\s*)([a-zA-Z][a-zA-Z0-9_]*)/g, ':"$2"')

  // Fix arrays with trailing commas
  json = json.replace(/,\s*\]/g, "]")

  // Fix objects with trailing commas
  json = json.replace(/,\s*\}/g, "}")

  // Step 5: Handle specific array formatting issues
  // Fix missing commas between array elements (common issue)
  json = json.replace(/("[^"]*")\s*("[^"]*")/g, "$1,$2")
  json = json.replace(/(\d+)\s*("[^"]*")/g, "$1,$2")
  json = json.replace(/("[^"]*")\s*(\d+)/g, "$1,$2")
  json = json.replace(/(\d+)\s*(\d+)/g, "$1,$2")
  json = json.replace(/(true|false)\s*(true|false)/g, "$1,$2")
  json = json.replace(/("[^"]*")\s*(true|false)/g, "$1,$2")
  json = json.replace(/(true|false)\s*("[^"]*")/g, "$1,$2")

  // Step 6: Final cleanup
  // Fix object brackets with no content
  json = json.replace(/\{\s*\}/g, "{}")

  // Fix array brackets with no content
  json = json.replace(/\[\s*\]/g, "[]")

  return json
}

/**
 * Safely parses JSON with multiple fallback strategies
 */
export function safeJSONParse(text: string): any {
  // First, try direct parsing
  try {
    return JSON.parse(text)
  } catch (e) {
    // If direct parsing fails, try to extract JSON using regex
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (extractError) {
      // Extraction failed, continue to repair
    }

    // If extraction fails, try to repair the JSON
    try {
      const repairedJson = repairJSON(text)
      return JSON.parse(repairedJson)
    } catch (repairError) {
      // If repair fails, return null
      return null
    }
  }
}

/**
 * Creates a fallback result by extracting what we can from text
 */
export function createFallbackFromText(text: string, schema?: string): any {
  if (schema === "skills") {
    // Extract potential skills using regex
    const technicalSkillsMatch = text.match(/technical[^[]*\[(.*?)\]/i)
    const softSkillsMatch = text.match(/soft[^[]*\[(.*?)\]/i)

    const technicalSkills = technicalSkillsMatch
      ? technicalSkillsMatch[1]
          .split(/,\s*/)
          .map((s) => s.replace(/"/g, "").trim())
          .filter(Boolean)
      : []

    const softSkills = softSkillsMatch
      ? softSkillsMatch[1]
          .split(/,\s*/)
          .map((s) => s.replace(/"/g, "").trim())
          .filter(Boolean)
      : []

    return {
      technical: technicalSkills,
      soft: softSkills,
      tools: [],
      frameworks: [],
      languages: [],
      databases: [],
      methodologies: [],
      platforms: [],
      other: [],
    }
  }

  // Default fallback just returns an empty object
  return {}
}

/**
 * Manual extraction of key elements from text
 */
export function manualExtraction(text: string, schema: string): any {
  console.log(`Attempting manual extraction for schema: ${schema}`)

  if (schema === "skills") {
    const result = {
      technical: [],
      soft: [],
      tools: [],
      frameworks: [],
      languages: [],
      databases: [],
      methodologies: [],
      platforms: [],
      other: [],
    }

    // Try to extract technical skills
    try {
      const techSkillsRegex = /"technical"\s*:\s*\[(.*?)\]/s
      const techMatch = text.match(techSkillsRegex)
      if (techMatch && techMatch[1]) {
        const skillsText = techMatch[1].trim()
        const skills = skillsText
          .split(/,\s*/)
          .map((s) => s.replace(/^"/, "").replace(/"$/, "").trim())
          .filter(Boolean)
        result.technical = skills
      }
    } catch (e) {
      console.error("Error extracting technical skills:", e)
    }

    // Try to extract soft skills
    try {
      const softSkillsRegex = /"soft"\s*:\s*\[(.*?)\]/s
      const softMatch = text.match(softSkillsRegex)
      if (softMatch && softMatch[1]) {
        const skillsText = softMatch[1].trim()
        const skills = skillsText
          .split(/,\s*/)
          .map((s) => s.replace(/^"/, "").replace(/"$/, "").trim())
          .filter(Boolean)
        result.soft = skills
      }
    } catch (e) {
      console.error("Error extracting soft skills:", e)
    }

    return result
  }

  return {}
}

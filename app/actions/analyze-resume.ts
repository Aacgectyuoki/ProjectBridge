"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export type ResumeAnalysisResult = {
  skills: {
    technical: string[]
    soft: string[]
  }
  experience: {
    title: string
    company: string
    duration: string
    description: string
    keyAchievements: string[]
  }[]
  education: {
    degree: string
    institution: string
    year: string
  }[]
  summary: string
  strengths: string[]
  weaknesses: string[]
}

// Default empty structure to ensure consistent shape
const defaultAnalysisResult: ResumeAnalysisResult = {
  skills: {
    technical: [],
    soft: [],
  },
  experience: [],
  education: [],
  summary: "",
  strengths: [],
  weaknesses: [],
}

/**
 * Super robust JSON repair function with enhanced array handling
 */
function superRobustJSONRepair(jsonString: string): string {
  // First, try to extract just the JSON part if there's other text
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
  let repairedJSON = jsonMatch ? jsonMatch[0] : jsonString

  // Step 1: Basic replacements
  // Replace single quotes with double quotes
  repairedJSON = repairedJSON.replace(/'/g, '"')

  // Step 2: Fix property names
  // Fix unquoted property names
  repairedJSON = repairedJSON.replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":')

  // Step 3: Fix array issues
  // First, identify array contexts to avoid false positives
  const arrayContexts = []
  let inString = false
  let arrayLevel = 0
  let arrayStart = -1

  for (let i = 0; i < repairedJSON.length; i++) {
    const char = repairedJSON[i]

    // Skip characters in strings
    if (char === '"' && (i === 0 || repairedJSON[i - 1] !== "\\")) {
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
    const arrayContent = repairedJSON.substring(context.start, context.end + 1)
    let fixedArrayContent = arrayContent

    // Fix missing commas between array elements
    fixedArrayContent = fixedArrayContent.replace(/\]([^,\]}])/g, "],$1")
    fixedArrayContent = fixedArrayContent.replace(/([^[,])"/g, '$1,"')
    fixedArrayContent = fixedArrayContent.replace(/(\d+|true|false|null)"/g, '$1,"')

    // Fix extra commas
    fixedArrayContent = fixedArrayContent.replace(/,\s*\]/g, "]")

    // Replace the original array content with fixed content
    repairedJSON =
      repairedJSON.substring(0, context.start) + fixedArrayContent + repairedJSON.substring(context.end + 1)
  }

  // Step 4: Additional fixes
  // Fix trailing commas in objects
  repairedJSON = repairedJSON.replace(/,(\s*})/g, "$1")

  // Fix missing quotes around string values
  repairedJSON = repairedJSON.replace(/:(\s*)([a-zA-Z][a-zA-Z0-9_]*)/g, ':"$2"')

  // Fix arrays with trailing commas
  repairedJSON = repairedJSON.replace(/,\s*\]/g, "]")

  // Fix objects with trailing commas
  repairedJSON = repairedJSON.replace(/,\s*\}/g, "}")

  // Step 5: Handle specific array formatting issues
  // Fix missing commas between array elements (common issue)
  repairedJSON = repairedJSON.replace(/("[^"]*")\s*("[^"]*")/g, "$1,$2")
  repairedJSON = repairedJSON.replace(/(\d+)\s*("[^"]*")/g, "$1,$2")
  repairedJSON = repairedJSON.replace(/("[^"]*")\s*(\d+)/g, "$1,$2")
  repairedJSON = repairedJSON.replace(/(\d+)\s*(\d+)/g, "$1,$2")
  repairedJSON = repairedJSON.replace(/(true|false)\s*(true|false)/g, "$1,$2")
  repairedJSON = repairedJSON.replace(/("[^"]*")\s*(true|false)/g, "$1,$2")
  repairedJSON = repairedJSON.replace(/(true|false)\s*("[^"]*")/g, "$1,$2")

  // Step 6: Final cleanup
  // Fix object brackets with no content
  repairedJSON = repairedJSON.replace(/\{\s*\}/g, "{}")

  // Fix array brackets with no content
  repairedJSON = repairedJSON.replace(/\[\s*\]/g, "[]")

  return repairedJSON
}

/**
 * Fallback to a simpler structure when JSON parsing completely fails
 */
function createFallbackResult(text: string): ResumeAnalysisResult {
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

  // Extract summary if possible
  const summaryMatch = text.match(/summary[^"]*"([^"]*)"/)
  const summary = summaryMatch ? summaryMatch[1] : "Could not parse summary"

  return {
    skills: {
      technical: technicalSkills,
      soft: softSkills,
    },
    experience: [],
    education: [],
    summary: summary,
    strengths: [],
    weaknesses: ["Resume analysis was incomplete due to technical issues."],
  }
}

/**
 * Last resort: manual extraction of key elements
 */
function manualExtraction(text: string): ResumeAnalysisResult {
  console.log("Attempting manual extraction of resume data")

  const result = { ...defaultAnalysisResult }

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
      result.skills.technical = skills
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
      result.skills.soft = skills
    }
  } catch (e) {
    console.error("Error extracting soft skills:", e)
  }

  // Try to extract summary
  try {
    const summaryRegex = /"summary"\s*:\s*"([^"]*)"/
    const summaryMatch = text.match(summaryRegex)
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1].trim()
    }
  } catch (e) {
    console.error("Error extracting summary:", e)
  }

  return result
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  try {
    const prompt = `
  Analyze the following resume and extract key information in a structured format.
  Resume:
  ${resumeText}
  
  Please extract and return the following information in VALID JSON format:
  1. Skills (categorized as technical and soft skills)
  2. Work experience (including job title, company, duration, description, and key achievements)
  3. Education (degree, institution, graduation year)
  4. A brief professional summary
  5. Key strengths based on the resume
  6. Potential weaknesses or missing elements in the resume
  
  Format your response as valid JSON with the following structure exactly:
  {
    "skills": {
      "technical": ["skill1", "skill2"],
      "soft": ["skill1", "skill2"]
    },
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "duration": "Duration",
        "description": "Job description",
        "keyAchievements": ["achievement1", "achievement2"]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "institution": "Institution Name",
        "year": "Graduation Year"
      }
    ],
    "summary": "Professional summary",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"]
  }
  
  IMPORTANT: 
  - Ensure all JSON property names are in double quotes
  - All string values must be in double quotes
  - Arrays must have proper comma separation between elements
  - There should be no trailing commas in arrays or objects
  - Return only the JSON without any additional text or explanation
`

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.2,
      maxTokens: 2048,
    })

    // Parse the JSON response
    try {
      // First, try to parse the raw response
      let result: ResumeAnalysisResult
      let parsedSuccessfully = false
      let rawText = text

      try {
        result = JSON.parse(rawText) as ResumeAnalysisResult
        parsedSuccessfully = true
        console.log("Successfully parsed JSON directly")
      } catch (initialParseError) {
        console.log("Initial JSON parse failed, attempting to extract and repair...")

        // Try to extract JSON from the text if it might be wrapped in other content
        const jsonMatch = rawText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          rawText = jsonMatch[0]
          try {
            result = JSON.parse(rawText) as ResumeAnalysisResult
            parsedSuccessfully = true
            console.log("Successfully parsed extracted JSON")
          } catch (extractedParseError) {
            console.log("Extracted JSON parse failed, attempting super robust repair...")
          }
        }

        // If still not parsed, try to repair the JSON
        if (!parsedSuccessfully) {
          try {
            const repairedJSON = superRobustJSONRepair(rawText)
            result = JSON.parse(repairedJSON) as ResumeAnalysisResult
            parsedSuccessfully = true
            console.log("Successfully parsed after repairing JSON")
          } catch (repairParseError) {
            console.error("JSON repair failed:", repairParseError)

            // Try manual extraction as a last resort
            try {
              result = manualExtraction(rawText)
              parsedSuccessfully = true
              console.log("Successfully extracted data manually")
            } catch (manualExtractionError) {
              console.error("Manual extraction failed:", manualExtractionError)

              // Last resort: create a fallback result by extracting what we can
              console.log("Using fallback extraction method")
              result = createFallbackResult(rawText)
            }
          }
        }
      }

      // Ensure the result has the expected structure
      return {
        skills: {
          technical: result.skills?.technical || defaultAnalysisResult.skills.technical,
          soft: result.skills?.soft || defaultAnalysisResult.skills.soft,
        },
        experience: result.experience || defaultAnalysisResult.experience,
        education: result.education || defaultAnalysisResult.education,
        summary: result.summary || defaultAnalysisResult.summary,
        strengths: result.strengths || defaultAnalysisResult.strengths,
        weaknesses: result.weaknesses || defaultAnalysisResult.weaknesses,
      }
    } catch (parseError) {
      console.error("Error parsing Groq response:", parseError)
      console.error("Raw response:", text)
      return defaultAnalysisResult
    }
  } catch (error) {
    console.error("Error analyzing resume:", error)
    return defaultAnalysisResult
  }
}

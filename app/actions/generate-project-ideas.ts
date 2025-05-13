"use server"

// import { generateText } from "ai"
// import { LangChain } from "langchain"
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"
import { storeAnalysisData } from "@/utils/analysis-session-manager"

export type ProjectIdea = {
  id: string
  title: string
  description: string
  skillsAddressed: string[]
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  timeEstimate: string
  steps: string[]
  learningResources: {
    title: string
    url: string
    type: "Documentation" | "Tutorial" | "Course" | "Video" | "Book" | "Other"
  }[]
  tools: string[]
  githubRepoTemplate?: string
  deploymentOptions: string[]
  additionalNotes?: string
  tags: string[]
}

const defaultProjectIdea: ProjectIdea = {
  id: "",
  title: "",
  description: "",
  skillsAddressed: [],
  difficulty: "Intermediate",
  timeEstimate: "",
  steps: [],
  learningResources: [],
  tools: [],
  deploymentOptions: [],
  tags: [],
}

/**
 * Fixes specific JSON formatting issues we've observed in Groq responses
 */
function fixSpecificJsonIssues(text: string): string {
  let fixed = text

  // Fix the specific issue with the second project (algo-data)
  // Missing "tags" property name before the array
  fixed = fixed.replace(/"additionalNotes": "([^"]+)",\s*\[/g, '"additionalNotes": "$1", "tags": [')

  // Fix missing commas between objects in arrays
  fixed = fixed.replace(/\}(\s*)\{/g, "},\n{")

  // Fix URLs without proper string escaping
  fixed = fixed.replace(/"url":\s*([^"].+?)(,|\})/g, '"url": "$1"$2')

  return fixed
}

/**
 * Handles rate limit errors with exponential backoff
 */
async function withRateLimitRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let retries = 0
  let lastError: any

  while (retries < maxRetries) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Check if it's a rate limit error
      if (error.message && error.message.includes("Rate limit reached")) {
        const waitTime = Math.pow(2, retries) * 1000 + Math.random() * 1000
        console.log(`Rate limit reached, retrying in ${waitTime}ms... (Attempt ${retries + 1}/${maxRetries})`)

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        retries++
      } else {
        // Not a rate limit error, rethrow
        throw error
      }
    }
  }

  // If we've exhausted all retries
  throw lastError
}

/**
 * Safely parses JSON with multiple fallback strategies
 */
function safeJSONParse(text: string): ProjectIdea[] {
  // First, try to fix specific issues we know about
  const fixedText = fixSpecificJsonIssues(text)

  // Try to parse the fixed text
  try {
    return JSON.parse(fixedText) as ProjectIdea[]
  } catch (error) {
    console.log("Direct JSON parsing failed, trying to extract JSON...")

    // Try to extract JSON using regex
    try {
      const jsonMatch = fixedText.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ProjectIdea[]
      }
    } catch (extractError) {
      console.log("JSON extraction failed, trying to extract individual projects...")
    }

    // Try to extract individual projects
    try {
      const projects: ProjectIdea[] = []
      const projectMatches = fixedText.match(/\{\s*"id"[\s\S]*?("tags"[\s\S]*?\])\s*\}/g)

      if (projectMatches && projectMatches.length > 0) {
        for (const projectText of projectMatches) {
          try {
            const project = JSON.parse(projectText) as ProjectIdea
            projects.push(project)
          } catch (e) {
            console.log("Failed to parse individual project:", e)
          }
        }

        if (projects.length > 0) {
          return projects
        }
      }
    } catch (projectError) {
      console.log("Project extraction failed, creating fallback projects...")
    }

    // If all else fails, create fallback projects
    return createFallbackProjects(text)
  }
}

/**
 * Creates fallback projects when parsing fails
 */
function createFallbackProjects(text: string): ProjectIdea[] {
  // Extract project titles using regex
  const titleMatches = text.match(/"title":\s*"([^"]+)"/g)
  const descMatches = text.match(/"description":\s*"([^"]+)"/g)
  const skillsMatches = text.match(/"skillsAddressed":\s*\[(.*?)\]/g)

  const extractTitle = (match: string): string => {
    const titleMatch = match.match(/"title":\s*"([^"]+)"/)
    return titleMatch ? titleMatch[1] : "Project Idea"
  }

  const extractDescription = (match: string): string => {
    const descMatch = match.match(/"description":\s*"([^"]+)"/)
    return descMatch ? descMatch[1] : "A project to improve your skills."
  }

  const extractSkills = (match: string): string[] => {
    const skillsText = match.replace(/"skillsAddressed":\s*\[/, "").replace(/\]$/, "")
    const skills = skillsText.split(",").map((skill) => {
      const cleaned = skill.trim().replace(/^["']|["']$/g, "")
      return cleaned || "Relevant skill"
    })
    return skills.filter((skill) => skill.length > 0)
  }

  // Create projects from extracted data
  const fallbackProjects: ProjectIdea[] = []

  for (let i = 0; i < Math.min(3, Math.max(titleMatches?.length || 0, 1)); i++) {
    const title = titleMatches && titleMatches[i] ? extractTitle(titleMatches[i]) : `Project Idea ${i + 1}`
    const description =
      descMatches && descMatches[i]
        ? extractDescription(descMatches[i])
        : "A project to help you develop missing skills."
    const skills = skillsMatches && skillsMatches[i] ? extractSkills(skillsMatches[i]) : ["Relevant skill"]

    fallbackProjects.push({
      id: `project-${i + 1}`,
      title,
      description,
      skillsAddressed: skills,
      difficulty: "Intermediate",
      timeEstimate: "2-4 weeks",
      steps: [
        "Plan the project",
        "Set up development environment",
        "Implement core features",
        "Test and refine",
        "Deploy",
      ],
      learningResources: [
        {
          title: "Online Documentation",
          url: "https://example.com/docs",
          type: "Documentation",
        },
      ],
      tools: skills,
      deploymentOptions: ["Local development", "GitHub Pages"],
      tags: skills,
    })
  }

  // If we couldn't extract anything, create a generic project
  if (fallbackProjects.length === 0) {
    fallbackProjects.push({
      id: "fallback-1",
      title: "Skill Development Project",
      description: "A project to help you develop the missing skills identified in the job description.",
      skillsAddressed: ["Technical skills", "Problem solving"],
      difficulty: "Intermediate",
      timeEstimate: "2-4 weeks",
      steps: [
        "Plan the project",
        "Set up development environment",
        "Implement core features",
        "Test and refine",
        "Deploy",
      ],
      learningResources: [
        {
          title: "Online Documentation",
          url: "https://example.com/docs",
          type: "Documentation",
        },
      ],
      tools: ["Relevant technologies"],
      deploymentOptions: ["Local development", "GitHub Pages"],
      tags: ["Learning", "Development"],
    })
  }

  return fallbackProjects
}

export async function generateProjectIdeas(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
  roleFocus?: string
): Promise<ProjectIdea[]> {
  if (!resumeAnalysis || !jobAnalysis) {
    throw new Error("Missing resume or job data")
  }

  // flatten & identify missing skills same as before...
  const resumeSkills = [
    ...(resumeAnalysis.skills.technical || []),
    ...(resumeAnalysis.skills.soft || []),
    // …
  ]
  const required = jobAnalysis.requiredSkills || []
  const preferred = jobAnalysis.preferredSkills || []
  const allJobSkills = [...required, ...preferred].filter(Boolean)
  const missing = allJobSkills.filter(s => 
    !resumeSkills.some(rs => rs.toLowerCase().includes(s.toLowerCase()))
  )

  // 1) Build the prompt template using ChatPromptTemplate
  const promptTemplate = ChatPromptTemplate.fromTemplate(`
You are a project-idea generator. Given:

RESUME SKILLS:
{resumeSkills}

JOB REQUIRED SKILLS:
{required}

JOB PREFERRED SKILLS:
{preferred}

MISSING SKILLS:
{missing}

JOB RESPONSIBILITIES:
{responsibilities}

${roleFocus ? `ROLE FOCUS: ${roleFocus}` : ''}

Generate exactly 3 project ideas in JSON array format. Each item must have:
- id, title, description
- skillsAddressed (array)
- difficulty ("Beginner"/"Intermediate"/"Advanced")
- timeEstimate
- steps (array)
- learningResources (title, url, type)
- tools (array)
- deploymentOptions (array)
- additionalNotes?
- tags (array)

Return ONLY valid JSON (no prose, no markdown).`)

  // 2) Init LLM and create chain with pipe
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY!,
    temperature: 0.7,
  })
  
  // Create chain using LCEL pipe
  const chain = promptTemplate.pipe(llm)

  // 3) Call under your retry
  let raw: string
  try {
    const response = await withRateLimitRetry(
      () =>
        chain
          .invoke({
            resumeSkills: JSON.stringify(resumeSkills),
            required: JSON.stringify(required),
            preferred: JSON.stringify(preferred),
            missing: JSON.stringify(missing),
            responsibilities: JSON.stringify(jobAnalysis.responsibilities || []),
            roleFocus: roleFocus || "",
          })
          .then(result => ({ text: result.content })),
      5
    )
    raw = Array.isArray(response.text)
      ? response.text.map(item => (typeof item === "string" ? item : (item?.text ?? ""))).join("")
      : (typeof response.text === "string" ? response.text : (response.text?.text ?? ""))
  } catch (err) {
    console.error("LLM error, falling back:", err)
    raw = "[]"
  }

  // 4) Clean & parse
  const cleaned = raw
    .trim()
    .replace(/^.*?(\[)/, "[") // Remove 's' flag for compatibility
    .replace(/(\])[\s\S]*$/, "]")
  let projects = safeJSONParse(cleaned)
  if (!projects || projects.length === 0) {
    projects = createFallbackProjects(raw)
  }

  // 5) Store & return
  storeAnalysisData("projectIdeas", projects)
  return projects.map((p, i) => ({
    ...defaultProjectIdea,
    ...p,
    id: p.id || `project-${i + 1}`,
  }))
}
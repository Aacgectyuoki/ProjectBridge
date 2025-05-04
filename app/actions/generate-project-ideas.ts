"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
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
  roleFocus?: string,
): Promise<ProjectIdea[]> {
  try {
    // Validate input data
    if (!resumeAnalysis || !jobAnalysis) {
      console.error("Missing resume or job analysis data:", { resumeAnalysis, jobAnalysis })
      throw new Error("Missing resume or job data")
    }

    // Normalize the input data to handle different log structures
    const resumeSkills = [
      ...(resumeAnalysis.skills?.technical || []),
      ...(resumeAnalysis.skills?.soft || []),
      ...(resumeAnalysis.skills?.tools || []),
      ...(resumeAnalysis.skills?.frameworks || []),
      ...(resumeAnalysis.skills?.languages || []),
      ...(resumeAnalysis.skills?.databases || []),
      ...(resumeAnalysis.skills?.platforms || []),
    ]

    // Extract required skills from job, handling different data structures
    const jobRequiredSkills = jobAnalysis.requiredSkills || []
    const jobPreferredSkills = jobAnalysis.preferredSkills || []

    // Handle alternative data structures
    const technicalSkills = (jobAnalysis as any).technicalSkills || []
    const softSkills = (jobAnalysis as any).softSkills || []

    const jobSkills = [...jobRequiredSkills, ...jobPreferredSkills, ...technicalSkills, ...softSkills].filter(Boolean) // Remove any undefined/null values

    // Identify missing skills (skills in job but not in resume)
    const missingSkills = jobSkills.filter(
      (skill) =>
        !resumeSkills.some(
          (resumeSkill) =>
            resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(resumeSkill.toLowerCase()),
        ),
    )

    // Create a prompt for the AI
    const prompt = `
      I need to generate 3 project ideas for a job seeker who wants to develop skills for a ${jobAnalysis.title || "tech"} role.

      RESUME SKILLS:
      ${resumeSkills.join(", ")}

      JOB REQUIRED SKILLS:
      ${jobRequiredSkills.join(", ") || "Not specified"}

      JOB PREFERRED SKILLS:
      ${jobPreferredSkills.join(", ") || "Not specified"}

      MISSING SKILLS THAT NEED DEVELOPMENT:
      ${missingSkills.join(", ")}

      JOB RESPONSIBILITIES:
      ${jobAnalysis.responsibilities?.join(", ") || "Not specified"}

      ${roleFocus ? `ROLE FOCUS: ${roleFocus}` : ""}

      Please generate 3 detailed project ideas that will help the job seeker develop the missing skills and prepare for the responsibilities of this role. Each project should:
      1. Be realistic and achievable (not too large in scope)
      2. Focus primarily on the missing skills
      3. Be relevant to the job responsibilities
      4. Include clear steps to complete
      5. Include learning resources
      6. Have a reasonable time estimate based on the difficulty
      7. Include deployment options

      For each project, provide the following information in a structured JSON format:
      - id: A unique identifier (use a short string)
      - title: A clear, descriptive title
      - description: A detailed description of the project
      - skillsAddressed: An array of skills this project will help develop
      - difficulty: One of "Beginner", "Intermediate", or "Advanced"
      - timeEstimate: Estimated time to complete (e.g., "2-3 weeks")
      - steps: An array of steps to complete the project
      - learningResources: An array of resources with title, url, and type
      - tools: An array of tools or technologies to use
      - deploymentOptions: An array of ways to deploy or showcase the project
      - additionalNotes: Any additional helpful information
      - tags: An array of relevant tags for the project

      IMPORTANT: Ensure all JSON property names are in double quotes, and all string values are in double quotes. Do not use single quotes in the JSON. Make sure there are commas between array elements and object properties, but no trailing commas.

      Return only the JSON array of 3 project ideas without any additional text or explanation.
    `

    // Use rate limit retry wrapper
    const { text } = await withRateLimitRetry(async () => {
      return await generateText({
        model: groq("llama3-70b-8192"),
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
      })
    }, 5) // Allow up to 5 retries

    console.log("Raw Groq response:", text)

    // Parse the JSON response using our safe parser
    try {
      const result = safeJSONParse(text)

      // Store the result with session isolation
      storeAnalysisData("projectIdeas", result)

      // Ensure each project has the expected structure
      return result.map((project: any, index: number) => ({
        id: project.id || `project-${index + 1}`,
        title: project.title || defaultProjectIdea.title,
        description: project.description || defaultProjectIdea.description,
        skillsAddressed: project.skillsAddressed || defaultProjectIdea.skillsAddressed,
        difficulty: project.difficulty || defaultProjectIdea.difficulty,
        timeEstimate: project.timeEstimate || defaultProjectIdea.timeEstimate,
        steps: project.steps || defaultProjectIdea.steps,
        learningResources: project.learningResources || defaultProjectIdea.learningResources,
        tools: project.tools || defaultProjectIdea.tools,
        githubRepoTemplate: project.githubRepoTemplate,
        deploymentOptions: project.deploymentOptions || defaultProjectIdea.deploymentOptions,
        additionalNotes: project.additionalNotes,
        tags: project.tags || defaultProjectIdea.tags,
      }))
    } catch (parseError) {
      console.error("Error parsing Groq response:", parseError)
      console.error("Raw response:", text)
      return createFallbackProjects(text)
    }
  } catch (error) {
    console.error("Error generating project ideas:", error)
    throw error // Re-throw to allow proper error handling by the caller
  }
}

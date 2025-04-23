"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"

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

export async function generateProjectIdeas(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
  roleFocus?: string,
): Promise<ProjectIdea[]> {
  try {
    // Extract skills from resume
    const resumeSkills = [...(resumeAnalysis.skills?.technical || []), ...(resumeAnalysis.skills?.soft || [])]

    // Extract required skills from job
    const jobSkills = [...(jobAnalysis.requiredSkills || []), ...(jobAnalysis.preferredSkills || [])]

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
      ${jobAnalysis.requiredSkills?.join(", ") || "Not specified"}

      JOB PREFERRED SKILLS:
      ${jobAnalysis.preferredSkills?.join(", ") || "Not specified"}

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

      Return only the JSON array of 3 project ideas without any additional text or explanation.
    `

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.7,
      maxTokens: 4000,
    })

    // Parse the JSON response
    try {
      // First, try to parse the raw response
      let result: ProjectIdea[]

      try {
        result = JSON.parse(text) as ProjectIdea[]
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]) as ProjectIdea[]
        } else {
          throw new Error("Could not extract valid JSON from response")
        }
      }

      // Ensure each project has the expected structure
      return result.map((project, index) => ({
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
      return []
    }
  } catch (error) {
    console.error("Error generating project ideas:", error)
    return []
  }
}

"use server"

import { z } from "zod"
import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"
import type { SkillGapAnalysisResult } from "./analyze-skills-gap"
import { Chain, PromptTemplate, OutputParser, generateTextWithFallback } from "@/utils/ai-chain"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"
import { performance } from "perf_hooks"

// Define the schema for skill gap analysis
const skillGapSchema = z.object({
  matchPercentage: z.number(),
  missingSkills: z.array(
    z.object({
      name: z.string(),
      level: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      context: z.string(),
    }),
  ),
  missingQualifications: z.array(
    z.object({
      description: z.string(),
      importance: z.enum(["Required", "Preferred"]),
      alternative: z.string(),
    }),
  ),
  missingExperience: z.array(
    z.object({
      area: z.string(),
      yearsNeeded: z.string(),
      suggestion: z.string(),
    }),
  ),
  matchedSkills: z.array(
    z.object({
      name: z.string(),
      proficiency: z.string(),
      relevance: z.enum(["High", "Medium", "Low"]),
    }),
  ),
  recommendations: z.array(
    z.object({
      type: z.enum(["Project", "Course", "Certification", "Experience"]),
      description: z.string(),
      timeToAcquire: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
    }),
  ),
  summary: z.string(),
})

// Create the prompt template
const skillGapPromptTemplate = new PromptTemplate(
  `
  You are an expert career advisor and skills analyst. Your task is to analyze the parsed data from a resume and a job description, 
  then identify the gaps between the candidate's qualifications and the job requirements.
  
  # RESUME ANALYSIS:
  {resume_analysis}
  
  # JOB DESCRIPTION ANALYSIS:
  {job_analysis}
  
  Perform a detailed analysis to identify:
  1. Skills mentioned in the job description that are missing from the resume
  2. Qualifications required by the job that the candidate doesn't have
  3. Experience requirements that the candidate doesn't meet
  4. Skills the candidate has that match the job requirements
  5. Specific recommendations to bridge the identified gaps
  
  For each missing skill, determine its priority (High/Medium/Low) based on:
  - How frequently it's mentioned in the job description
  - Whether it's listed as required or preferred
  - Its placement in the job description (skills mentioned early are often more important)
  
  For each recommendation, suggest specific actions the candidate can take to acquire the missing skills or qualifications.
  
  Calculate an overall match percentage based on how well the candidate's profile matches the job requirements.
  
  Format your response as valid JSON with the following structure exactly:
  {
    "matchPercentage": number,
    "missingSkills": [
      {
        "name": "Skill Name",
        "level": "Required proficiency level",
        "priority": "High/Medium/Low",
        "context": "How this skill is used in the job"
      }
    ],
    "missingQualifications": [
      {
        "description": "Description of the qualification",
        "importance": "Required/Preferred",
        "alternative": "Possible alternative qualification the candidate might have"
      }
    ],
    "missingExperience": [
      {
        "area": "Experience area",
        "yearsNeeded": "Years of experience needed",
        "suggestion": "How to gain this experience"
      }
    ],
    "matchedSkills": [
      {
        "name": "Skill Name",
        "proficiency": "Candidate's proficiency level",
        "relevance": "High/Medium/Low"
      }
    ],
    "recommendations": [
      {
        "type": "Project/Course/Certification/Experience",
        "description": "Detailed description of the recommendation",
        "timeToAcquire": "Estimated time to acquire this skill",
        "priority": "High/Medium/Low"
      }
    ],
    "summary": "A concise summary of the overall analysis and key recommendations"
  }
  
  Return only the JSON without any additional text or explanation.
`,
  "skill-gap-analysis-prompt",
)

// Create the output parser
const skillGapParser = new OutputParser(skillGapSchema, "skill-gap-analysis-parser")

// Function to generate fallback analysis (same as before)
function generateFallbackAnalysis(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
): SkillGapAnalysisResult {
  // Extract skills from resume
  const resumeSkills = [
    ...(resumeAnalysis.skills?.technical || []),
    ...(resumeAnalysis.skills?.soft || []),
    ...(resumeAnalysis.skills?.tools || []),
    ...(resumeAnalysis.skills?.frameworks || []),
    ...(resumeAnalysis.skills?.languages || []),
    ...(resumeAnalysis.skills?.databases || []),
    ...(resumeAnalysis.skills?.methodologies || []),
    ...(resumeAnalysis.skills?.platforms || []),
  ].map((skill) => skill.toLowerCase())

  // Extract required skills from job
  const requiredSkills = (jobAnalysis.requiredSkills || []).map((skill) => skill.toLowerCase())
  const preferredSkills = (jobAnalysis.preferredSkills || []).map((skill) => skill.toLowerCase())

  // Find missing required skills
  const missingRequiredSkills = requiredSkills.filter(
    (skill) => !resumeSkills.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill)),
  )

  // Find missing preferred skills
  const missingPreferredSkills = preferredSkills.filter(
    (skill) => !resumeSkills.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill)),
  )

  // Find matched skills
  const matchedSkills = [...requiredSkills, ...preferredSkills].filter((skill) =>
    resumeSkills.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill)),
  )

  // Calculate match percentage
  const totalJobSkills = requiredSkills.length + preferredSkills.length
  const matchPercentage = totalJobSkills > 0 ? Math.round((matchedSkills.length / totalJobSkills) * 100) : 0

  // Generate missing skills array
  const missingSkills = [
    ...missingRequiredSkills.map((skill) => ({
      name: skill,
      level: "Intermediate to Advanced",
      priority: "High" as const,
      context: `This skill is listed as required in the job description.`,
    })),
    ...missingPreferredSkills.map((skill) => ({
      name: skill,
      level: "Beginner to Intermediate",
      priority: "Medium" as const,
      context: `This skill is listed as preferred in the job description.`,
    })),
  ]

  // Generate recommendations based on missing skills
  const recommendations = missingSkills.slice(0, 5).map((skill) => ({
    type: Math.random() > 0.5 ? "Project" : ("Course" as const),
    description: `Learn ${skill.name} through ${Math.random() > 0.5 ? "practical projects" : "structured courses"}`,
    timeToAcquire: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3) + 3} months`,
    priority: skill.priority,
  }))

  return {
    matchPercentage,
    missingSkills,
    missingQualifications: [],
    missingExperience: [],
    matchedSkills: matchedSkills.map((skill) => ({
      name: skill,
      proficiency: "Demonstrated",
      relevance: "High" as const,
    })),
    recommendations,
    summary: `You match approximately ${matchPercentage}% of the job requirements. Focus on acquiring the missing required skills first, particularly ${missingRequiredSkills.slice(0, 3).join(", ")}.`,
  }
}

/**
 * Analyzes the skills gap between a resume and job description using a chain-based approach
 * @param resumeAnalysis Resume analysis result
 * @param jobAnalysis Job analysis result
 * @returns Skill gap analysis result
 */
export async function analyzeSkillsGapWithChain(
  resumeAnalysis: ResumeAnalysisResult,
  jobAnalysis: JobAnalysisResult,
): Promise<SkillGapAnalysisResult> {
  const startTime = performance.now()

  // Check if we have a cached result
  const cacheKey = `skillGap_${JSON.stringify(resumeAnalysis.skills)}_${JSON.stringify(jobAnalysis.requiredSkills)}`

  try {
    // Try to get from cache first (if in browser environment)
    if (typeof window !== "undefined") {
      const cachedResult = localStorage.getItem(cacheKey)
      if (cachedResult) {
        try {
          console.log("Using cached skill gap analysis result")
          return JSON.parse(cachedResult) as SkillGapAnalysisResult
        } catch (e) {
          console.warn("Failed to parse cached result", e)
          // Continue with API call if parsing fails
        }
      }
    }

    // Create the chain
    const skillGapChain = new Chain<any>("skill-gap-analysis-chain")
      // Step 1: Prepare input data
      .addStep(async (input) => {
        // Map technicalSkills to requiredSkills and softSkills to preferredSkills if needed
        const processedJobAnalysis = { ...input.jobAnalysis }

        if (!processedJobAnalysis.requiredSkills && processedJobAnalysis.technicalSkills) {
          processedJobAnalysis.requiredSkills = processedJobAnalysis.technicalSkills
        }

        if (!processedJobAnalysis.preferredSkills && processedJobAnalysis.softSkills) {
          processedJobAnalysis.preferredSkills = processedJobAnalysis.softSkills
        }

        // Ensure arrays exist even if undefined
        if (!processedJobAnalysis.requiredSkills) processedJobAnalysis.requiredSkills = []
        if (!processedJobAnalysis.preferredSkills) processedJobAnalysis.preferredSkills = []

        return {
          ...input,
          processedJobAnalysis,
          resumeAnalysis: input.resumeAnalysis,
        }
      }, "prepare-input")

      // Step 2: Format the prompt
      .addStep(async (input) => {
        const prompt = skillGapPromptTemplate.format({
          resume_analysis: JSON.stringify(input.resumeAnalysis, null, 2),
          job_analysis: JSON.stringify(input.processedJobAnalysis, null, 2),
        })

        return { ...input, prompt }
      }, "format-prompt")

      // Step 3: Generate text with fallback
      .addStep(async (input) => {
        try {
          const text = await generateTextWithFallback(input.prompt, {
            temperature: 0.2,
            maxTokens: 3000,
          })

          return { ...input, rawResponse: text }
        } catch (error) {
          console.error("Error generating text:", error)
          throw error
        }
      }, "generate-text")

      // Step 4: Parse the output
      .addStep(async (input) => {
        try {
          const result = await skillGapParser.parse(input.rawResponse)
          return { ...input, result }
        } catch (error) {
          console.error("Failed to parse skill gap analysis:", error)
          console.log("Falling back to rule-based approach")

          // Fall back to rule-based approach
          const fallbackResult = generateFallbackAnalysis(input.resumeAnalysis, input.processedJobAnalysis)
          return { ...input, result: fallbackResult, usedFallback: true }
        }
      }, "parse-output")

      // Step 5: Cache the result
      .addStep(async (input) => {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(input.result))
            console.log("Cached skill gap analysis result")
          } catch (e) {
            console.warn("Failed to cache result", e)
          }
        }

        return input
      }, "cache-result")

    // Run the chain
    const output = await skillGapChain.run({
      resumeAnalysis,
      jobAnalysis,
    })

    const duration = performance.now() - startTime
    console.log(`Completed skill gap analysis in ${duration.toFixed(2)}ms`)

    // Log the analysis result
    EnhancedSkillsLogger.logExtractedSkills(
      "skill-gap-analysis",
      {
        technical: output.result.missingSkills.map((skill) => skill.name),
        soft: [],
      },
      output.usedFallback ? "fallback-analysis" : "ai-analysis",
      duration,
    )

    return output.result
  } catch (error) {
    const duration = performance.now() - startTime
    console.error(`Error analyzing skills gap (${duration.toFixed(2)}ms):`, error)

    // Log the error
    EnhancedSkillsLogger.logExtractedSkills("skill-gap-analysis-error", { technical: [], soft: [] }, "error", duration)

    throw error
  }
}

"use server"

import type { ResumeAnalysisResult } from "./analyze-resume"
import type { JobAnalysisResult } from "./analyze-job-description"
import { performEnhancedSkillAnalysis } from "@/utils/enhanced-skill-analysis"

export async function performEnhancedAnalysis(resumeAnalysis: ResumeAnalysisResult, jobAnalysis: JobAnalysisResult) {
  try {
    return await performEnhancedSkillAnalysis(resumeAnalysis, jobAnalysis)
  } catch (error) {
    console.error("Error performing enhanced analysis:", error)
    throw new Error("Failed to perform enhanced skill analysis")
  }
}

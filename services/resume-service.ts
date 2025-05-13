import { createClient } from "@supabase/supabase-js"
import type { Resume, ResumeAnalysis, ResumeSkill } from "../types/database-schema"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Save a resume to the database
 */
export async function saveResume(
  userId: string,
  title: string,
  content: string,
  fileName?: string,
  fileType?: string,
  fileUrl?: string,
): Promise<Resume | null> {
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title,
      content,
      file_name: fileName,
      file_type: fileType,
      file_url: fileUrl,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving resume:", error)
    return null
  }

  return data as Resume
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(userId: string): Promise<Resume[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting user resumes:", error)
    return []
  }

  return data as Resume[]
}

/**
 * Get a resume by ID
 */
export async function getResumeById(resumeId: string): Promise<Resume | null> {
  const { data, error } = await supabase.from("resumes").select("*").eq("id", resumeId).single()

  if (error) {
    console.error("Error getting resume:", error)
    return null
  }

  return data as Resume
}

/**
 * Save resume analysis results
 */
export async function saveResumeAnalysis(
  resumeId: string,
  sessionId: string,
  analysisResult: any,
): Promise<ResumeAnalysis | null> {
  const { data, error } = await supabase
    .from("resume_analyses")
    .insert({
      resume_id: resumeId,
      session_id: sessionId,
      analysis_result: analysisResult,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving resume analysis:", error)
    return null
  }

  // Update the resume's last_analyzed timestamp
  await supabase.from("resumes").update({ last_analyzed: new Date().toISOString() }).eq("id", resumeId)

  return data as ResumeAnalysis
}

/**
 * Save extracted skills from a resume
 */
export async function saveResumeSkills(
  resumeAnalysisId: string,
  skills: Array<{
    skillId?: string
    skillName: string
    category: string
    confidence?: number
    context?: string
  }>,
): Promise<ResumeSkill[]> {
  const skillsToInsert = skills.map((skill) => ({
    resume_analysis_id: resumeAnalysisId,
    skill_id: skill.skillId,
    skill_name: skill.skillName,
    category: skill.category,
    confidence: skill.confidence || 1.0,
    context: skill.context,
  }))

  const { data, error } = await supabase.from("resume_skills").insert(skillsToInsert).select()

  if (error) {
    console.error("Error saving resume skills:", error)
    return []
  }

  return data as ResumeSkill[]
}

/**
 * Get the latest analysis for a resume
 */
export async function getLatestResumeAnalysis(resumeId: string): Promise<ResumeAnalysis | null> {
  const { data, error } = await supabase
    .from("resume_analyses")
    .select("*")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error getting latest resume analysis:", error)
    return null
  }

  return data as ResumeAnalysis
}

/**
 * Get skills for a resume analysis
 */
export async function getResumeSkills(resumeAnalysisId: string): Promise<ResumeSkill[]> {
  const { data, error } = await supabase.from("resume_skills").select("*").eq("resume_analysis_id", resumeAnalysisId)

  if (error) {
    console.error("Error getting resume skills:", error)
    return []
  }

  return data as ResumeSkill[]
}

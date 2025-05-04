// User-related types
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
  last_login?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  default_role_focus?: string
  notification_settings?: {
    email_notifications: boolean
    analysis_complete: boolean
    new_features: boolean
  }
  theme?: "light" | "dark" | "system"
}

// Resume-related types
export interface Resume {
  id: string
  user_id: string
  title: string
  content: string
  file_name?: string
  file_type?: string
  file_url?: string
  created_at: string
  updated_at: string
  last_analyzed?: string
}

export interface ResumeAnalysis {
  id: string
  resume_id: string
  session_id: string
  analysis_result: any // The full analysis result JSON
  created_at: string
  extracted_skills: ResumeSkill[]
}

export interface ResumeSkill {
  id: string
  resume_analysis_id: string
  skill_id: string
  skill_name: string
  category: string
  confidence: number
  context?: string // Where in the resume this was found
  created_at: string
}

// Job-related types
export interface JobDescription {
  id: string
  user_id: string
  title: string
  company?: string
  content: string
  created_at: string
  updated_at: string
  last_analyzed?: string
}

export interface JobAnalysis {
  id: string
  job_description_id: string
  session_id: string
  analysis_result: any // The full analysis result JSON
  created_at: string
  extracted_skills: JobSkill[]
}

export interface JobSkill {
  id: string
  job_analysis_id: string
  skill_id: string
  skill_name: string
  category: string
  is_required: boolean
  confidence: number
  context?: string // Where in the job description this was found
  created_at: string
}

// Match-related types
export interface SkillMatch {
  id: string
  session_id: string
  resume_id: string
  job_description_id: string
  match_percentage: number
  created_at: string
  matched_skills: MatchedSkill[]
  missing_skills: MissingSkill[]
}

export interface MatchedSkill {
  id: string
  skill_match_id: string
  skill_id: string
  skill_name: string
  category: string
  resume_context?: string
  job_context?: string
  match_type: "exact" | "semantic" | "related"
  confidence: number
  created_at: string
}

export interface MissingSkill {
  id: string
  skill_match_id: string
  skill_id: string
  skill_name: string
  category: string
  is_required: boolean
  job_context?: string
  created_at: string
}

// Project recommendation types
export interface ProjectRecommendation {
  id: string
  skill_match_id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimated_hours: number
  skills_addressed: string[]
  resources: ProjectResource[]
  created_at: string
}

export interface ProjectResource {
  id: string
  project_recommendation_id: string
  title: string
  url: string
  type: "tutorial" | "documentation" | "course" | "article" | "video" | "github"
  created_at: string
}

// Analysis session types
export interface AnalysisSession {
  id: string
  user_id?: string
  session_token: string
  resume_id?: string
  job_description_id?: string
  status: "in_progress" | "completed" | "failed"
  created_at: string
  completed_at?: string
  error?: string
}

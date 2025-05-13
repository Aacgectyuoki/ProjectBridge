export type JobAnalysisResult = {
  title: string
  requiredSkills: string[]
  preferredSkills: string[]
  qualifications?: { required: string[]; preferred?: string[] }
  experience?: { years: string }
  // …etc
}
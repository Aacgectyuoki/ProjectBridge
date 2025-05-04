"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createAnalysisSession, getAnalysisData, storeAnalysisData } from "@/utils/analysis-session-manager"

type AnalysisState = {
  sessionId: string | null
  resumeAnalysis: any | null
  jobAnalysis: any | null
  skillGapAnalysis: any | null
  projectIdeas: any[] | null
  isAnalyzing: boolean
  resetState: () => void
  setResumeAnalysis: (data: any) => void
  setJobAnalysis: (data: any) => void
  setSkillGapAnalysis: (data: any) => void
  setProjectIdeas: (data: any[]) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
}

const AnalysisStateContext = createContext<AnalysisState | undefined>(undefined)

export function AnalysisStateProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [resumeAnalysis, setResumeAnalysisState] = useState<any | null>(null)
  const [jobAnalysis, setJobAnalysisState] = useState<any | null>(null)
  const [skillGapAnalysis, setSkillGapAnalysisState] = useState<any | null>(null)
  const [projectIdeas, setProjectIdeasState] = useState<any[] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Initialize session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSessionId = localStorage.getItem("currentAnalysisSession")
      if (storedSessionId) {
        setSessionId(storedSessionId)

        // Load data from session storage
        const resumeData = getAnalysisData("resumeAnalysis", null)
        const jobData = getAnalysisData("jobAnalysis", null)
        const gapData = getAnalysisData("skillGapAnalysis", null)
        const projectData = getAnalysisData("projectIdeas", null)

        if (resumeData) setResumeAnalysisState(resumeData)
        if (jobData) setJobAnalysisState(jobData)
        if (gapData) setSkillGapAnalysisState(gapData)
        if (projectData) setProjectIdeasState(projectData)
      } else {
        // Create new session if none exists
        const newSessionId = createAnalysisSession()
        setSessionId(newSessionId)
      }
    }
  }, [])

  // Reset all state
  const resetState = () => {
    const newSessionId = createAnalysisSession()
    setSessionId(newSessionId)
    setResumeAnalysisState(null)
    setJobAnalysisState(null)
    setSkillGapAnalysisState(null)
    setProjectIdeasState(null)
    setIsAnalyzing(false)
  }

  // Set resume analysis with storage
  const setResumeAnalysis = (data: any) => {
    setResumeAnalysisState(data)
    storeAnalysisData("resumeAnalysis", data)
  }

  // Set job analysis with storage
  const setJobAnalysis = (data: any) => {
    setJobAnalysisState(data)
    storeAnalysisData("jobAnalysis", data)
  }

  // Set skill gap analysis with storage
  const setSkillGapAnalysis = (data: any) => {
    setSkillGapAnalysisState(data)
    storeAnalysisData("skillGapAnalysis", data)
  }

  // Set project ideas with storage
  const setProjectIdeas = (data: any[]) => {
    setProjectIdeasState(data)
    storeAnalysisData("projectIdeas", data)
  }

  return (
    <AnalysisStateContext.Provider
      value={{
        sessionId,
        resumeAnalysis,
        jobAnalysis,
        skillGapAnalysis,
        projectIdeas,
        isAnalyzing,
        resetState,
        setResumeAnalysis,
        setJobAnalysis,
        setSkillGapAnalysis,
        setProjectIdeas,
        setIsAnalyzing,
      }}
    >
      {children}
    </AnalysisStateContext.Provider>
  )
}

export function useAnalysisState() {
  const context = useContext(AnalysisStateContext)
  if (context === undefined) {
    throw new Error("useAnalysisState must be used within an AnalysisStateProvider")
  }
  return context
}

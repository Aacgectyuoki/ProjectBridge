"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight } from "lucide-react"
import { ResumeUpload } from "@/components/resume-upload"
import { JobDescriptionInput } from "@/components/job-description-input"
import { ResumeAnalysisResults } from "@/components/resume-analysis-results"
import { JobAnalysisResults } from "@/components/job-analysis-results"
import { SkillsSummary } from "@/components/skills-summary"
import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"
import { forceNewSession } from "@/utils/analysis-session-manager"
import { toast } from "@/components/ui/use-toast"
import { validateResume } from "@/utils/resume-validator"
import { ResumeValidatorResults } from "@/components/resume-validator-results"
import {
  synchronizeSessionData,
  recoverMissingData,
  storeCompatibleAnalysisData,
} from "@/utils/analysis-session-manager"
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { UserSession } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession['user']>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(1)
  const [activeTab, setActiveTab] = useState("resume")
  const [resumeData, setResumeData] = useState<{ analysis: ResumeAnalysisResult } | null>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResult | null>(null)
  const [jobData, setJobData] = useState<{ analysis?: JobAnalysisResult } | null>(null)
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysisResult | null>(null)
  const [fileSelected, setFileSelected] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [showSkillsSummary, setShowSkillsSummary] = useState(false)
  const [resumeText, setResumeText] = useState("")
  const [validationResults, setValidationResults] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user, error } = await supabase.auth.getUser().then(({ data }) => ({
          user: data.user,
          error: null,
        }))

        if (error || !user) {
          throw error || new Error('No user found')
        }

        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  useEffect(() => {
    try {
      console.log("Dashboard mounted, initializing session")

      if (window.location.pathname === "/dashboard" && !window.location.search.includes("keepSession")) {
        console.log("Creating new session")
        forceNewSession()
      }

      synchronizeSessionData()
      recoverMissingData()

      console.log("Session initialization complete")
    } catch (error) {
      console.error("Error during dashboard initialization:", error)
      toast({
        title: "Initialization Error",
        description: "There was a problem loading your session data. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [])

  const handleResumeUpload = (text: string | { analysis: ResumeAnalysisResult }) => {
    try {
      console.log("Resume upload handler called")

      const isTextOnly = typeof text === "string"
      console.log("Is text only:", isTextOnly)

      if (isTextOnly) {
        setResumeText(text as string)
        setFileUploaded(true)
        setActiveStep(2)

        const results = validateResume(text as string)
        setValidationResults(results)

        try {
          storeCompatibleAnalysisData("resumeAnalysis", results)
          storeCompatibleAnalysisData("resumeText", text)
          console.log("Resume text stored successfully")
        } catch (storageError) {
          console.error("Error storing resume data:", storageError)
        }

        console.log("Resume Text Analysis Complete:")
        console.log("Technical Skills:", results.skills?.technical || [])
        console.log("Soft Skills:", results.skills?.soft || [])

        return
      }

      setResumeData(text)
      setFileUploaded(true)
      if ('analysis' in text) {
        setResumeAnalysis(text.analysis)
        setShowSkillsSummary(true)

        try {
          storeCompatibleAnalysisData("resumeAnalysis", text.analysis)
          console.log("Resume analysis stored successfully")
        } catch (storageError) {
          console.error("Error storing resume analysis:", storageError)
        }

        console.log("Resume Analysis Complete:")
        console.log("Technical Skills:", text.analysis.skills?.technical || [])
        console.log("Soft Skills:", text.analysis.skills?.soft || [])
        console.log("Experience:", text.analysis.experience?.length || 0, "entries")
        console.log("Education:", text.analysis.education?.length || 0, "entries")
      }
      if (text) {
        setActiveStep(2)
      }
    } catch (error) {
      console.error("Error in handleResumeUpload:", error)
      toast({
        title: "Upload Error",
        description: "There was a problem processing your resume. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelection = (selected: boolean) => {
    setFileSelected(selected)
  }

  const handleJobDescriptionSubmit = (data: { analysis?: JobAnalysisResult }) => {
    setJobData(data)
    if (data.analysis) {
      setJobAnalysis(data.analysis)
    }
    setActiveStep(3)
  }

  const handleTextExtracted = (text: string) => {
    setResumeText(text)
    if (text.trim()) {
      const results = validateResume(text)
      setValidationResults(results)

      storeCompatibleAnalysisData("resumeText", text)
      storeCompatibleAnalysisData("resumeAnalysis", results)

      setFileUploaded(true)

      console.log("Text extracted and validated:", text.substring(0, 100) + "...")
      console.log("Technical Skills:", results.skills?.technical || [])
      console.log("Soft Skills:", results.skills?.soft || [])
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-4">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500 text-xl">Welcome to your dashboard!</p>
          </div>
        </div>
      </main>
    </div>
  )
}

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

export default function Dashboard() {
  const [activeStep, setActiveStep] = useState(1)
  const [activeTab, setActiveTab] = useState("resume")
  const [resumeData, setResumeData] = useState(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResult | null>(null)
  const [jobData, setJobData] = useState(null)
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysisResult | null>(null)
  const [fileSelected, setFileSelected] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [showSkillsSummary, setShowSkillsSummary] = useState(false)
  const [resumeText, setResumeText] = useState("")
  const [validationResults, setValidationResults] = useState<any>(null)

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

  const handleResumeUpload = (text) => {
    try {
      console.log("Resume upload handler called")

      const isTextOnly = typeof text === "string"
      console.log("Is text only:", isTextOnly)

      if (isTextOnly) {
        setResumeText(text)
        setFileUploaded(true)
        setActiveStep(2)

        const results = validateResume(text)
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
      if (text.analysis) {
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

  const handleFileSelection = (selected) => {
    setFileSelected(selected)
  }

  const handleJobDescriptionSubmit = (data) => {
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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <div className="mb-8">
            <div className="flex items-center space-x-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                1
              </div>
              <div className={`h-0.5 w-12 ${activeStep >= 2 ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                2
              </div>
              <div className={`h-0.5 w-12 ${activeStep >= 3 ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 3 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                3
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resume" onClick={() => setActiveTab("resume")}>
                Resume
              </TabsTrigger>
              <TabsTrigger value="job" onClick={() => setActiveTab("job")} disabled={activeStep < 2}>
                Job Description
              </TabsTrigger>
            </TabsList>
            <TabsContent value="resume">
              <div className="space-y-6">
                <ResumeUpload
                  onUpload={handleResumeUpload}
                  onFileSelect={handleFileSelection}
                  onTextExtracted={handleTextExtracted}
                />

                {validationResults && <ResumeValidatorResults validationResults={validationResults} />}

                {showSkillsSummary && resumeAnalysis && <SkillsSummary analysis={resumeAnalysis} />}

                {resumeAnalysis && <ResumeAnalysisResults analysis={resumeAnalysis} />}

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (resumeData || fileUploaded || resumeText) {
                        setActiveStep(2)
                        setActiveTab("job")
                      }
                    }}
                    disabled={!resumeData && !fileUploaded && !resumeText}
                    className="gap-1.5"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="job">
              <Card>
                <CardHeader>
                  <CardTitle>Add Job Description</CardTitle>
                  <CardDescription>
                    Paste the job description you're interested in to identify skill gaps.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JobDescriptionInput onSubmit={handleJobDescriptionSubmit} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveStep(1)
                      setActiveTab("resume")
                    }}
                  >
                    Back
                  </Button>
                  <Link href="/analyze">
                    <Button disabled={!jobData} className="gap-1.5">
                      Analyze
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {jobAnalysis && (
                <div className="mt-8">
                  <JobAnalysisResults analysis={jobAnalysis} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

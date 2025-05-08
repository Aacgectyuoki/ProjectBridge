"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Code } from "lucide-react"
import { ResumeUpload } from "@/components/resume-upload"
import { JobDescriptionInput } from "@/components/job-description-input"
import { RoleFocusSelect } from "@/components/role-focus-select"
import { ResumeAnalysisResults } from "@/components/resume-analysis-results"
import { JobAnalysisResults } from "@/components/job-analysis-results"
import { SkillsSummary } from "@/components/skills-summary"
import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"
import { SkillsLogViewer } from "@/components/skills-log-viewer"
// Add the new DetailedSkillExtractionLog component to the imports
import { DetailedSkillExtractionLog } from "@/components/detailed-skill-extraction-log"
import { forceNewSession } from "@/utils/analysis-session-manager"
// Import the debug function
import { debugLogAllStoredData } from "@/utils/analysis-session-manager"
import { toast } from "@/components/ui/use-toast"
import { validateResume } from "@/utils/resume-validator"
import { ResumeValidatorResults } from "@/components/resume-validator-results"
// Add these imports at the top of the file
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
  const [roleFocus, setRoleFocus] = useState("")
  const [fileSelected, setFileSelected] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [showSkillsSummary, setShowSkillsSummary] = useState(false)
  const [showJobSkillsLog, setShowJobSkillsLog] = useState(false)
  const [resumeText, setResumeText] = useState("")
  const [validationResults, setValidationResults] = useState<any>(null)

  // Update the useEffect hook to include data recovery
  useEffect(() => {
    // Create a new session when the dashboard is loaded directly
    if (window.location.pathname === "/dashboard" && !window.location.search.includes("keepSession")) {
      forceNewSession()
    }

    // Try to recover any missing data and synchronize across sessions
    synchronizeSessionData()
    recoverMissingData()
  }, [])

  // Update the handleResumeUpload function to ensure data is properly stored
  const handleResumeUpload = (text) => {
    // If text is a string, it's coming directly from the text input
    const isTextOnly = typeof text === "string"

    if (isTextOnly) {
      setResumeText(text)
      setFileUploaded(true)
      setActiveStep(2)

      // Validate the resume text
      const results = validateResume(text)
      setValidationResults(results)

      // Store the validation results in session storage
      storeCompatibleAnalysisData("resumeAnalysis", results)

      // Also store the raw text for potential reprocessing
      storeCompatibleAnalysisData("resumeText", text)

      // Log detected skills to console
      console.log("Resume Text Analysis Complete:")
      console.log("Technical Skills:", results.skills?.technical || [])
      console.log("Soft Skills:", results.skills?.soft || [])

      return
    }

    // Otherwise, handle as before for file uploads
    setResumeData(text)
    setFileUploaded(true)
    if (text.analysis) {
      setResumeAnalysis(text.analysis)
      setShowSkillsSummary(true)

      // Ensure the analysis is stored in session storage
      storeCompatibleAnalysisData("resumeAnalysis", text.analysis)

      // Log detected skills to console
      console.log("Resume Analysis Complete:")
      console.log("Technical Skills:", text.analysis.skills?.technical || [])
      console.log("Soft Skills:", text.analysis.skills?.soft || [])
      console.log("Experience:", text.analysis.experience?.length || 0, "entries")
      console.log("Education:", text.analysis.education?.length || 0, "entries")
    }
    if (text) {
      setActiveStep(2)
    }
  }

  const handleFileSelection = (selected) => {
    setFileSelected(selected)
  }

  const handleJobDescriptionSubmit = (data) => {
    setJobData(data)
    if (data.analysis) {
      setJobAnalysis(data.analysis)
      setShowJobSkillsLog(true) // Show skills log after job analysis
    }
    setActiveStep(3)
    setActiveTab("focus")
  }

  const handleRoleFocusSubmit = (focus) => {
    setRoleFocus(focus)
    // Navigate to analysis page
  }

  // Update the handleTextExtracted function to ensure data is properly stored
  const handleTextExtracted = (text: string) => {
    setResumeText(text)
    if (text.trim()) {
      // Validate the resume text
      const results = validateResume(text)
      setValidationResults(results)

      // Store both the raw text and the validation results
      storeCompatibleAnalysisData("resumeText", text)
      storeCompatibleAnalysisData("resumeAnalysis", results)

      // Mark as uploaded so the next button works
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
              <div className={`h-0.5 w-12 ${activeStep >= 4 ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${activeStep >= 4 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                4
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resume" onClick={() => setActiveTab("resume")}>
                Resume
              </TabsTrigger>
              <TabsTrigger value="job" onClick={() => setActiveTab("job")} disabled={activeStep < 2}>
                Job Description
              </TabsTrigger>
              <TabsTrigger value="focus" onClick={() => setActiveTab("focus")} disabled={activeStep < 3}>
                Role Focus
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
                  <Button
                    onClick={() => {
                      if (jobData) {
                        setActiveStep(3)
                        setActiveTab("focus")
                      }
                    }}
                    disabled={!jobData}
                    className="gap-1.5"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {jobAnalysis && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowJobSkillsLog(!showJobSkillsLog)}>
                    {showJobSkillsLog ? "Hide Skills Log" : "Show Skills Log"}
                  </Button>
                </div>
              )}

              {showJobSkillsLog && jobAnalysis && (
                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Skills Log</CardTitle>
                      <CardDescription>Skills extracted from the job description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillsLogViewer inline={true} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {jobAnalysis && (
                <div className="mt-8">
                  <JobAnalysisResults analysis={jobAnalysis} />
                </div>
              )}
            </TabsContent>
            <TabsContent value="focus">
              <Card>
                <CardHeader>
                  <CardTitle>Select Role Focus (Optional)</CardTitle>
                  <CardDescription>
                    Specify which aspect of the role you want to focus on for more targeted project suggestions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoleFocusSelect onSubmit={handleRoleFocusSubmit} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveStep(2)
                      setActiveTab("job")
                    }}
                  >
                    Back
                  </Button>
                  <Link href="/analyze">
                    <Button className="gap-1.5">
                      Analyze
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <SkillsLogViewer />
        <DetailedSkillExtractionLog />
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              debugLogAllStoredData()
              toast({
                title: "Debug Info",
                description: "Session data logged to console",
              })
            }}
          >
            Debug: Log Session Data
          </Button>
        </div>
      </main>
    </div>
  )
}

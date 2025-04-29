"use client"

import { useState } from "react"
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

  const handleResumeUpload = (data) => {
    setResumeData(data)
    setFileUploaded(true)
    if (data.analysis) {
      setResumeAnalysis(data.analysis)
      setShowSkillsSummary(true)

      // Log detected skills to console
      console.log("Resume Analysis Complete:")
      console.log("Technical Skills:", data.analysis.skills?.technical || [])
      console.log("Soft Skills:", data.analysis.skills?.soft || [])
      console.log("Experience:", data.analysis.experience?.length || 0, "entries")
      console.log("Education:", data.analysis.education?.length || 0, "entries")
    }
    if (data) {
      setActiveStep(2)
      // Don't automatically switch to job tab so user can see skills summary
      // setActiveTab("job")
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
    setActiveTab("focus")
  }

  const handleRoleFocusSubmit = (focus) => {
    setRoleFocus(focus)
    // Navigate to analysis page
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Code className="h-6 w-6" />
            <span>ProjectBridge</span>
          </Link>
        </div>
      </header>
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
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Resume</CardTitle>
                  <CardDescription>
                    Upload your resume, paste your resume text, or provide your LinkedIn profile URL to analyze your
                    current skills and experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeUpload onUpload={handleResumeUpload} onFileSelect={handleFileSelection} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" disabled>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (resumeData || fileUploaded) {
                        setActiveStep(2)
                        setActiveTab("job")
                      }
                    }}
                    disabled={!resumeData && !fileUploaded}
                    className="gap-1.5"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {showSkillsSummary && resumeAnalysis && (
                <div className="mt-8">
                  <SkillsSummary analysis={resumeAnalysis} />
                </div>
              )}

              {resumeAnalysis && (
                <div className="mt-8">
                  <ResumeAnalysisResults analysis={resumeAnalysis} />
                </div>
              )}
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
      </main>
    </div>
  )
}

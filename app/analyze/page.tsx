"use client"

import { AlertDescription } from "@/components/ui/alert"

import { Alert } from "@/components/ui/alert"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, FileText, FileCode, AlertCircle, RefreshCw } from "lucide-react"
import { SkillsGapAnalysis } from "@/components/skills-gap-analysis"
import { generateProjectIdeas } from "@/app/actions/generate-project-ideas"
import {
  analyzeSkillsGapFromResults,
  SkillsGapAnalysisError,
  SkillsGapAnalysisErrorType,
} from "@/app/actions/analyze-skills-gap"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"
import {
  getCompatibleAnalysisData,
  storeCompatibleAnalysisData,
  getCurrentSessionId,
} from "@/utils/analysis-session-manager"
import { synchronizeSessionData, recoverMissingData, getEnhancedAnalysisData } from "@/utils/analysis-session-manager"
import { handleError, ErrorCategory, ErrorSeverity, withRetryAndErrorHandling } from "@/utils/error-handler"
import { ResponsiveContainer } from "@/components/responsive-container"

export default function AnalyzePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false)
  const [analysisData, setAnalysisData] = useState<SkillGapAnalysisResult | null>(null)
  const [missingData, setMissingData] = useState<{ resume: boolean; job: boolean }>({ resume: false, job: false })
  const [error, setError] = useState<{ message: string; type?: string } | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Update the useEffect hook to include data recovery
  useEffect(() => {
    // Only run this once to prevent multiple session creations
    if (sessionInitialized) return

    const fetchAnalysis = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First, try to recover any missing data
        synchronizeSessionData()
        recoverMissingData()

        // Get the current session ID without creating a new one
        const sessionId = getCurrentSessionId()
        console.log("Using session ID:", sessionId)

        // Debug log all stored data to help diagnose issues
        const debugLogAllStoredData = () => {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            const value = localStorage.getItem(key)
            console.log(`localStorage[${key}] = ${value}`)
          }
        }
        debugLogAllStoredData()

        // Try to get data using our enhanced data retrieval
        const resumeData = getEnhancedAnalysisData("resumeAnalysis", null)
        const jobData = getEnhancedAnalysisData("jobAnalysis", null)

        // Add better debugging and data handling
        console.log("Resume data from storage:", resumeData)
        console.log("Job data from storage:", jobData)

        // Check if we're missing data
        const isMissingResume = !resumeData
        const isMissingJob = !jobData

        if (isMissingResume || isMissingJob) {
          console.log("Missing data detected:", { resume: isMissingResume, job: isMissingJob })
          setMissingData({
            resume: isMissingResume,
            job: isMissingJob,
          })
          setIsLoading(false)
          return // Exit early if data is missing
        }

        // Check if we already have a cached analysis result
        const cachedAnalysis = getEnhancedAnalysisData("skillGapAnalysis", null)
        if (cachedAnalysis) {
          console.log("Using cached skill gap analysis")
          setAnalysisData(cachedAnalysis)
          setIsLoading(false)
          return // Exit early if we have cached data
        }

        // Perform the analysis
        try {
          console.log("Performing new skills gap analysis")
          console.log("Using resume data:", resumeData)
          console.log("Using job data:", jobData)

          // Use our analysis function with error handling
          const gapAnalysis = await withRetryAndErrorHandling(
            async () => {
              const result = await analyzeSkillsGapFromResults(resumeData, jobData)
              console.log("Analysis result:", result)
              return result
            },
            {
              category: ErrorCategory.DATA_PARSING,
              maxRetries: 3,
              onRetry: (attempt, error) => {
                console.warn(`Analysis attempt ${attempt} failed: ${error.message}. Retrying...`)
                toast({
                  title: "Analysis retry",
                  description: `Attempt ${attempt} failed. Retrying...`,
                  variant: "warning",
                })
              },
            },
          )

          if (!gapAnalysis) {
            throw new SkillsGapAnalysisError(
              "Failed to generate skills gap analysis",
              SkillsGapAnalysisErrorType.UNKNOWN_ERROR,
            )
          }

          // Cache the result using our enhanced compatible storage
          console.log("Storing analysis result:", gapAnalysis)
          storeCompatibleAnalysisData("skillGapAnalysis", gapAnalysis)

          setAnalysisData(gapAnalysis)
        } catch (error) {
          handleError(error as Error, ErrorCategory.DATA_PARSING, ErrorSeverity.ERROR)

          console.error("Error performing skills gap analysis:", error)
          setError({
            message: "There was a problem analyzing your skills gap. Using fallback data.",
            type: error instanceof SkillsGapAnalysisError ? error.type : undefined,
          })

          // Fallback to mock data
          setAnalysisData(mockAnalysisData)
        }
      } catch (error) {
        handleError(error as Error, ErrorCategory.UNKNOWN, ErrorSeverity.ERROR)

        console.error("Error in analysis process:", error)
        setError({
          message: "An unexpected error occurred. Please try again.",
          type: "unknown",
        })

        // Fallback to mock data
        setAnalysisData(mockAnalysisData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
    setSessionInitialized(true)
  }, [toast, sessionInitialized, retryCount])

  const handleGenerateProjects = async () => {
    if (!analysisData) return

    try {
      setIsGeneratingProjects(true)

      // Get the resume and job data using our enhanced compatible data retrieval
      const resumeData = getCompatibleAnalysisData("resumeAnalysis", null)
      const jobData = getCompatibleAnalysisData("jobAnalysis", null)

      if (resumeData && jobData) {
        const projectIdeas = await withRetryAndErrorHandling(
          async () => await generateProjectIdeas(resumeData, jobData),
          {
            category: ErrorCategory.API,
            maxRetries: 3,
            onRetry: (attempt, error) => {
              console.warn(`Project generation attempt ${attempt} failed: ${error.message}. Retrying...`)
              toast({
                title: "Project generation retry",
                description: `Attempt ${attempt} failed. Retrying...`,
                variant: "warning",
              })
            },
          },
        )

        if (projectIdeas && projectIdeas.length > 0) {
          // Save project ideas using our enhanced compatible storage
          storeCompatibleAnalysisData("projectIdeas", projectIdeas)

          toast({
            title: "Project ideas generated",
            description: `Generated ${projectIdeas.length} project ideas to help you bridge the skills gap.`,
          })

          // Navigate to projects page
          router.push("/projects")
        } else {
          throw new Error("Failed to generate project ideas")
        }
      } else {
        throw new Error("Missing resume or job data")
      }
    } catch (error) {
      handleError(error as Error, ErrorCategory.API, ErrorSeverity.ERROR)

      console.error("Error generating project ideas:", error)
    } finally {
      setIsGeneratingProjects(false)
    }
  }

  // Function to handle starting over
  const handleStartOver = () => {
    router.push("/")
  }

  // Function to retry analysis
  const handleRetryAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    setRetryCount((prev) => prev + 1) // Increment retry count to trigger useEffect
  }

  return (
    <ResponsiveContainer>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 container py-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Skills Gap Analysis</h1>
            </div>

            {isLoading ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Analyzing your skills...</CardTitle>
                  <CardDescription>
                    We're comparing your resume with the job description to identify skill gaps.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={45} className="h-2" />
                    <p className="text-sm text-gray-500">This may take a moment</p>
                  </div>
                </CardContent>
              </Card>
            ) : missingData.resume || missingData.job ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Missing Data
                  </CardTitle>
                  <CardDescription>
                    {missingData.resume && missingData.job
                      ? "Both resume and job description are missing."
                      : missingData.resume
                        ? "Resume data is missing."
                        : "Job description data is missing."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p>
                      To perform a skills gap analysis, we need both your resume and a job description. Please upload
                      the missing information to continue.
                    </p>

                    <div className="flex flex-col gap-4">
                      {missingData.resume && (
                        <Link href="/" className="w-full">
                          <Button className="w-full flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Upload Resume
                          </Button>
                        </Link>
                      )}

                      {missingData.job && (
                        <Link href="/" className="w-full">
                          <Button className="w-full flex items-center gap-2">
                            <FileCode className="h-4 w-4" />
                            Add Job Description
                          </Button>
                        </Link>
                      )}

                      <Button variant="outline" onClick={handleStartOver} className="w-full">
                        Start Over
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Analysis Error
                  </CardTitle>
                  <CardDescription>{error.message}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p>
                      We encountered an error while analyzing your skills gap. You can try again or continue with the
                      fallback data.
                    </p>

                    {error.type && (
                      <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-700">
                          <p className="font-medium">Error details:</p>
                          <p className="text-sm">Type: {error.type}</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-col gap-4">
                      <Button onClick={handleRetryAnalysis} className="w-full flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retry Analysis
                      </Button>
                      <Button variant="outline" onClick={handleStartOver} className="w-full">
                        Start Over
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {analysisData && (
                  <>
                    <SkillsGapAnalysis analysis={analysisData} />

                    <div className="mt-8">
                      <Button
                        className="w-full gap-1.5"
                        onClick={handleGenerateProjects}
                        disabled={isGeneratingProjects}
                      >
                        {isGeneratingProjects ? "Generating Project Ideas..." : "Generate Project Ideas"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>

                      <Link href="/ai-analysis" className="block mt-4">
                        <Button variant="outline" className="w-full gap-1.5">
                          View AI Engineering Skills Analysis
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ResponsiveContainer>
  )
}

// Mock data for testing
const mockAnalysisData: SkillGapAnalysisResult = {
  matchPercentage: 65,
  missingSkills: [
    {
      name: "React",
      level: "Advanced",
      priority: "High",
      context:
        "The job requires building and maintaining complex React applications with state management and performance optimization.",
    },
    {
      name: "TypeScript",
      level: "Intermediate",
      priority: "Medium",
      context: "TypeScript is used throughout the codebase for type safety and better developer experience.",
    },
    {
      name: "GraphQL",
      level: "Beginner",
      priority: "Low",
      context: "The team is starting to adopt GraphQL for some API endpoints.",
    },
  ],
  missingQualifications: [
    {
      description: "Bachelor's degree in Computer Science or related field",
      importance: "Preferred",
      alternative: "Equivalent practical experience or bootcamp certification",
    },
  ],
  missingExperience: [
    {
      area: "Frontend Development",
      yearsNeeded: "3+ years",
      suggestion: "Contribute to open-source React projects to build verifiable experience",
    },
  ],
  matchedSkills: [
    { name: "JavaScript", proficiency: "Advanced", relevance: "High" },
    { name: "HTML/CSS", proficiency: "Advanced", relevance: "Medium" },
    { name: "Node.js", proficiency: "Intermediate", relevance: "Low" },
  ],
  recommendations: [
    {
      type: "Project",
      description: "Build a full-featured React application with TypeScript, Redux, and GraphQL integration",
      timeToAcquire: "2-3 months",
      priority: "High",
    },
    {
      type: "Course",
      description: "Complete a comprehensive TypeScript course with focus on React integration",
      timeToAcquire: "3-4 weeks",
      priority: "Medium",
    },
    {
      type: "Certification",
      description: "Obtain a React developer certification to validate your skills",
      timeToAcquire: "1-2 months",
      priority: "Low",
    },
  ],
  summary:
    "You have a solid foundation in JavaScript and web fundamentals, but need to develop more specialized skills in React and TypeScript to be competitive for this role. Focus on building practical experience with these technologies through projects and structured learning.",
}

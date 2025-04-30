"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Code, ArrowRight } from "lucide-react"
import { SkillsGapAnalysis } from "@/components/skills-gap-analysis"
import { generateProjectIdeas } from "@/app/actions/generate-project-ideas"
import { analyzeSkillsGapFromResults } from "@/app/actions/analyze-skills-gap"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"

export default function AnalyzePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false)
  const [analysisData, setAnalysisData] = useState<SkillGapAnalysisResult | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true)

      try {
        // Try to get data from localStorage
        let resumeData = null
        let jobData = null

        try {
          const resumeDataStr = localStorage.getItem("resumeAnalysis")
          if (resumeDataStr) {
            resumeData = JSON.parse(resumeDataStr)
          }
        } catch (error) {
          console.error("Error parsing resume data from localStorage:", error)
        }

        try {
          const jobDataStr = localStorage.getItem("jobAnalysis")
          if (jobDataStr) {
            jobData = JSON.parse(jobDataStr)
          }
        } catch (error) {
          console.error("Error parsing job data from localStorage:", error)
        }

        // Check if we already have a cached analysis result
        const cachedAnalysis = localStorage.getItem("skillGapAnalysis")
        if (cachedAnalysis) {
          try {
            const parsedAnalysis = JSON.parse(cachedAnalysis)
            setAnalysisData(parsedAnalysis)
            setIsLoading(false)
            return // Exit early if we have cached data
          } catch (error) {
            console.warn("Failed to parse cached analysis", error)
            // Continue with analysis if parsing fails
          }
        }

        if (resumeData && jobData) {
          try {
            // Use our new analysis function
            const gapAnalysis = await analyzeSkillsGapFromResults(resumeData, jobData)

            // Cache the result
            try {
              localStorage.setItem("skillGapAnalysis", JSON.stringify(gapAnalysis))
            } catch (e) {
              console.warn("Failed to cache analysis result", e)
            }

            setAnalysisData(gapAnalysis)
          } catch (error) {
            console.error("Error performing skills gap analysis:", error)
            toast({
              title: "Analysis Error",
              description: "There was a problem analyzing your skills gap. Using fallback data.",
              variant: "destructive",
            })
            // Fallback to mock data
            setAnalysisData(mockAnalysisData)
          }
        } else {
          // Fallback to mock data
          setAnalysisData(mockAnalysisData)
        }
      } catch (error) {
        console.error("Error in analysis process:", error)
        toast({
          title: "Analysis Error",
          description: "There was a problem analyzing your skills gap. Please try again.",
          variant: "destructive",
        })
        // Fallback to mock data
        setAnalysisData(mockAnalysisData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [toast])

  const handleGenerateProjects = async () => {
    if (!analysisData) return

    try {
      setIsGeneratingProjects(true)

      // Get the resume and job data from localStorage
      let resumeData = null
      let jobData = null

      try {
        const resumeDataStr = localStorage.getItem("resumeAnalysis")
        if (resumeDataStr) {
          resumeData = JSON.parse(resumeDataStr)
        }
      } catch (error) {
        console.error("Error parsing resume data from localStorage:", error)
      }

      try {
        const jobDataStr = localStorage.getItem("jobAnalysis")
        if (jobDataStr) {
          jobData = JSON.parse(jobDataStr)
        }
      } catch (error) {
        console.error("Error parsing job data from localStorage:", error)
      }

      if (resumeData && jobData) {
        const projectIdeas = await generateProjectIdeas(resumeData, jobData)

        if (projectIdeas && projectIdeas.length > 0) {
          // Save project ideas to localStorage
          try {
            localStorage.setItem("projectIdeas", JSON.stringify(projectIdeas))
          } catch (error) {
            console.error("Error saving project ideas to localStorage:", error)
          }

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
      console.error("Error generating project ideas:", error)
      toast({
        title: "Error generating project ideas",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingProjects(false)
    }
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
          ) : (
            <>
              {analysisData && (
                <>
                  <SkillsGapAnalysis analysis={analysisData} />

                  <div className="mt-8">
                    <Button className="w-full gap-1.5" onClick={handleGenerateProjects} disabled={isGeneratingProjects}>
                      {isGeneratingProjects ? "Generating Project Ideas..." : "Generate Project Ideas"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    {/* Add this new button */}
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

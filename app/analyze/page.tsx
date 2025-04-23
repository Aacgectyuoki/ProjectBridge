"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Code, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import { SkillGapCard } from "@/components/skill-gap-card"
import { generateProjectIdeas } from "@/app/actions/generate-project-ideas"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function AnalyzePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  // In a real app, this would come from a database or context
  // For now, we'll use mock data and localStorage
  useEffect(() => {
    // Simulate API call to get analysis data
    const timer = setTimeout(() => {
      // Try to get data from localStorage
      const resumeData = localStorage.getItem("resumeAnalysis")
      const jobData = localStorage.getItem("jobAnalysis")

      if (resumeData && jobData) {
        try {
          const resumeAnalysis = JSON.parse(resumeData)
          const jobAnalysis = JSON.parse(jobData)

          // Calculate match percentage based on skills
          const resumeSkills = [...(resumeAnalysis.skills?.technical || []), ...(resumeAnalysis.skills?.soft || [])]

          const jobSkills = [...(jobAnalysis.requiredSkills || []), ...(jobAnalysis.preferredSkills || [])]

          // Find matching skills
          const matchedSkills = resumeSkills.filter((skill) =>
            jobSkills.some(
              (jobSkill) =>
                jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(jobSkill.toLowerCase()),
            ),
          )

          // Find missing skills
          const missingSkills = jobSkills
            .filter(
              (skill) =>
                !resumeSkills.some(
                  (resumeSkill) =>
                    resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(resumeSkill.toLowerCase()),
                ),
            )
            .map((skill) => ({
              name: skill,
              level: "Required",
              priority: jobAnalysis.requiredSkills.includes(skill) ? "High" : "Medium",
            }))

          // Calculate match percentage
          const matchPercentage = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0

          setAnalysisData({
            matchPercentage,
            missingSkills,
            matchedSkills: matchedSkills.map((skill) => ({
              name: skill,
              level: resumeAnalysis.skills.technical.includes(skill) ? "Technical" : "Soft",
            })),
            resumeAnalysis,
            jobAnalysis,
          })
        } catch (error) {
          console.error("Error parsing analysis data:", error)
          // Fallback to mock data
          setAnalysisData(mockAnalysisData)
        }
      } else {
        // Fallback to mock data
        setAnalysisData(mockAnalysisData)
      }

      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleGenerateProjects = async () => {
    if (!analysisData) return

    try {
      setIsGeneratingProjects(true)

      const projectIdeas = await generateProjectIdeas(analysisData.resumeAnalysis, analysisData.jobAnalysis)

      if (projectIdeas && projectIdeas.length > 0) {
        // Save project ideas to localStorage
        localStorage.setItem("projectIdeas", JSON.stringify(projectIdeas))

        toast({
          title: "Project ideas generated",
          description: `Generated ${projectIdeas.length} project ideas to help you bridge the skills gap.`,
        })

        // Navigate to projects page
        router.push("/projects")
      } else {
        throw new Error("Failed to generate project ideas")
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
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Skills Match</CardTitle>
                  <CardDescription>
                    Your resume matches {analysisData.matchPercentage}% of the job requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={analysisData.matchPercentage} className="h-2" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Skills You Have
                        </h3>
                        <ul className="space-y-2">
                          {analysisData.matchedSkills.map((skill, index) => (
                            <li key={index} className="flex justify-between text-sm p-2 bg-green-50 rounded">
                              <span>{skill.name}</span>
                              <span className="text-gray-500">{skill.level}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          Skills You Need
                        </h3>
                        <ul className="space-y-2">
                          {analysisData.missingSkills.map((skill, index) => (
                            <li key={index} className="flex justify-between text-sm p-2 bg-red-50 rounded">
                              <span>{skill.name}</span>
                              <span className="text-gray-500">{skill.priority}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-1.5" onClick={handleGenerateProjects} disabled={isGeneratingProjects}>
                    {isGeneratingProjects ? "Generating Project Ideas..." : "Generate Project Ideas"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Skill Gap Details</h2>
                {analysisData.missingSkills.map((skill, index) => (
                  <SkillGapCard key={index} skill={skill} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// Mock data - in a real app, this would come from API
const mockAnalysisData = {
  matchPercentage: 65,
  missingSkills: [
    { name: "React", level: "Advanced", priority: "High" },
    { name: "TypeScript", level: "Intermediate", priority: "Medium" },
    { name: "GraphQL", level: "Beginner", priority: "Low" },
  ],
  matchedSkills: [
    { name: "JavaScript", level: "Advanced" },
    { name: "HTML/CSS", level: "Advanced" },
    { name: "Node.js", level: "Intermediate" },
  ],
  resumeAnalysis: {
    skills: {
      technical: ["JavaScript", "HTML/CSS", "Node.js"],
      soft: ["Communication", "Problem Solving"],
    },
  },
  jobAnalysis: {
    title: "Frontend Developer",
    requiredSkills: ["JavaScript", "React", "TypeScript", "HTML/CSS"],
    preferredSkills: ["GraphQL", "Node.js"],
  },
}

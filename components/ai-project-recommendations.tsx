"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { generateProjectIdeas } from "@/app/actions/generate-project-ideas"
import type { ProjectIdea } from "@/app/actions/generate-project-ideas"
import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"
import { ProjectCard } from "./project-card"
import { useToast } from "@/hooks/use-toast"

interface AIProjectRecommendationsProps {
  resumeAnalysis: ResumeAnalysisResult
  jobAnalysis: JobAnalysisResult
  roleFocus?: string
}

export function AIProjectRecommendations({ resumeAnalysis, jobAnalysis, roleFocus }: AIProjectRecommendationsProps) {
  const [projects, setProjects] = useState<ProjectIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { toast } = useToast()

  const handleGenerateProjects = async () => {
    setLoading(true)
    try {
      const projectIdeas = await generateProjectIdeas(resumeAnalysis, jobAnalysis, roleFocus)
      setProjects(projectIdeas)
      setCurrentIndex(0)
    } catch (error) {
      console.error("Error generating project ideas:", error)
      toast({
        title: "Error",
        description: "Failed to generate project ideas. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(projects.length - 1, prev + 1))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Project Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-center text-muted-foreground mb-4">
              Generate project ideas to help you develop the skills needed for this job.
            </p>
            <Button onClick={handleGenerateProjects} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Project Ideas"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <ProjectCard project={projects[currentIndex]} index={currentIndex} total={projects.length} />

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
                Previous
              </Button>
              <Button variant="outline" onClick={handleNext} disabled={currentIndex === projects.length - 1}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

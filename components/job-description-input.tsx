"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Briefcase, AlertCircle } from "lucide-react"
import { analyzeJobDescription } from "@/app/actions/analyze-job-description"
import { extractSkills } from "@/app/actions/extract-skills"
import { useToast } from "@/hooks/use-toast"
import { SkillsLogger } from "@/utils/skills-logger"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function JobDescriptionInput({ onSubmit }) {
  const [jobDescription, setJobDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (jobDescription.trim()) {
      // Store the job description text for comparison
      localStorage.setItem("jobDescriptionText", jobDescription)

      try {
        setIsProcessing(true)

        // Extract skills using our new LLM-based extractor
        let extractedSkills
        try {
          extractedSkills = await extractSkills(jobDescription, "job")
          console.log("Successfully extracted job skills:", extractedSkills)
        } catch (skillsError) {
          console.error("Error extracting job skills:", skillsError)
          // Continue with default skills
          extractedSkills = {
            technical: [],
            soft: [],
            tools: [],
            frameworks: [],
            languages: [],
            databases: [],
            methodologies: [],
            platforms: [],
            other: [],
          }

          toast({
            title: "Skills extraction limited",
            description: "We had trouble extracting all skills from the job description. Basic analysis will continue.",
            variant: "warning",
          })
        }

        // Analyze the job description for other information
        const analysisResult = await analyzeJobDescription(jobDescription)

        // Combine the results
        const enhancedAnalysis = {
          ...analysisResult,
          requiredSkills: [
            ...analysisResult.requiredSkills,
            ...extractedSkills.technical,
            ...extractedSkills.frameworks,
            ...extractedSkills.languages,
            ...extractedSkills.databases,
            ...extractedSkills.tools,
            ...extractedSkills.platforms,
          ].filter((skill, index, self) => self.indexOf(skill) === index), // Remove duplicates
          preferredSkills: [...analysisResult.preferredSkills, ...extractedSkills.methodologies].filter(
            (skill, index, self) => self.indexOf(skill) === index,
          ), // Remove duplicates
          extractedSkills, // Add the full extracted skills data
        }

        setIsProcessing(false)

        // Store the analysis result in localStorage for later use
        try {
          localStorage.setItem("jobAnalysis", JSON.stringify(enhancedAnalysis))
          localStorage.setItem("extractedJobSkills", JSON.stringify(extractedSkills))
        } catch (error) {
          console.error("Error saving job analysis to localStorage:", error)
        }

        // Log the job description analysis
        console.group("Job Description Analysis")
        console.log("Required Skills:", enhancedAnalysis.requiredSkills)
        console.log("Preferred Skills:", enhancedAnalysis.preferredSkills)
        console.log("Extracted Skills:", extractedSkills)
        console.log("Responsibilities:", enhancedAnalysis.responsibilities)
        console.groupEnd()

        // Log the job skills
        SkillsLogger.logSkills(
          enhancedAnalysis.requiredSkills || [],
          enhancedAnalysis.preferredSkills || [],
          "job-description",
        )

        onSubmit({
          text: jobDescription,
          analysis: enhancedAnalysis,
        })

        toast({
          title: "Job description analyzed successfully",
          description: `Identified ${enhancedAnalysis.requiredSkills.length} required skills and ${enhancedAnalysis.responsibilities.length} responsibilities.`,
        })
      } catch (error) {
        setIsProcessing(false)
        console.error("Analysis error:", error)
        setError(error.message || "Failed to analyze job description. Please try again.")
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze job description. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid w-full gap-1.5">
        <Label htmlFor="job-description">Job Description</Label>
        <Textarea
          id="job-description"
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[200px]"
        />
      </div>
      <div className="flex justify-center">
        <Button type="submit" disabled={!jobDescription.trim() || isProcessing} className="gap-1.5">
          {isProcessing ? "Analyzing..." : "Analyze Job Description"}
          <Briefcase className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

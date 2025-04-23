"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Briefcase } from "lucide-react"
import { analyzeJobDescription } from "@/app/actions/analyze-job-description"
import { useToast } from "@/hooks/use-toast"

export function JobDescriptionInput({ onSubmit }) {
  const [jobDescription, setJobDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (jobDescription.trim()) {
      try {
        setIsProcessing(true)
        const analysisResult = await analyzeJobDescription(jobDescription)
        setIsProcessing(false)

        onSubmit({
          text: jobDescription,
          analysis: analysisResult,
        })

        toast({
          title: "Job description analyzed successfully",
          description: `Identified ${analysisResult.requiredSkills.length} required skills and ${analysisResult.responsibilities.length} responsibilities.`,
        })
      } catch (error) {
        setIsProcessing(false)
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze job description",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

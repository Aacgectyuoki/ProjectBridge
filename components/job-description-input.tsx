"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Briefcase, AlertCircle, Loader2 } from "lucide-react"
import { analyzeJobDescription } from "@/app/actions/analyze-job-description"
import { extractJobSkillsChain } from "@/app/actions/extract-job-skills-chain"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SkillExtractionLogViewer } from "./skill-extraction-log-viewer"
import { getCurrentSessionId, storeCompatibleAnalysisData } from "@/utils/analysis-session-manager"

export function JobDescriptionInput({ onSubmit }) {
  const [jobDescription, setJobDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const [showSkillsLog, setShowSkillsLog] = useState(false)
  const textareaRef = useRef(null)
  const [processingStage, setProcessingStage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (jobDescription.trim()) {
      // If this is a new job description, clear any previous job analysis
      const previousJobDesc = localStorage.getItem("jobDescriptionText")
      if (previousJobDesc !== jobDescription) {
        // Clear previous job analysis data but keep resume data
        const currentSession = getCurrentSessionId()
        const keysToRemove = []

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (
            key &&
            key.startsWith(currentSession) &&
            (key.includes("jobAnalysis") ||
              key.includes("extractedJobSkills") ||
              key.includes("skillGapAnalysis") ||
              key.includes("projectIdeas"))
          ) {
            keysToRemove.push(key)
          }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key))
        console.log(`Cleared ${keysToRemove.length} previous job analysis items`)
      }

      // Store the job description text for comparison
      localStorage.setItem("jobDescriptionText", jobDescription)

      try {
        setIsProcessing(true)
        setProcessingStage("Extracting skills...")

        // Set a timeout to show a message if processing takes too long
        const timeoutId = setTimeout(() => {
          toast({
            title: "Processing is taking longer than expected",
            description:
              "Please wait while we analyze the job description. This may take a minute for complex descriptions.",
            duration: 5000,
          })
        }, 5000)

        // Extract skills using our new LangChain-like approach
        let extractedSkills
        try {
          setProcessingStage("Extracting skills...")
          const result = await extractJobSkillsChain(jobDescription)
          extractedSkills = result.skills
          console.log("Successfully extracted job skills with LangChain-like approach:", extractedSkills)

          toast({
            title: "Skills extracted successfully",
            description: `Extracted ${extractedSkills.technical.length} technical skills and ${extractedSkills.soft.length} soft skills in ${Math.round(result.processingTime)}ms.`,
          })
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
        setProcessingStage("Analyzing job description...")
        const analysisResult = await analyzeJobDescription(jobDescription)

        // Clear the timeout since processing is complete
        clearTimeout(timeoutId)

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
        setProcessingStage("")

        // Store the analysis result using our enhanced session management
        try {
          storeCompatibleAnalysisData("jobAnalysis", enhancedAnalysis)
          storeCompatibleAnalysisData("extractedJobSkills", extractedSkills)

          // Also store the raw job description text
          storeCompatibleAnalysisData("jobDescriptionText", jobDescription)

          console.log("Stored job analysis in session:", getCurrentSessionId())

          // Debug log all stored data
          // debugLogAllStoredData()
        } catch (error) {
          console.error("Error saving job analysis:", error)
        }

        // Log the job description analysis
        console.group("Job Description Analysis")
        console.log("Required Skills:", enhancedAnalysis.requiredSkills)
        console.log("Preferred Skills:", enhancedAnalysis.preferredSkills)
        console.log("Extracted Skills:", extractedSkills)
        console.log("Responsibilities:", enhancedAnalysis.responsibilities)
        console.groupEnd()

        onSubmit({
          text: jobDescription,
          analysis: enhancedAnalysis,
        })

        toast({
          title: "Job description analyzed successfully",
          description: `Identified ${enhancedAnalysis.requiredSkills.length} required skills and ${enhancedAnalysis.responsibilities.length} responsibilities.`,
        })
        setShowSkillsLog(true)
      } catch (error) {
        setIsProcessing(false)
        setProcessingStage("")
        console.error("Analysis error:", error)
        setError(error.message || "Failed to analyze job description. Please try again.")
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze job description. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
        setProcessingStage("")
      }
    }
  }

  // Handle direct input changes
  const handleInputChange = (e) => {
    setJobDescription(e.target.value)
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
          ref={textareaRef}
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={handleInputChange}
          className="min-h-[200px]"
          disabled={isProcessing}
        />
      </div>
      <div className="flex justify-center">
        <Button type="submit" disabled={!jobDescription.trim() || isProcessing} className="gap-1.5">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {processingStage || "Analyzing..."}
            </>
          ) : (
            <>
              Analyze Job Description
              <Briefcase className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      {isProcessing && (
        <div className="text-center text-sm text-muted-foreground">
          <p>This may take a minute for complex job descriptions.</p>
        </div>
      )}
      {!isProcessing && (
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full"
          onClick={() => setShowSkillsLog(!showSkillsLog)}
        >
          {showSkillsLog ? "Hide Skills Log" : "Show Skills Log"}
        </Button>
      )}
      {showSkillsLog && (
        <div className="mt-4">
          <SkillExtractionLogViewer source="job-description" />
        </div>
      )}
    </form>
  )
}

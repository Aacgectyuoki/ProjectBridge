"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, FileText, FileCode, AlertCircle, RefreshCw } from "lucide-react"
import { SkillsGapAnalysis } from "@/components/skills-gap-analysis"
import { generateProjectIdeas } from "@/app/actions/generate-project-ideas"
import { analyzeSkillsGapFromResults, type SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"
import { SkillsGapAnalysisError, SkillsGapAnalysisErrorType } from "@/types/skills-gap-analysis-error"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  getCompatibleAnalysisData,
  storeCompatibleAnalysisData,
  getCurrentSessionId,
} from "@/utils/analysis-session-manager"
import { synchronizeSessionData, recoverMissingData, getEnhancedAnalysisData } from "@/utils/analysis-session-manager"
import { handleError, ErrorCategory, ErrorSeverity, withRetryAndErrorHandling } from "@/utils/error-handler"
import { ResponsiveContainer } from "@/components/responsive-container"
import { GuestUsageBanner } from "@/components/guest-usage-banner"
import { supabase } from "@/lib/supabase"
import { hasRemainingGuestTries, incrementGuestUsage } from "@/lib/guest-session"
import type { User } from '@supabase/supabase-js'

interface SessionData {
  resumeAnalysis: any;
  jobAnalysis: any;
}

export default function AnalyzePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [resumeData, setResumeData] = useState<any>(null)
  const [jobData, setJobData] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  const handleAnalysisStart = async () => {
    if (!user && !hasRemainingGuestTries()) {
      toast({
        title: "Guest Usage Limit Reached",
        description: "Please create an account to continue using the analysis features.",
        variant: "destructive",
      })
      router.push('/register')
      return
    }

    setIsLoading(true)
    try {
      if (!user) {
        incrementGuestUsage()
      }

      // Get resume and job data
      const resumeAnalysis = await getCompatibleAnalysisData("resumeAnalysis", null)
      const jobAnalysis = await getCompatibleAnalysisData("jobAnalysis", null)

      if (!resumeAnalysis || !jobAnalysis) {
        throw new Error("Missing resume or job description data")
      }

      // Process analysis
      const results = await analyzeSkillsGapFromResults(
        resumeAnalysis,
        jobAnalysis
      )
      
      // Store results
      await storeCompatibleAnalysisData("analysisResults", results)
      
      setIsLoading(false)
      toast({
        title: "Analysis Complete",
        description: "Your skills analysis has been completed successfully.",
      })
    } catch (error) {
      setIsLoading(false)
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      {!user && <GuestUsageBanner />}
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Skills Analysis</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload your resume and job description to analyze skill gaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-32"
                  onClick={() => router.push('/resume-upload')}
                >
                  <div className="flex flex-col items-center">
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Upload Resume</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-32"
                  onClick={() => router.push('/job-description')}
                >
                  <div className="flex flex-col items-center">
                    <FileCode className="h-8 w-8 mb-2" />
                    <span>Add Job Description</span>
                  </div>
                </Button>
              </div>
              
              <Button
                className="w-full"
                onClick={handleAnalysisStart}
                disabled={isLoading || (!resumeData && !jobData)}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Start Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-center font-medium">Analyzing your documents...</p>
                <Progress value={65} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

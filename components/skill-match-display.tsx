"use client"

import { useState, useEffect } from "react"
import { getCompatibleAnalysisData } from "@/utils/analysis-session-manager"
import type { SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"

export function SkillMatchDisplay() {
  const [analysisData, setAnalysisData] = useState<SkillGapAnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [matchResult, setMatchResult] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Fetch the analysis data from localStorage
    const data = getCompatibleAnalysisData<SkillGapAnalysisResult>("skillGapAnalysis", null)
    console.log("SkillMatchDisplay - Fetched data:", data)
    setAnalysisData(data)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-center text-gray-500">Loading skill match data...</p>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-center text-gray-500">No skill data available for comparison</p>
      </div>
    )
  }

  // Calculate the percentage for the progress bar
  const matchPercentage = analysisData.matchPercentage || 0

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Skill Match Analysis</h2>
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Match Percentage</span>
          <span className="text-sm font-medium">{matchPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${matchPercentage}%` }}></div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {matchPercentage < 30
          ? "Significant skill gaps identified"
          : matchPercentage < 60
            ? "Some skill gaps identified"
            : "Good match with minor gaps"}
      </p>
    </div>
  )
}

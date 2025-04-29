"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analyzeAIJobMatch } from "@/utils/resume-job-matcher"
import { BookOpen, Code, Database, Server, Cpu, BotIcon as Robot } from "lucide-react"

export function AISkillGapAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load skills data from localStorage
    try {
      const resumeAnalysisJson = localStorage.getItem("resumeAnalysis")
      const jobAnalysisJson = localStorage.getItem("jobAnalysis")

      if (resumeAnalysisJson && jobAnalysisJson) {
        const resumeAnalysis = JSON.parse(resumeAnalysisJson)
        const jobAnalysis = JSON.parse(jobAnalysisJson)

        // Extract skills from resume
        const resumeSkills = [...(resumeAnalysis.skills?.technical || []), ...(resumeAnalysis.skills?.soft || [])]

        // Extract requirements from job
        const jobRequirements = [
          ...(jobAnalysis.requiredSkills || []),
          ...(jobAnalysis.preferredSkills || []),
          ...(jobAnalysis.responsibilities || []),
        ]

        // Analyze the match
        const result = analyzeAIJobMatch(resumeSkills, jobRequirements)
        setAnalysis(result)
      }
    } catch (error) {
      console.error("Error analyzing AI job match:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Skill Match Analysis</CardTitle>
          <CardDescription>Analyzing your AI engineering skills...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={45} className="h-2" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Skill Match Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No skill data available for comparison</p>
        </CardContent>
      </Card>
    )
  }

  // Icons for each category
  const categoryIcons = {
    frameworks: <Code className="h-4 w-4" />,
    languages: <BookOpen className="h-4 w-4" />,
    concepts: <Cpu className="h-4 w-4" />,
    infrastructure: <Server className="h-4 w-4" />,
    tools: <Database className="h-4 w-4" />,
    agentSystems: <Robot className="h-4 w-4" />,
  }

  // User-friendly category names
  const categoryNames = {
    frameworks: "AI Frameworks",
    languages: "Programming Languages",
    concepts: "AI/ML Concepts",
    infrastructure: "Infrastructure",
    tools: "DevOps Tools",
    agentSystems: "Agent Systems",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Engineering Skill Match Analysis</CardTitle>
        <CardDescription>
          Your resume matches approximately {analysis.matchPercentage}% of the AI engineering skills required for this
          position
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Match Percentage</span>
            <span className="font-bold text-lg">{analysis.matchPercentage}%</span>
          </div>
          <Progress value={analysis.matchPercentage} className="h-2" />
          <p className="text-sm text-gray-500">
            {analysis.matchPercentage < 30
              ? "Significant AI skill gaps identified"
              : analysis.matchPercentage < 60
                ? "Some AI skill gaps identified"
                : "Good match with some minor gaps in AI expertise"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="matched">Matched Skills</TabsTrigger>
            <TabsTrigger value="missing">Missing Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Matched AI Skills</h3>
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="font-bold text-2xl text-green-700">
                    {Object.values(analysis.matchedSkills).flat().length}
                  </p>
                  <p className="text-sm text-green-600">AI skills you already have</p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Missing AI Skills</h3>
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="font-bold text-2xl text-red-700">
                    {Object.values(analysis.missingSkills).flat().length}
                  </p>
                  <p className="text-sm text-red-600">AI skills to develop</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">AI Skills by Category</h3>
              {Object.entries(categoryNames).map(([category, name]) => {
                const matched = analysis.matchedSkills[category].length
                const missing = analysis.missingSkills[category].length
                const total = matched + missing

                if (total === 0) return null

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {categoryIcons[category]}
                      <h4 className="text-sm font-medium">{name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-green-200 rounded-full"
                        style={{
                          width: `${(matched / total) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="h-2 bg-red-200 rounded-full"
                        style={{
                          width: `${(missing / total) * 100}%`,
                        }}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {matched} / {total}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {analysis.recommendations.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="font-medium">Recommendations</h3>
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-blue-800">{rec.category}</h4>
                    <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                    {rec.resources && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-blue-800">Resources:</p>
                        <ul className="text-xs text-blue-700 mt-1 space-y-1">
                          {rec.resources.map((resource, i) => (
                            <li key={i}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-900"
                              >
                                {resource.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="matched" className="space-y-4 pt-4">
            {Object.entries(analysis.matchedSkills).map(([category, skills]) => {
              if (skills.length === 0) return null

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {categoryIcons[category]}
                    <h3 className="font-medium">{categoryNames[category]}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800 border-green-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}

            {Object.values(analysis.matchedSkills).flat().length === 0 && (
              <p className="text-center text-gray-500">No matched AI skills found</p>
            )}
          </TabsContent>

          <TabsContent value="missing" className="space-y-4 pt-4">
            {Object.entries(analysis.missingSkills).map(([category, skills]) => {
              if (skills.length === 0) return null

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {categoryIcons[category]}
                    <h3 className="font-medium">{categoryNames[category]}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="border-red-200 text-red-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}

            {Object.values(analysis.missingSkills).flat().length === 0 && (
              <p className="text-center text-gray-500">No missing AI skills found</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

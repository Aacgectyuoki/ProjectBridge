"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

type SkillWithConfidence = {
  name: string
  confidence: number
}

interface AISkillsVisualizationProps {
  skills: {
    ai_concepts?: SkillWithConfidence[]
    ai_frameworks?: SkillWithConfidence[]
    ai_infrastructure?: SkillWithConfidence[]
    ai_agents?: SkillWithConfidence[]
    ai_engineering?: SkillWithConfidence[]
    ai_data?: SkillWithConfidence[]
    ai_applications?: SkillWithConfidence[]
    [key: string]: SkillWithConfidence[] | undefined
  }
  title?: string
  description?: string
}

export function AISkillsVisualization({
  skills,
  title = "AI Skills Analysis",
  description = "Detailed breakdown of AI-specific skills with confidence scores",
}: AISkillsVisualizationProps) {
  const [activeTab, setActiveTab] = useState("concepts")

  // Map our internal category names to user-friendly names
  const categoryNames = {
    ai_concepts: "AI/ML Concepts",
    ai_frameworks: "AI Frameworks",
    ai_infrastructure: "AI Infrastructure",
    ai_agents: "Agent Systems",
    ai_engineering: "AI Engineering",
    ai_data: "Data Processing",
    ai_applications: "AI Applications",
  }

  // Get all categories that have at least one skill
  const activeCategories = Object.entries(skills)
    .filter(([_, skillList]) => skillList && skillList.length > 0)
    .map(([category]) => category)

  // If no active tab is in the active categories, set the first active category as the active tab
  if (activeCategories.length > 0 && !activeCategories.includes(`ai_${activeTab}`)) {
    setActiveTab(activeCategories[0].replace("ai_", ""))
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {activeCategories.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No AI skills detected</p>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
                {Object.entries(categoryNames).map(([key, name]) => {
                  const category = key as keyof typeof skills
                  if (!skills[category] || skills[category]!.length === 0) return null

                  return (
                    <TabsTrigger key={key} value={key.replace("ai_", "")} className="text-xs sm:text-sm">
                      {name}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {Object.entries(categoryNames).map(([key, name]) => {
                const category = key as keyof typeof skills
                if (!skills[category] || skills[category]!.length === 0) return null

                const tabValue = key.replace("ai_", "")

                return (
                  <TabsContent key={key} value={tabValue} className="pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{name}</h3>
                        <span className="text-sm text-gray-500">{skills[category]!.length} skills</span>
                      </div>

                      <div className="space-y-3">
                        {skills[category]!.sort((a, b) => b.confidence - a.confidence).map((skill, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getConfidenceColor(skill.confidence)}>{skill.name}</Badge>
                              {skill.confidence >= 0.8 && (
                                <span className="text-xs text-green-600">High confidence</span>
                              )}
                            </div>
                            <Progress value={skill.confidence * 100} className="w-24 h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium mb-2">Confidence Score Legend</h3>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">High (80-100%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">Medium (50-79%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-xs">Low (0-49%)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { matchSkills } from "@/utils/skill-matcher"
import { normalizeSkillName } from "@/utils/skill-abbreviation-resolver"

export function SkillMatchDisplay() {
  const [matchResult, setMatchResult] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Load skills data from localStorage
    try {
      const resumeSkillsJson = localStorage.getItem("extractedResumeSkills")
      const jobSkillsJson = localStorage.getItem("extractedJobSkills")

      if (resumeSkillsJson && jobSkillsJson) {
        const resumeSkills = JSON.parse(resumeSkillsJson)
        const jobSkills = JSON.parse(jobSkillsJson)

        // Match skills
        const result = matchSkills(resumeSkills, jobSkills)
        setMatchResult(result)
      }
    } catch (error) {
      console.error("Error loading skills data:", error)
    }
  }, [])

  if (!matchResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skill Match Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No skill data available for comparison</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Match Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Match Percentage</span>
            <span className="font-bold text-lg">{matchResult.matchPercentage}%</span>
          </div>
          <Progress value={matchResult.matchPercentage} className="h-2" />
          <p className="text-sm text-gray-500">
            {matchResult.matchPercentage < 30
              ? "Significant skill gaps identified"
              : matchResult.matchPercentage < 60
                ? "Some skill gaps identified"
                : "Good match with some minor gaps"}
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
                <h3 className="font-medium">Matched Skills</h3>
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="font-bold text-2xl text-green-700">{matchResult.matchedSkills.length}</p>
                  <p className="text-sm text-green-600">skills you already have</p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Missing Skills</h3>
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="font-bold text-2xl text-red-700">{matchResult.missingSkills.length}</p>
                  <p className="text-sm text-red-600">skills to develop</p>
                </div>
              </div>
            </div>

            {matchResult.skillsByCategory.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Skills by Category</h3>
                {matchResult.skillsByCategory.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium capitalize">{category.category}</h4>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-green-200 rounded-full"
                        style={{
                          width: `${(category.matched.length / (category.matched.length + category.missing.length)) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="h-2 bg-red-200 rounded-full"
                        style={{
                          width: `${(category.missing.length / (category.matched.length + category.missing.length)) * 100}%`,
                        }}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {category.matched.length} / {category.matched.length + category.missing.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matchResult.partialMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Partial Matches</h3>
                <div className="space-y-2">
                  {matchResult.partialMatches.slice(0, 5).map((match, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50">
                          {match.resumeSkill}
                        </Badge>
                        <span>→</span>
                        <Badge>{match.jobSkill}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">{Math.round(match.similarity * 100)}% match</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matched" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {matchResult.matchedSkills.map((skill, index) => (
                <Badge key={index} className="bg-green-100 text-green-800 border-green-200">
                  {normalizeSkillName(skill)}
                </Badge>
              ))}
            </div>
            {matchResult.matchedSkills.length === 0 && (
              <p className="text-center text-gray-500">No matched skills found</p>
            )}
          </TabsContent>

          <TabsContent value="missing" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {matchResult.missingSkills.map((skill, index) => (
                <Badge key={index} variant="outline" className="border-red-200 text-red-800">
                  {normalizeSkillName(skill)}
                </Badge>
              ))}
            </div>
            {matchResult.missingSkills.length === 0 && (
              <p className="text-center text-gray-500">No missing skills found</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

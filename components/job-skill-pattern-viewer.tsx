"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { extractSkillPatterns, type SkillPattern, categorizeSkills } from "@/utils/jd-pattern-recognition"

interface JobSkillPatternViewerProps {
  jobDescription: string
}

export function JobSkillPatternViewer({ jobDescription }: JobSkillPatternViewerProps) {
  const [patterns, setPatterns] = useState<SkillPattern[]>([])
  const [categories, setCategories] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("patterns")

  useEffect(() => {
    if (!jobDescription) return

    const analyzePatterns = async () => {
      setLoading(true)
      try {
        const extractedPatterns = await extractSkillPatterns(jobDescription)
        setPatterns(extractedPatterns)

        const categorized = categorizeSkills(extractedPatterns)
        setCategories(categorized)
      } catch (e) {
        console.error("Error analyzing patterns:", e)
      } finally {
        setLoading(false)
      }
    }

    analyzePatterns()
  }, [jobDescription])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Skill Pattern Analysis</CardTitle>
        <CardDescription>Identified skill patterns and categories from the job description</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="patterns">Skill Patterns</TabsTrigger>
            <TabsTrigger value="categories">Skill Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : patterns.length > 0 ? (
              <div className="space-y-4">
                {patterns.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{pattern.category}</h3>
                      <Badge variant={pattern.required ? "default" : "outline"}>
                        {pattern.required ? "Required" : "Preferred"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{pattern.relationshipType}</p>
                    <div className="flex flex-wrap gap-2">
                      {pattern.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">"{pattern.originalText}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No skill patterns detected. Try a different job description.
              </p>
            )}
          </TabsContent>

          <TabsContent value="categories">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : Object.keys(categories).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(categories)
                  .filter(([_, skills]) => skills.length > 0)
                  .map(([category, skills]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h3 className="font-medium capitalize mb-2">{category.replace("_", " ")}</h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No categorized skills available.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

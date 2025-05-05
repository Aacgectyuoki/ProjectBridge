"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Download, Share2 } from "lucide-react"

interface SkillCategory {
  name: string
  skills: string[]
  color?: string
}

interface DetailedSkillsViewProps {
  skills: Record<string, string[]>
  title?: string
  description?: string
  allowExport?: boolean
}

export function DetailedSkillsView({
  skills,
  title = "Detailed Skills Analysis",
  description = "Comprehensive breakdown of detected skills by category",
  allowExport = true,
}: DetailedSkillsViewProps) {
  const [expanded, setExpanded] = useState(false)

  // Define categories with colors
  const categories: SkillCategory[] = [
    { name: "technical", skills: skills.technical || [], color: "bg-blue-100 text-blue-800" },
    { name: "languages", skills: skills.languages || [], color: "bg-purple-100 text-purple-800" },
    { name: "frameworks", skills: skills.frameworks || [], color: "bg-indigo-100 text-indigo-800" },
    { name: "tools", skills: skills.tools || [], color: "bg-green-100 text-green-800" },
    { name: "databases", skills: skills.databases || [], color: "bg-amber-100 text-amber-800" },
    { name: "platforms", skills: skills.platforms || [], color: "bg-orange-100 text-orange-800" },
    { name: "methodologies", skills: skills.methodologies || [], color: "bg-teal-100 text-teal-800" },
    { name: "soft", skills: skills.soft || [], color: "bg-rose-100 text-rose-800" },
  ]

  // Filter out empty categories
  const nonEmptyCategories = categories.filter((category) => category.skills.length > 0)

  // Count total skills
  const totalSkills = nonEmptyCategories.reduce((total, category) => total + category.skills.length, 0)

  // Export skills as JSON
  const exportSkills = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(skills, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "skills_analysis.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {allowExport && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportSkills}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            {totalSkills} skills detected across {nonEmptyCategories.length} categories
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Skills</TabsTrigger>
            {nonEmptyCategories.map((category) => (
              <TabsTrigger key={category.name} value={category.name} className="capitalize">
                {category.name} ({category.skills.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-4">
              {nonEmptyCategories.map((category) => (
                <div key={category.name}>
                  <h3 className="text-sm font-medium capitalize mb-2">{category.name} Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.slice(0, expanded ? undefined : 5).map((skill) => (
                      <Badge key={skill} className={category.color}>
                        {skill}
                      </Badge>
                    ))}
                    {!expanded && category.skills.length > 5 && (
                      <Badge variant="outline">+{category.skills.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              ))}
              {nonEmptyCategories.some((category) => category.skills.length > 5) && (
                <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="mt-2 text-gray-500">
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" /> Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" /> Show All Skills
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>

          {nonEmptyCategories.map((category) => (
            <TabsContent key={category.name} value={category.name}>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <Badge key={skill} className={category.color}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

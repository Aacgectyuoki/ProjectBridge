"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface DetailedSkillsViewProps {
  technicalSkills: string[]
  softSkills: string[]
}

export function DetailedSkillsView({ technicalSkills, softSkills }: DetailedSkillsViewProps) {
  const [showAllTechnical, setShowAllTechnical] = useState(false)
  const [showAllSoft, setShowAllSoft] = useState(false)

  // Determine how many skills to show initially
  const initialTechnicalCount = 12
  const initialSoftCount = 5

  // Get the skills to display based on the current state
  const displayedTechnicalSkills = showAllTechnical ? technicalSkills : technicalSkills.slice(0, initialTechnicalCount)

  const displayedSoftSkills = showAllSoft ? softSkills : softSkills.slice(0, initialSoftCount)

  // Check if we need to show the "Show More" button
  const hasMoreTechnical = technicalSkills.length > initialTechnicalCount
  const hasMoreSoft = softSkills.length > initialSoftCount

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Technical Skills:</CardTitle>
          <CardDescription>{technicalSkills.length} technical skills identified in your resume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {displayedTechnicalSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-sm py-1">
                {skill}
              </Badge>
            ))}
          </div>
          {hasMoreTechnical && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full flex items-center justify-center"
              onClick={() => setShowAllTechnical(!showAllTechnical)}
            >
              {showAllTechnical ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show More ({technicalSkills.length - initialTechnicalCount} more)
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Soft Skills:</CardTitle>
          <CardDescription>{softSkills.length} soft skills identified in your resume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {displayedSoftSkills.map((skill) => (
              <Badge key={skill} variant="outline" className="text-sm py-1 bg-green-50">
                {skill}
              </Badge>
            ))}
          </div>
          {hasMoreSoft && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full flex items-center justify-center"
              onClick={() => setShowAllSoft(!showAllSoft)}
            >
              {showAllSoft ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show More ({softSkills.length - initialSoftCount} more)
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

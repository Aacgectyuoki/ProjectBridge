"use client"

import { Check, X, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResumeValidatorResultsProps {
  validationResults: {
    hasEmail: boolean
    hasPhone: boolean
    hasLinks: boolean
    foundLinks: string[]
    suggestions: string[]
    skills?: {
      technical: string[]
      soft: string[]
    }
  }
}

export function ResumeValidatorResults({ validationResults }: ResumeValidatorResultsProps) {
  const [showAllTechnical, setShowAllTechnical] = useState(false)
  const [showAllSoft, setShowAllSoft] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Ensure skills object exists with defaults
  const skills = validationResults.skills || { technical: [], soft: [] }

  // Limit the number of skills shown initially
  const technicalSkillsToShow = showAllTechnical ? skills.technical : skills.technical.slice(0, 12)
  const softSkillsToShow = showAllSoft ? skills.soft : skills.soft.slice(0, 5)

  // Determine if we need "show more" buttons
  const hasTechnicalMore = skills.technical.length > 12
  const hasSoftMore = skills.soft.length > 5

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Resume Quick Check</CardTitle>
        <CardDescription>Basic check of resume elements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              {validationResults.hasEmail ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Email Found
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> No Email
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {validationResults.hasPhone ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Phone Found
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> No Phone
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {validationResults.hasLinks ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Links Found
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> No Links
                </Badge>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {skills.technical.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Technical Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {technicalSkillsToShow.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {skill}
                  </Badge>
                ))}
                {hasTechnicalMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllTechnical(!showAllTechnical)}
                    className="h-6 px-2 text-xs flex items-center gap-1"
                  >
                    {showAllTechnical ? (
                      <>
                        <ChevronUp className="h-3 w-3" /> Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show {skills.technical.length - 12} More
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {skills.soft.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Soft Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {softSkillsToShow.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    {skill}
                  </Badge>
                ))}
                {hasSoftMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllSoft(!showAllSoft)}
                    className="h-6 px-2 text-xs flex items-center gap-1"
                  >
                    {showAllSoft ? (
                      <>
                        <ChevronUp className="h-3 w-3" /> Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show {skills.soft.length - 5} More
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {validationResults.foundLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Found Links:</h4>
              <div className="space-y-2">
                {validationResults.foundLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-sm truncate max-w-[80%]">{link}</span>
                    <Button variant="ghost" size="sm" onClick={() => window.open(link, "_blank")} className="h-8 px-2">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && validationResults.suggestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                  className="h-6 px-2 text-xs"
                >
                  Dismiss
                </Button>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {validationResults.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

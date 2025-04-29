"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw } from "lucide-react"
import { SkillsLogger } from "@/utils/skills-logger"

export function SkillsLogViewer() {
  const [logs, setLogs] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  // Add a method to show all unique skills detected
  const [showAllSkills, setShowAllSkills] = useState(false)
  const allSkills = SkillsLogger.getAllDetectedSkills()

  const loadLogs = () => {
    const skillsLogs = SkillsLogger.getSkillsLogs()
    setLogs(skillsLogs)
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleClearLogs = () => {
    SkillsLogger.clearLogs()
    setLogs([])
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" className="bg-white shadow-md" onClick={() => setIsVisible(true)}>
          Show Skills Log
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-auto bg-white shadow-xl rounded-lg border z-50">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Skills Analysis Log</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ×
            </Button>
          </div>
          <CardDescription>Record of detected skills from resume analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={loadLogs} className="gap-1">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              className="gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </Button>
            {/* Add this button to the component's UI, right after the other buttons */}
            <Button variant="outline" size="sm" onClick={() => setShowAllSkills(!showAllSkills)} className="gap-1">
              {showAllSkills ? "Hide All Skills" : "Show All Skills"}
            </Button>
          </div>

          {showAllSkills && (
            <div className="border rounded-md p-3 mb-4">
              <h3 className="font-medium mb-2">All Detected Skills</h3>

              <div className="space-y-2">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">
                    Technical Skills ({allSkills.technical.length}):
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {allSkills.technical.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Soft Skills ({allSkills.soft.length}):</h4>
                  <div className="flex flex-wrap gap-1">
                    {allSkills.soft.map((skill, i) => (
                      <Badge key={i} variant="outline" className="border-green-200 text-green-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No skills logs available</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="border rounded-md p-3 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {log.source === "role-selection" ? `Role Focus: ${log.roleFocus}` : `Source: ${log.source}`}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>

                  {log.source !== "role-selection" && (
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Technical Skills:</h4>
                        <div className="flex flex-wrap gap-1">
                          {log.technicalSkills.length > 0 ? (
                            log.technicalSkills.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">None detected</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Soft Skills:</h4>
                        <div className="flex flex-wrap gap-1">
                          {log.softSkills.length > 0 ? (
                            log.softSkills.map((skill, i) => (
                              <Badge key={i} variant="outline" className="border-green-200 text-green-800">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">None detected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {log.source === "role-selection" && (
                    <div className="mt-1">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">{log.roleFocus}</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

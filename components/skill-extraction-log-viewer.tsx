"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, RefreshCw, FileText, Briefcase, Clock } from "lucide-react"
import { EnhancedSkillsLogger, type ExtractedSkillsLog } from "@/utils/enhanced-skills-logger"

export function SkillExtractionLogViewer() {
  const [logs, setLogs] = useState<ExtractedSkillsLog[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("resume")

  const loadLogs = () => {
    const skillsLogs = EnhancedSkillsLogger.getLogs()
    setLogs(skillsLogs)
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleClearLogs = () => {
    EnhancedSkillsLogger.clearLogs()
    setLogs([])
  }

  const getSourceIcon = (source: string) => {
    if (source.includes("resume")) return <FileText className="h-4 w-4" />
    if (source.includes("job")) return <Briefcase className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  const filteredLogs = logs.filter((log) => activeTab === "all" || log.source.includes(activeTab))

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4">
        <Button variant="outline" size="sm" className="bg-white shadow-md" onClick={() => setIsVisible(true)}>
          Show Extraction Logs
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 w-[600px] max-h-[80vh] overflow-auto bg-white shadow-xl rounded-lg border z-50">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Skill Extraction Logs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ×
            </Button>
          </div>
          <CardDescription>Detailed logs of skills extracted from inputs</CardDescription>
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
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="job">Job Description</TabsTrigger>
              <TabsTrigger value="all">All Logs</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No logs available</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredLogs.map((log, index) => (
                <Card
                  key={index}
                  className="border-l-4"
                  style={{ borderLeftColor: log.source.includes("resume") ? "#818cf8" : "#f87171" }}
                >
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(log.source)}
                        <span className="font-medium capitalize">{log.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                        {log.processingTime && (
                          <Badge variant="outline" className="text-xs">
                            {log.processingTime}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Input Preview:</p>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono line-clamp-2">{log.rawInput}</div>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(log.extractedSkills).map(([category, skills]) => {
                        if (!skills || skills.length === 0) return null

                        return (
                          <div key={category} className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 capitalize">{category}:</p>
                            <div className="flex flex-wrap gap-1">
                              {skills.map((skill, i) => (
                                <Badge
                                  key={i}
                                  variant={category === "soft" ? "outline" : "secondary"}
                                  className={
                                    category === "soft"
                                      ? "border-green-200 text-green-800"
                                      : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

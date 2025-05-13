"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, RefreshCw, FileText, Briefcase, Clock, Download } from "lucide-react"
import { EnhancedSkillsLogger, type ExtractedSkillsLog } from "@/utils/enhanced-skills-logger"

export function DetailedSkillExtractionLog() {
  const [logs, setLogs] = useState<ExtractedSkillsLog[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedLog, setSelectedLog] = useState<ExtractedSkillsLog | null>(null)

  const loadLogs = () => {
    const skillsLogs = EnhancedSkillsLogger.getLogs()
    setLogs(skillsLogs)

    // Select the most recent log by default
    if (skillsLogs.length > 0 && !selectedLog) {
      setSelectedLog(skillsLogs[0])
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleClearLogs = () => {
    EnhancedSkillsLogger.clearLogs()
    setLogs([])
    setSelectedLog(null)
  }

  const handleExportLogs = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `skill-extraction-logs-${new Date().toISOString()}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()
    } catch (error) {
      console.error("Error exporting logs:", error)
    }
  }

  const getSourceIcon = (source: string) => {
    if (source.includes("resume")) return <FileText className="h-4 w-4" />
    if (source.includes("job")) return <Briefcase className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  const getSourceLabel = (source: string) => {
    if (source.includes("resume")) return "Resume"
    if (source.includes("job")) return "Job Description"
    return "Other"
  }

  const filteredLogs = logs.filter(
    (log) =>
      activeTab === "all" ||
      (activeTab === "resume" && log.source.includes("resume")) ||
      (activeTab === "job" && log.source.includes("job")),
  )

  const getTotalSkillCount = (log: ExtractedSkillsLog) => {
    let count = 0
    Object.values(log.extractedSkills).forEach((skillArray) => {
      if (Array.isArray(skillArray)) {
        count += skillArray.length
      }
    })
    return count
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4">
        <Button variant="outline" size="sm" className="bg-white shadow-md" onClick={() => setIsVisible(true)}>
          Show Detailed Extraction Logs
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 w-[800px] max-h-[80vh] overflow-auto bg-white shadow-xl rounded-lg border z-50">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Detailed Skill Extraction Logs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ×
            </Button>
          </div>
          <CardDescription>Comprehensive logs of skills extracted from inputs with confidence scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadLogs} className="gap-1">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportLogs} className="gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
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
              <TabsTrigger value="all">All Logs</TabsTrigger>
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="job">Job Description</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 border-r pr-4">
              {filteredLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No logs available</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md cursor-pointer hover:bg-gray-50 ${selectedLog === log ? "bg-gray-100 border border-gray-300" : ""}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center gap-2">
                        {getSourceIcon(log.source)}
                        <span className="font-medium text-sm">{getSourceLabel(log.source)}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {getTotalSkillCount(log)} skills
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">{log.rawInput.substring(0, 50)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2">
              {selectedLog ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{getSourceLabel(selectedLog.source)}</h3>
                      <p className="text-sm text-gray-500">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                    </div>
                    {selectedLog.processingTime && (
                      <Badge variant="outline">Processing time: {selectedLog.processingTime}ms</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Input Preview</h4>
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-[100px] overflow-y-auto">
                      {selectedLog.rawInput}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Extracted Skills</h4>

                    {Object.entries(selectedLog.extractedSkills).map(([category, skills]) => {
                      if (!skills || skills.length === 0) return null

                      return (
                        <div key={category} className="space-y-1">
                          <h5 className="text-xs font-medium text-gray-700 capitalize">
                            {category.replace("ai_", "AI ").replace("_", " ")}
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(skills) ? (
                              skills.map((skill, i) => {
                                const skillName = typeof skill === "string" ? skill : skill.name
                                const confidence =
                                  typeof skill === "object" && skill.confidence !== undefined ? skill.confidence : 0.5

                                let badgeClass = "bg-gray-100 text-gray-800"
                                if (confidence >= 0.8) badgeClass = "bg-green-100 text-green-800"
                                else if (confidence >= 0.5) badgeClass = "bg-yellow-100 text-yellow-800"

                                return (
                                  <Badge key={i} className={badgeClass}>
                                    {skillName}
                                    {typeof skill === "object" && skill.confidence !== undefined && (
                                      <span className="ml-1 text-xs opacity-70">
                                        {Math.round(skill.confidence * 100)}%
                                      </span>
                                    )}
                                  </Badge>
                                )
                              })
                            ) : (
                              <span className="text-sm text-gray-500">Invalid skill data</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Select a log to view details</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

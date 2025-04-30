"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, RefreshCw, Download, TrendingUp, BarChart3 } from "lucide-react"
import { ProjectRecommendationsLogger, type ProjectRecommendationLog } from "@/utils/project-recommendations-logger"

export function ProjectRecommendationsLogViewer() {
  const [logs, setLogs] = useState<ProjectRecommendationLog[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("logs")
  const [stats, setStats] = useState<{
    totalRecommendations: number
    mostRecommendedProject: { id: string; title: string; count: number } | null
    mostAddressedSkill: { skill: string; count: number } | null
  }>({
    totalRecommendations: 0,
    mostRecommendedProject: null,
    mostAddressedSkill: null,
  })

  const loadLogs = () => {
    const projectLogs = ProjectRecommendationsLogger.getLogs()
    setLogs(projectLogs)
    setStats(ProjectRecommendationsLogger.getProjectRecommendationStats())
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleClearLogs = () => {
    ProjectRecommendationsLogger.clearLogs()
    setLogs([])
    setStats({
      totalRecommendations: 0,
      mostRecommendedProject: null,
      mostAddressedSkill: null,
    })
  }

  const handleExportLogs = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `project-recommendation-logs-${new Date().toISOString()}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()
    } catch (error) {
      console.error("Error exporting logs:", error)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" className="bg-white shadow-md" onClick={() => setIsVisible(true)}>
          Show Project Recommendations Logs
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-[800px] max-h-[80vh] overflow-auto bg-white shadow-xl rounded-lg border z-50">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Project Recommendations Logs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ×
            </Button>
          </div>
          <CardDescription>Track project recommendations and their projected impact on resume matches</CardDescription>
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Recommendation Logs</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "logs" ? (
            <div className="space-y-4">
              {logs.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No project recommendation logs available</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{log.projectTitle}</h3>
                      <Badge variant="outline">{new Date(log.timestamp).toLocaleString()}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Target Role: {log.targetRole}</p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.skillsAddressed.slice(0, 5).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {log.skillsAddressed.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{log.skillsAddressed.length - 5} more
                        </Badge>
                      )}
                    </div>

                    {log.currentMatchPercentage !== undefined && (
                      <div className="flex items-center gap-2 mt-3 text-sm">
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${log.currentMatchPercentage}%` }}></div>
                        </div>
                        <span className="text-gray-600">{log.currentMatchPercentage}%</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">+{log.estimatedMatchImprovement}%</span>
                        <span className="text-gray-600">=</span>
                        <span className="font-medium">{log.projectedMatchPercentage}%</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{stats.totalRecommendations}</div>
                  <div className="text-sm text-blue-600">Total Recommendations</div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-md p-4 text-center">
                  <div className="text-xl font-bold text-green-700 truncate">
                    {stats.mostRecommendedProject?.title || "N/A"}
                  </div>
                  <div className="text-sm text-green-600">Most Recommended Project</div>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-md p-4 text-center">
                  <div className="text-xl font-bold text-purple-700 truncate">
                    {stats.mostAddressedSkill?.skill || "N/A"}
                  </div>
                  <div className="text-sm text-purple-600">Most Addressed Skill</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-500" />
                  Recommendation Insights
                </h3>

                <ul className="space-y-2 text-sm">
                  <li>
                    • Projects recommended focus primarily on {stats.mostAddressedSkill?.skill || "various skills"}
                  </li>
                  <li>
                    • Average match improvement:{" "}
                    {logs.length > 0
                      ? Math.round(logs.reduce((sum, log) => sum + log.estimatedMatchImprovement, 0) / logs.length)
                      : 0}
                    %
                  </li>
                  <li>
                    • Most recommendations made on:{" "}
                    {logs.length > 0 ? new Date(logs[0].timestamp).toLocaleDateString() : "N/A"}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

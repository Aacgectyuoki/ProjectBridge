"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SkillExtractionLogViewer({ source = "job-description" }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Get logs from localStorage
    const storedLogs = localStorage.getItem(`${source}-logs`)
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs))
      } catch (error) {
        console.error("Error parsing logs:", error)
        setLogs([])
      }
    }
  }, [source])

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skill Extraction Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No logs available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Extraction Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.map((log, index) => (
          <div key={index} className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Extraction #{index + 1}</h3>
              <Badge variant="outline">{log.timestamp || "Unknown time"}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Technical Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {log.skills?.technical?.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  )) || "None"}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Soft Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {log.skills?.soft?.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  )) || "None"}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Processing Time</h4>
              <p className="text-sm text-muted-foreground">{log.processingTime || "Unknown"} ms</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

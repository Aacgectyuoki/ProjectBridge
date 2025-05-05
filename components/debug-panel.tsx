"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { debugLocalStorage } from "@/utils/debug-utils"
import { getCurrentSessionId } from "@/utils/analysis-session-manager"
import { ChevronDown, ChevronUp, Bug, RefreshCw, Trash2 } from "lucide-react"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [sessionData, setSessionData] = useState<Record<string, any>>({})

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const refreshSessionData = () => {
    try {
      const sessionId = getCurrentSessionId()
      addLog(`Current session ID: ${sessionId}`)

      // Get all localStorage data
      const data: Record<string, any> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            const value = localStorage.getItem(key)
            data[key] = value ? JSON.parse(value) : null
          } catch (e) {
            data[key] = localStorage.getItem(key) + " (not JSON)"
          }
        }
      }

      setSessionData(data)
      addLog("Session data refreshed")
    } catch (error) {
      addLog(`Error refreshing session data: ${error.message}`)
    }
  }

  const clearSessionData = () => {
    try {
      localStorage.clear()
      setSessionData({})
      addLog("All session data cleared")
    } catch (error) {
      addLog(`Error clearing session data: ${error.message}`)
    }
  }

  const logToConsole = () => {
    debugLocalStorage()
    addLog("Session data logged to console")
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader className="pb-2">
        <CollapsibleTrigger onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Bug className="h-4 w-4 mr-2" />
            <CardTitle className="text-sm">Debug Panel</CardTitle>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
      </CardHeader>
      <Collapsible open={isOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={refreshSessionData}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Refresh Data
              </Button>
              <Button size="sm" variant="outline" onClick={logToConsole}>
                <Bug className="h-3 w-3 mr-2" />
                Log to Console
              </Button>
              <Button size="sm" variant="outline" onClick={clearSessionData} className="text-red-500">
                <Trash2 className="h-3 w-3 mr-2" />
                Clear All Data
              </Button>
            </div>

            <div className="text-xs">
              <div className="font-medium mb-1">Session ID: {getCurrentSessionId()}</div>
              <div className="mb-2">
                <div className="font-medium">Debug Logs:</div>
                <div className="bg-gray-100 p-2 rounded max-h-24 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 italic">No logs yet</div>
                  ) : (
                    logs.map((log, index) => <div key={index}>{log}</div>)
                  )}
                </div>
                {logs.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearLogs} className="mt-1 h-6 text-xs">
                    Clear Logs
                  </Button>
                )}
              </div>

              <div>
                <div className="font-medium mb-1">Session Data:</div>
                <div className="bg-gray-100 p-2 rounded max-h-48 overflow-y-auto">
                  {Object.keys(sessionData).length === 0 ? (
                    <div className="text-gray-500 italic">No session data</div>
                  ) : (
                    Object.entries(sessionData).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <span className="font-medium">{key}:</span>{" "}
                        {typeof value === "object"
                          ? JSON.stringify(value).substring(0, 100) + "..."
                          : String(value).substring(0, 100) + "..."}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <CardDescription className="text-xs">
              This panel is for debugging purposes only. It allows you to inspect and manage session data.
            </CardDescription>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

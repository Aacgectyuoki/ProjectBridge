"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function GlobalErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Add global error handler
    const errorHandler = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error)
      setError(event.error || new Error("Unknown error occurred"))
      setHasError(true)

      // Prevent default browser error handling
      event.preventDefault()
    }

    // Add unhandled promise rejection handler
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
      setHasError(true)

      // Prevent default browser error handling
      event.preventDefault()
    }

    // Register handlers
    window.addEventListener("error", errorHandler)
    window.addEventListener("unhandledrejection", rejectionHandler)

    // Clean up
    return () => {
      window.removeEventListener("error", errorHandler)
      window.removeEventListener("unhandledrejection", rejectionHandler)
    }
  }, [])

  const resetError = () => {
    setHasError(false)
    setError(null)
    window.location.reload()
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">
                {error?.message || "An unexpected error occurred. Please try refreshing the page."}
              </p>
              {error?.stack && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer">Technical details</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-red-50 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

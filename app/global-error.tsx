"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md space-y-6">
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="text-gray-600">
              We apologize for the inconvenience. Our team has been notified of this issue.
            </p>
            {error.message && (
              <div className="rounded-md bg-red-50 p-4 text-left">
                <p className="text-sm text-red-800">{error.message}</p>
              </div>
            )}
            <Button onClick={reset} className="mt-4">
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}

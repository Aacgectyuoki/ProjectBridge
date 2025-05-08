"use client"

import type React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { handleError, ErrorCategory, ErrorSeverity } from "@/utils/error-handler"
// Add Sentry import at the top of the file
import * as Sentry from "@sentry/nextjs"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  // Update the componentDidCatch method to report to Sentry
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Log the error
    handleError(error, ErrorCategory.UNKNOWN, ErrorSeverity.ERROR, { notifyUser: false })

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras({ componentStack: errorInfo.componentStack })
      Sentry.captureException(error)
    })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset the error state if props change and resetOnPropsChange is true
    if (this.state.hasError && this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      this.reset()
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Otherwise, use the default error UI
      return (
        <Card className="w-full my-4 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-700">
              <p className="font-medium">Error: {this.state.error?.message || "Unknown error"}</p>
              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack trace</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-[200px] p-2 bg-red-100 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={this.reset}
              className="flex items-center gap-1 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * A hook to create an error boundary around a component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  // Set display name for better debugging
  const displayName = Component.displayName || Component.name || "Component"
  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`

  return WithErrorBoundary
}

import * as Sentry from "@sentry/nextjs"
import { monitorPerformance, monitorSpan } from "./performance-monitoring"
import { handleError, ErrorCategory, ErrorSeverity } from "./error-handler"

/**
 * Monitor a specific feature with performance tracking and error reporting
 * @param featureName The name of the feature being monitored
 * @param fn The function implementing the feature
 * @returns The result of the function
 */
export async function monitorFeature<T>(featureName: string, fn: () => Promise<T>): Promise<T> {
  // Add breadcrumb for feature start
  Sentry.addBreadcrumb({
    category: "feature",
    message: `Starting feature: ${featureName}`,
    level: "info",
  })

  try {
    // Monitor performance of the feature
    const result = await monitorPerformance(`feature:${featureName}`, "feature_execution", fn)

    // Add breadcrumb for feature completion
    Sentry.addBreadcrumb({
      category: "feature",
      message: `Completed feature: ${featureName}`,
      level: "info",
    })

    return result
  } catch (error) {
    // Add breadcrumb for feature failure
    Sentry.addBreadcrumb({
      category: "feature",
      message: `Failed feature: ${featureName}`,
      level: "error",
      data: {
        error: error instanceof Error ? error.message : String(error),
      },
    })

    // Handle and report the error
    handleError(error as Error, ErrorCategory.UNKNOWN, ErrorSeverity.ERROR, { logToService: true })

    // Re-throw the error
    throw error
  }
}

/**
 * Monitor a specific sub-operation within a feature
 * @param operationName The name of the operation
 * @param fn The function implementing the operation
 * @returns The result of the function
 */
export async function monitorOperation<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
  return monitorSpan(operationName, "operation", fn)
}

/**
 * Create a decorator for monitoring class methods
 * @param featureName The name of the feature
 * @param errorCategory The category of errors from this feature
 */
export function monitorMethod(featureName: string, errorCategory: ErrorCategory = ErrorCategory.UNKNOWN) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const methodName = `${featureName}.${propertyKey}`

      // Add breadcrumb for method start
      Sentry.addBreadcrumb({
        category: "method",
        message: `Starting method: ${methodName}`,
        level: "info",
        data: { args: JSON.stringify(args) },
      })

      try {
        // Monitor performance of the method
        const result = await monitorPerformance(methodName, "method_execution", () => originalMethod.apply(this, args))

        // Add breadcrumb for method completion
        Sentry.addBreadcrumb({
          category: "method",
          message: `Completed method: ${methodName}`,
          level: "info",
        })

        return result
      } catch (error) {
        // Add breadcrumb for method failure
        Sentry.addBreadcrumb({
          category: "method",
          message: `Failed method: ${methodName}`,
          level: "error",
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
        })

        // Handle and report the error
        handleError(error as Error, errorCategory, ErrorSeverity.ERROR, { logToService: true })

        // Re-throw the error
        throw error
      }
    }

    return descriptor
  }
}

import * as Sentry from "@sentry/nextjs"

/**
 * Monitors the performance of a function and reports it to Sentry
 * @param name The name of the transaction
 * @param operation The type of operation being performed
 * @param fn The function to monitor
 * @returns The result of the function
 */
export async function monitorPerformance<T>(name: string, operation: string, fn: () => Promise<T>): Promise<T> {
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
  })

  // Set the transaction as the current span so child spans are correctly nested
  Sentry.configureScope((scope) => {
    scope.setSpan(transaction)
  })

  try {
    // Execute the function
    const result = await fn()
    transaction.setStatus("ok")
    return result
  } catch (error) {
    // Set transaction status to error
    transaction.setStatus("internal_error")
    // Re-throw the error to be handled by the caller
    throw error
  } finally {
    // Finish the transaction
    transaction.finish()
  }
}

/**
 * Creates a monitored version of a function that reports performance to Sentry
 * @param name The name of the transaction
 * @param operation The type of operation being performed
 * @param fn The function to monitor
 * @returns A wrapped function that monitors performance
 */
export function createMonitoredFunction<T, Args extends any[]>(
  name: string,
  operation: string,
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    return monitorPerformance(name, operation, () => fn(...args))
  }
}

/**
 * Monitors a specific section of code and reports it as a span to Sentry
 * @param name The name of the span
 * @param operation The type of operation being performed
 * @param fn The function to monitor
 * @returns The result of the function
 */
export async function monitorSpan<T>(name: string, operation: string, fn: () => Promise<T>): Promise<T> {
  const span = Sentry.getCurrentHub().getScope()?.getSpan()?.startChild({
    op: operation,
    description: name,
  })

  try {
    // Execute the function
    const result = await fn()
    span?.setStatus("ok")
    return result
  } catch (error) {
    // Set span status to error
    span?.setStatus("internal_error")
    // Re-throw the error to be handled by the caller
    throw error
  } finally {
    // Finish the span
    span?.finish()
  }
}

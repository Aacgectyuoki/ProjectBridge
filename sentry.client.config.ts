import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will enable profiling
  // This is only recommended in production
  profilesSampleRate: 0.1,

  // Enable performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling based on route complexity
      tracingOrigins: ["localhost", /^\//],
    }),
    new Sentry.Replay({
      // Capture 10% of all sessions
      sessionSampleRate: 0.1,
      // Capture 100% of sessions with an error
      errorSampleRate: 1.0,
    }),
  ],

  // Adjust this value to control which errors are reported
  // Lower values = more errors reported
  // Higher values = fewer errors reported
  // 0 = all errors reported
  // 1.0 = no errors reported
  sampleRate: 0.8,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Set environment
  environment: process.env.NODE_ENV,

  // Ignore specific errors
  ignoreErrors: [
    // Add patterns for errors you want to ignore
    "ResizeObserver loop limit exceeded",
    "Network request failed",
    /^ChunkLoadError/,
  ],

  // Add debug option for development
  debug: process.env.NODE_ENV === "development",

  // Set release version
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "local",
})

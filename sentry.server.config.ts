import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will enable profiling
  profilesSampleRate: 0.1,

  // Enable performance monitoring
  integrations: [new Sentry.BrowserTracing()],

  // Adjust this value to control which errors are reported
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

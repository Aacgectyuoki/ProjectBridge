import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AnalysisStateProvider } from "@/components/analysis-state-provider"
import { ResponsiveNavbar } from "@/components/responsive-navbar"
import * as Sentry from "@sentry/nextjs"
import { GlobalErrorBoundary } from "@/components/global-error-boundary"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ProjectBridge",
  description: "Bridge the gap between your skills and job requirements",
    generator: 'v0.dev'
}

// Initialize Sentry user context
function initializeSentry() {
  // Set some default tags that will be included with all events
  Sentry.setTag("app_version", process.env.NEXT_PUBLIC_APP_VERSION || "development")

  // Add initial breadcrumb
  Sentry.addBreadcrumb({
    category: "app.lifecycle",
    message: "Application initialized",
    level: "info",
  })
}

// Call this on the client side only
if (typeof window !== "undefined") {
  initializeSentry()
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AnalysisStateProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GlobalErrorBoundary>
              <div className="flex flex-col min-h-screen">
                <ResponsiveNavbar />
                <main className="flex-grow pt-16">{children}</main>
              </div>
            </GlobalErrorBoundary>
          </ThemeProvider>
        </AnalysisStateProvider>
      </body>
    </html>
  )
}

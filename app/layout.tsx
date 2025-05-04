import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AnalysisStateProvider } from "@/components/analysis-state-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ProjectBridge",
  description: "Bridge the gap between your skills and job requirements",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalysisStateProvider>{children}</AnalysisStateProvider>
      </body>
    </html>
  )
}

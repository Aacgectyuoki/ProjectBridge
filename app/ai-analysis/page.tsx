"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code, ArrowLeft } from "lucide-react"
import { AISkillGapAnalysis } from "@/components/ai-skill-gap-analysis"
import { AIProjectRecommendations } from "@/components/ai-project-recommendations"

export default function AIAnalysisPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Code className="h-6 w-6" />
            <span>ProjectBridge</span>
          </Link>
          <nav className="ml-auto flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/analyze" className="text-sm font-medium">
              Analysis
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/analyze">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Analysis
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">AI Engineering Skills Analysis</h1>
          </div>

          <div className="space-y-6">
            <AISkillGapAnalysis />
            <AIProjectRecommendations />
          </div>
        </div>
      </main>
    </div>
  )
}

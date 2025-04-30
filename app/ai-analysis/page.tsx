import { AIProjectRecommendations } from "@/components/ai-project-recommendations"
import { DetailedSkillExtractionLog } from "@/components/detailed-skill-extraction-log"
import { ProjectRecommendationsLogViewer } from "@/components/project-recommendations-log-viewer"

export default function AIAnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">AI Analysis</h1>

      <AIProjectRecommendations />

      {/* These components will be visible via their toggle buttons */}
      <DetailedSkillExtractionLog />
      <ProjectRecommendationsLogViewer />
    </div>
  )
}

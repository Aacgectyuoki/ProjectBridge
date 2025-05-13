import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"
import type { SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"

interface SkillMatchDisplayProps {
  analysis: SkillGapAnalysisResult
}

export function SkillMatchDisplay({ analysis }: SkillMatchDisplayProps) {
  console.log("SkillMatchDisplay - Fetched data:", analysis)

  if (!analysis) return null

  // Ensure we have valid data with fallbacks
  const safeAnalysis = {
    ...analysis,
    matchPercentage: analysis.matchPercentage || 0,
    missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
    matchedSkills: Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills : [],
  }

  // Calculate the number of matched and missing skills
  const matchedCount = safeAnalysis.matchedSkills.length
  const missingCount = safeAnalysis.missingSkills.length
  const totalSkills = matchedCount + missingCount

  // Determine the match status text and color
  let matchStatusText = ""
  let matchStatusColor = ""

  if (safeAnalysis.matchPercentage >= 80) {
    matchStatusText = "Excellent Match"
    matchStatusColor = "text-green-600"
  } else if (safeAnalysis.matchPercentage >= 60) {
    matchStatusText = "Good Match"
    matchStatusColor = "text-blue-600"
  } else if (safeAnalysis.matchPercentage >= 40) {
    matchStatusText = "Fair Match"
    matchStatusColor = "text-orange-600"
  } else {
    matchStatusText = "Poor Match"
    matchStatusColor = "text-red-600"
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold">Skills Match</h2>
              <p className={`text-xl font-semibold ${matchStatusColor}`}>{matchStatusText}</p>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <Progress value={safeAnalysis.matchPercentage} className="h-3" />
              <div className="text-center mt-2 font-medium text-lg">{safeAnalysis.matchPercentage}%</div>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-1 font-medium">{matchedCount}</p>
                <p className="text-sm text-gray-500">Matched</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <p className="mt-1 font-medium">{missingCount}</p>
                <p className="text-sm text-gray-500">Missing</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

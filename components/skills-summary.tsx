import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb } from "lucide-react"
import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"

interface SkillsSummaryProps {
  analysis: ResumeAnalysisResult | null
}

export function SkillsSummary({ analysis }: SkillsSummaryProps) {
  if (!analysis || !analysis.skills) return null

  const technicalSkills = analysis.skills.technical || []
  const softSkills = analysis.skills.soft || []

  return (
    <Card className="bg-white">
      <CardContent className="pt-6 pb-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-bold">Skills Detected in Your Resume</h2>
          </div>

          <p className="text-gray-600">
            We found {technicalSkills.length} technical skills and {softSkills.length} soft skills in your resume
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {technicalSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 text-base rounded-full"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Soft Skills</h3>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-green-200 text-green-800 px-4 py-2 text-base rounded-full"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

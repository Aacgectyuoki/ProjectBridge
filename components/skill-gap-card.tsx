import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export function SkillGapCard({ skill }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{skill.name}</CardTitle>
            <CardDescription>Required Level: {skill.level}</CardDescription>
          </div>
          <Badge className={`${getPriorityColor(skill.priority)}`}>{skill.priority} Priority</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p>This skill was identified as missing from your resume but is required for the job.</p>
            <p className="mt-2">Focus on building projects that demonstrate your ability to work with {skill.name}.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, Clock, ArrowRight } from "lucide-react"
import { SkillMatchDisplay } from "@/components/skill-match-display"
import type { SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"

// Add the import for the new component at the top of the file
import { SkillGapProjectSuggestions } from "@/components/skill-gap-project-suggestions"

interface SkillsGapAnalysisProps {
  analysis: SkillGapAnalysisResult
}

export function SkillsGapAnalysis({ analysis }: SkillsGapAnalysisProps) {
  if (!analysis) return null

  const getPriorityColor = (priority: string) => {
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

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case "High":
        return "bg-green-100 text-green-800 border-green-200"
      case "Medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Low":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Add the new SkillMatchDisplay component */}
      <SkillMatchDisplay />

      <Card>
        <CardHeader>
          <CardTitle>Skills Match Analysis</CardTitle>
          <CardDescription>Your resume matches {analysis.matchPercentage}% of the job requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Progress value={analysis.matchPercentage} className="h-2" />
              <p className="mt-2 text-sm text-gray-500">
                {analysis.matchPercentage < 50
                  ? "Significant skill gaps identified"
                  : analysis.matchPercentage < 75
                    ? "Some skill gaps identified"
                    : "Good match with some minor gaps"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Skills You Have
                </h3>
                <div className="space-y-2">
                  {analysis.matchedSkills.map((skill, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-green-50 rounded">
                      <span className="font-medium">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{skill.proficiency}</span>
                        <Badge className={`${getRelevanceColor(skill.relevance)}`}>{skill.relevance}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Skills You Need
                </h3>
                <div className="space-y-2">
                  {analysis.missingSkills.map((skill, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center text-sm p-2 rounded ${
                        skill.priority === "High"
                          ? "bg-red-100 border border-red-200"
                          : skill.priority === "Medium"
                            ? "bg-orange-50 border border-orange-200"
                            : "bg-red-50"
                      }`}
                    >
                      <span className={`font-medium ${skill.priority === "High" ? "font-bold" : ""}`}>
                        {skill.name}
                        {skill.name.toLowerCase() === "hugging face" && (
                          <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                            Critical Gap
                          </span>
                        )}
                      </span>
                      <Badge className={`${getPriorityColor(skill.priority)}`}>{skill.priority}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Analysis Summary</h3>
              <p className="text-gray-700">{analysis.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Skills Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Missing Skills Details</h2>
        {analysis.missingSkills.map((skill, index) => (
          <Card key={index}>
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
                  <p>{skill.context}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Missing Qualifications */}
      {analysis.missingQualifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Missing Qualifications</h2>
          {analysis.missingQualifications.map((qual, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{qual.description}</CardTitle>
                  <Badge variant={qual.importance === "Required" ? "default" : "outline"}>{qual.importance}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Possible alternative: {qual.alternative}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Missing Experience */}
      {analysis.missingExperience.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Missing Experience</h2>
          {analysis.missingExperience.map((exp, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{exp.area}</CardTitle>
                <CardDescription>Years Needed: {exp.yearsNeeded}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{exp.suggestion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Recommendations to Bridge the Gap</h2>
        {analysis.recommendations.map((rec, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{rec.type}</CardTitle>
                  <CardDescription>Estimated Time: {rec.timeToAcquire}</CardDescription>
                </div>
                <Badge className={`${getPriorityColor(rec.priority)}`}>{rec.priority} Priority</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{rec.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Suggestions for Critical Skill Gaps */}
      <SkillGapProjectSuggestions missingSkills={analysis.missingSkills} />

      {/* Enhanced Skill Gap Analysis */}
      <EnhancedSkillGapAnalysis analysis={analysis} />
    </div>
  )
}

// Add a more structured analysis component that includes:
// 1. Clear sections for Missing Required Skills, Missing Preferred Skills, Experience Gap, and Strengths
// 2. Detailed explanations for each missing skill
// 3. Proper formatting with nested lists and emphasis on important points

export function EnhancedSkillGapAnalysis({ analysis }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Missing Required Skills</h2>
      {analysis.missingSkills
        .filter((skill) => skill.priority === "High")
        .map((skill, index) => (
          <div key={index} className="border-l-4 border-red-500 pl-4 mb-4">
            <h3 className="font-bold text-lg">{skill.name}</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Required proficiency: {skill.level}</li>
              <li>{skill.context}</li>
              <li className="text-red-600 font-medium">
                This is a {skill.priority.toLowerCase()} priority skill for this role
              </li>
            </ul>
          </div>
        ))}

      {/* Similar sections for Missing Preferred Skills, Experience Gap, and Strengths */}
      {analysis.missingSkills.filter((skill) => skill.priority === "Medium").length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-4">Missing Preferred Skills</h2>
          {analysis.missingSkills
            .filter((skill) => skill.priority === "Medium")
            .map((skill, index) => (
              <div key={index} className="border-l-4 border-orange-500 pl-4 mb-4">
                <h3 className="font-bold text-lg">{skill.name}</h3>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>Required proficiency: {skill.level}</li>
                  <li>{skill.context}</li>
                  <li className="text-orange-600 font-medium">
                    This is a {skill.priority.toLowerCase()} priority skill for this role
                  </li>
                </ul>
              </div>
            ))}
        </>
      )}

      {analysis.missingExperience.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-4">Experience Gap</h2>
          {analysis.missingExperience.map((exp, index) => (
            <div key={index} className="border-l-4 border-purple-500 pl-4 mb-4">
              <h3 className="font-bold text-lg">{exp.area}</h3>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Years Needed: {exp.yearsNeeded}</li>
                <li>{exp.suggestion}</li>
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Assuming you have a way to determine strengths from the analysis */}
      {/* This is a placeholder - replace with actual logic */}
      {analysis.matchedSkills.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-4">Strengths</h2>
          {analysis.matchedSkills.map((skill, index) => (
            <div key={index} className="border-l-4 border-green-500 pl-4 mb-4">
              <h3 className="font-bold text-lg">{skill.name}</h3>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Proficiency: {skill.proficiency}</li>
                <li>Relevance: {skill.relevance}</li>
              </ul>
            </div>
          ))}
        </>
      )}

      <h2 className="text-xl font-bold mt-8">Recommendations to Bridge the Gap</h2>
      {/* Detailed recommendations with actionable steps */}
    </div>
  )
}

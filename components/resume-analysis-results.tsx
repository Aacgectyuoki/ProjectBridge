import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import { Briefcase, GraduationCap, Lightbulb, AlertTriangle } from "lucide-react"

interface ResumeAnalysisResultsProps {
  analysis: ResumeAnalysisResult
}

export function ResumeAnalysisResults({ analysis }: ResumeAnalysisResultsProps) {
  if (!analysis) return null

  // Ensure all properties exist with default values
  const safeAnalysis = {
    summary: analysis.summary || "No summary available",
    skills: {
      technical: analysis.skills?.technical || [],
      soft: analysis.skills?.soft || [],
    },
    experience: analysis.experience || [],
    education: analysis.education || [],
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Analysis</CardTitle>
          <CardDescription>Here's what we found in your resume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-medium mb-2">Professional Summary</h3>
            <p className="text-gray-700">{safeAnalysis.summary}</p>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-lg font-medium mb-2">Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Technical Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {safeAnalysis.skills.technical.length > 0 ? (
                    safeAnalysis.skills.technical.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No technical skills found</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Soft Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {safeAnalysis.skills.soft.length > 0 ? (
                    safeAnalysis.skills.soft.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No soft skills found</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-lg font-medium mb-2">Work Experience</h3>
            {safeAnalysis.experience.length > 0 ? (
              <div className="space-y-4">
                {safeAnalysis.experience.map((exp, index) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-gray-500 mt-1" />
                        <div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <h4 className="font-medium">{exp.title || "Unknown Position"}</h4>
                            <span className="text-sm text-gray-500">{exp.duration || "Unknown Duration"}</span>
                          </div>
                          <p className="text-sm text-gray-700">{exp.company || "Unknown Company"}</p>
                          <p className="text-sm mt-2">{exp.description || "No description available"}</p>
                          {exp.keyAchievements && exp.keyAchievements.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium">Key Achievements:</h5>
                              <ul className="text-sm list-disc list-inside">
                                {exp.keyAchievements.map((achievement, i) => (
                                  <li key={i}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No work experience found</p>
            )}
          </div>

          {/* Education */}
          <div>
            <h3 className="text-lg font-medium mb-2">Education</h3>
            {safeAnalysis.education.length > 0 ? (
              <div className="space-y-2">
                {safeAnalysis.education.map((edu, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-gray-500 mt-1" />
                    <div>
                      <h4 className="font-medium">{edu.degree || "Unknown Degree"}</h4>
                      <p className="text-sm text-gray-700">
                        {edu.institution || "Unknown Institution"}, {edu.year || "Unknown Year"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No education history found</p>
            )}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeAnalysis.strengths.length > 0 ? (
                  <ul className="text-sm list-disc list-inside">
                    {safeAnalysis.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No strengths identified</p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeAnalysis.weaknesses.length > 0 ? (
                  <ul className="text-sm list-disc list-inside">
                    {safeAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index}>{weakness}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No areas for improvement identified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

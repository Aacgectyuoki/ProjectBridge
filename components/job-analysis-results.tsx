import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { JobAnalysisResult } from "@/app/actions/analyze-job-description"
import { Briefcase, MapPin, Clock, GraduationCap, DollarSign, Award, CheckCircle, Star } from "lucide-react"

interface JobAnalysisResultsProps {
  analysis: JobAnalysisResult
}

export function JobAnalysisResults({ analysis }: JobAnalysisResultsProps) {
  if (!analysis) return null

  // Ensure all properties exist with default values
  const safeAnalysis = {
    title: analysis.title || "Untitled Position",
    company: analysis.company || "Unknown Company",
    location: analysis.location || "Location not specified",
    jobType: analysis.jobType || "Job type not specified",
    requiredSkills: analysis.requiredSkills || [],
    preferredSkills: analysis.preferredSkills || [],
    responsibilities: analysis.responsibilities || [],
    qualifications: {
      required: analysis.qualifications?.required || [],
      preferred: analysis.qualifications?.preferred || [],
    },
    experience: {
      level: analysis.experience?.level || "Not specified",
      years: analysis.experience?.years || "Not specified",
    },
    education: analysis.education || "Not specified",
    salary: analysis.salary || "Not specified",
    benefits: analysis.benefits || [],
    summary: analysis.summary || "No summary available",
    keywordsDensity: analysis.keywordsDensity || [],
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Analysis</CardTitle>
          <CardDescription>Here's what we found in the job description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Overview */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{safeAnalysis.title}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {safeAnalysis.company && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{safeAnalysis.company}</span>
                </div>
              )}
              {safeAnalysis.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{safeAnalysis.location}</span>
                </div>
              )}
              {safeAnalysis.jobType && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{safeAnalysis.jobType}</span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <p className="text-gray-700">{safeAnalysis.summary}</p>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <h3 className="text-lg font-medium mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {safeAnalysis.requiredSkills.length > 0 ? (
                safeAnalysis.requiredSkills.map((skill, index) => (
                  <Badge key={index} variant="default" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No specific required skills mentioned</p>
              )}
            </div>
          </div>

          {/* Preferred Skills */}
          {safeAnalysis.preferredSkills.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Preferred Skills</h3>
              <div className="flex flex-wrap gap-2">
                {safeAnalysis.preferredSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="border-indigo-200 text-indigo-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Responsibilities */}
          <div>
            <h3 className="text-lg font-medium mb-2">Key Responsibilities</h3>
            {safeAnalysis.responsibilities.length > 0 ? (
              <ul className="space-y-1 list-disc list-inside text-gray-700">
                {safeAnalysis.responsibilities.map((responsibility, index) => (
                  <li key={index}>{responsibility}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific responsibilities mentioned</p>
            )}
          </div>

          {/* Qualifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Required Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeAnalysis.qualifications.required.length > 0 ? (
                  <ul className="space-y-1 list-disc list-inside text-sm text-gray-700">
                    {safeAnalysis.qualifications.required.map((qualification, index) => (
                      <li key={index}>{qualification}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No specific required qualifications mentioned</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Preferred Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeAnalysis.qualifications.preferred.length > 0 ? (
                  <ul className="space-y-1 list-disc list-inside text-sm text-gray-700">
                    {safeAnalysis.qualifications.preferred.map((qualification, index) => (
                      <li key={index}>{qualification}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No specific preferred qualifications mentioned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Experience</h3>
              <div className="flex items-start gap-2">
                <Award className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Level:</span> {safeAnalysis.experience.level}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Years:</span> {safeAnalysis.experience.years}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Education</h3>
              <div className="flex items-start gap-2">
                <GraduationCap className="h-5 w-5 text-gray-500 mt-0.5" />
                <p className="text-gray-700">{safeAnalysis.education}</p>
              </div>
            </div>
          </div>

          {/* Compensation & Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeAnalysis.salary !== "Not specified" && (
              <div>
                <h3 className="text-lg font-medium mb-2">Compensation</h3>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                  <p className="text-gray-700">{safeAnalysis.salary}</p>
                </div>
              </div>
            )}
            {safeAnalysis.benefits.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Benefits</h3>
                <ul className="space-y-1 list-disc list-inside text-gray-700">
                  {safeAnalysis.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Keyword Density */}
          {safeAnalysis.keywordsDensity.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Top Keywords</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {safeAnalysis.keywordsDensity.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span className="font-medium">{item.keyword}</span>
                    <Badge variant="secondary" className="ml-2">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

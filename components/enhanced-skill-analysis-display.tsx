"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle2, Lightbulb, TrendingUp, Server, Zap } from "lucide-react"
import type { EnhancedSkillAnalysisResult } from "@/utils/enhanced-skill-analysis"

interface EnhancedSkillAnalysisDisplayProps {
  analysis: EnhancedSkillAnalysisResult | null
}

export function EnhancedSkillAnalysisDisplay({ analysis }: EnhancedSkillAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState("semantic")

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Skill Analysis</CardTitle>
          <CardDescription>No analysis data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Enhanced Skill Analysis
            </CardTitle>
            <CardDescription>Advanced analysis using semantic matching and contextual inference</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Match Improvement:</span>
            <Badge className="bg-green-100 text-green-800">
              +{analysis.enhancedMatchPercentage - analysis.originalMatchPercentage}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Original Match</span>
              <span className="font-medium">{analysis.originalMatchPercentage}%</span>
            </div>
            <Progress value={analysis.originalMatchPercentage} className="h-2" />

            <div className="flex justify-between text-sm mt-4">
              <span>Enhanced Match</span>
              <span className="font-medium text-purple-600">{analysis.enhancedMatchPercentage}%</span>
            </div>
            <Progress value={analysis.enhancedMatchPercentage} className="h-2 bg-gray-100">
              <div className="h-full bg-purple-500" style={{ width: `${analysis.originalMatchPercentage}%` }} />
              <div
                className="h-full bg-purple-300"
                style={{
                  width: `${analysis.enhancedMatchPercentage - analysis.originalMatchPercentage}%`,
                  marginLeft: `${analysis.originalMatchPercentage}%`,
                }}
              />
            </Progress>

            <p className="text-sm text-gray-600 mt-1">{analysis.improvementReason}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="semantic">Semantic Matches</TabsTrigger>
              <TabsTrigger value="proficiency">Proficiency</TabsTrigger>
              <TabsTrigger value="inferred">Inferred Skills</TabsTrigger>
              <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
            </TabsList>

            <TabsContent value="semantic" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Exact Matches
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.semanticMatches.exactMatches.length > 0 ? (
                      analysis.semanticMatches.exactMatches.map((skill, index) => (
                        <Badge key={index} className="bg-green-100 text-green-800">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No exact matches found</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Semantic Matches
                  </h3>
                  <div className="space-y-2 mt-2">
                    {analysis.semanticMatches.semanticMatches.length > 0 ? (
                      analysis.semanticMatches.semanticMatches.map((match, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center p-2 rounded-md ${
                            match.isIndirect ? "bg-purple-50 border border-purple-100" : "bg-blue-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{match.resumeSkill}</span>
                            <span className="text-gray-500">→</span>
                            <span>{match.jobSkill}</span>
                            {match.isIndirect && (
                              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                                Indirect Match
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {match.relationship}
                            </Badge>
                            <span className="text-xs text-gray-500">{Math.round(match.similarity * 100)}% match</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No semantic matches found</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 text-red-500">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.semanticMatches.missingSkills.length > 0 ? (
                      analysis.semanticMatches.missingSkills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className={`border-red-200 text-red-800 ${
                            skill.toLowerCase() === "hugging face" ? "bg-red-100 font-bold" : ""
                          }`}
                        >
                          {skill}
                          {skill.toLowerCase() === "hugging face" && <span className="ml-1">⚠️</span>}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No missing skills found</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="proficiency" className="space-y-4 pt-4">
              <div className="space-y-3">
                {analysis.proficiencyLevels.map((skill, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{skill.skill}</h3>
                      <Badge
                        className={
                          skill.level === "Expert"
                            ? "bg-purple-100 text-purple-800"
                            : skill.level === "Proficient"
                              ? "bg-blue-100 text-blue-800"
                              : skill.level === "Intermediate"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }
                      >
                        {skill.level}
                      </Badge>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Confidence</span>
                        <span>{Math.round(skill.confidence * 100)}%</span>
                      </div>
                      <Progress value={skill.confidence * 100} className="h-1 mt-1" />
                    </div>

                    {skill.evidence.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <h4 className="text-xs font-medium text-gray-500">Evidence</h4>
                        {skill.evidence.map((evidence, i) => (
                          <div key={i} className="text-xs flex items-start gap-1">
                            <span className="text-gray-400">&bull;</span>
                            <span>
                              {evidence.type === "project" ? "Project: " : "Experience: "}
                              {evidence.description}
                              {evidence.duration && ` (${evidence.duration})`}
                              {evidence.recency && ` - ${evidence.recency}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {analysis.proficiencyLevels.length === 0 && (
                  <p className="text-sm text-gray-500">No proficiency data available</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inferred" className="space-y-4 pt-4">
              <div className="space-y-3">
                {analysis.inferredSkills.map((skill, index) => (
                  <div key={index} className="p-3 border rounded-md bg-amber-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <h3 className="font-medium">{skill.skill}</h3>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800">{skill.category}</Badge>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Confidence</span>
                        <span>{Math.round(skill.confidence * 100)}%</span>
                      </div>
                      <Progress value={skill.confidence * 100} className="h-1 mt-1" />
                    </div>

                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500">Inferred From</h4>
                      {skill.inferredFrom.skillCombination.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {skill.inferredFrom.skillCombination.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-1">{skill.inferredFrom.context}</p>
                    </div>
                  </div>
                ))}

                {analysis.inferredSkills.length === 0 && (
                  <p className="text-sm text-gray-500">No inferred skills found</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="infrastructure" className="space-y-4 pt-4">
              <div className="space-y-4">
                {analysis.infrastructurePatterns.map((pattern, index) => (
                  <div key={index} className="p-4 border rounded-md bg-blue-50">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium">{pattern.name}</h3>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Confidence</span>
                        <span>{Math.round(pattern.confidence * 100)}%</span>
                      </div>
                      <Progress value={pattern.confidence * 100} className="h-1 mt-1" />
                    </div>

                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500">Matched Skills</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.matchedSkills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-white">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Inferred Capabilities
                      </h4>
                      <ul className="mt-1 space-y-1">
                        {pattern.inferredCapabilities.map((capability, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-blue-400">&bull;</span>
                            <span>{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}

                {analysis.infrastructurePatterns.length === 0 && (
                  <p className="text-sm text-gray-500">No infrastructure patterns detected</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

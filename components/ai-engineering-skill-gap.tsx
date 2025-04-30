"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Database, Server, Cpu, BotIcon as Robot } from "lucide-react"

interface AIEngineeringSkillGapProps {
  resumeSkills: string[]
  jobSkills: string[]
  showRecommendations?: boolean
}

export function AIEngineeringSkillGap({
  resumeSkills,
  jobSkills,
  showRecommendations = true,
}: AIEngineeringSkillGapProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // AI skill categories
  const aiSkillCategories = {
    frameworks: [
      "TensorFlow",
      "PyTorch",
      "Hugging Face",
      "LangChain",
      "LlamaIndex",
      "Transformers",
      "JAX",
      "Keras",
      "scikit-learn",
    ],
    concepts: [
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "LLMs",
      "Large Language Models",
      "RAG",
      "Retrieval Augmented Generation",
      "Generative AI",
      "Multimodal AI",
      "AI Personalization",
      "Reasoning",
    ],
    infrastructure: [
      "Vector Databases",
      "Model Hosting",
      "AI Infrastructure",
      "Embeddings",
      "Model Serving",
      "GPU Optimization",
      "Model Quantization",
    ],
    agents: [
      "Autonomous Agents",
      "Multi-agent Coordination",
      "Agentic Workflows",
      "Conversational AI",
      "Chatbots",
      "Agent Frameworks",
    ],
    data: [
      "Synthetic Data Training",
      "Data Pipelines",
      "Data Preprocessing",
      "Feature Engineering",
      "Data Augmentation",
    ],
    engineering: [
      "AI Engineering",
      "ML Engineering",
      "AI Model Improvement",
      "Model Evaluation",
      "AI Testing",
      "AI Security",
    ],
  }

  // Normalize skills for comparison
  const normalizeSkill = (skill: string): string => skill.toLowerCase().trim()

  // Find matched and missing skills for each category
  const matchedSkills: Record<string, string[]> = {}
  const missingSkills: Record<string, string[]> = {}

  Object.entries(aiSkillCategories).forEach(([category, skills]) => {
    matchedSkills[category] = []
    missingSkills[category] = []

    skills.forEach((skill) => {
      const normalizedSkill = normalizeSkill(skill)
      const hasSkill = resumeSkills.some(
        (resumeSkill) =>
          normalizeSkill(resumeSkill).includes(normalizedSkill) ||
          normalizedSkill.includes(normalizeSkill(resumeSkill)),
      )

      const isRequired = jobSkills.some(
        (jobSkill) =>
          normalizeSkill(jobSkill).includes(normalizedSkill) || normalizedSkill.includes(normalizeSkill(jobSkill)),
      )

      if (isRequired) {
        if (hasSkill) {
          matchedSkills[category].push(skill)
        } else {
          missingSkills[category].push(skill)
        }
      }
    })
  })

  // Calculate match percentage
  const totalRequiredSkills = Object.values(matchedSkills).flat().length + Object.values(missingSkills).flat().length
  const matchedSkillsCount = Object.values(matchedSkills).flat().length
  const matchPercentage = totalRequiredSkills > 0 ? Math.round((matchedSkillsCount / totalRequiredSkills) * 100) : 0

  // Generate recommendations based on missing skills
  const recommendations = []

  if (missingSkills.concepts.length > 0) {
    recommendations.push({
      category: "AI Concepts",
      description: `Learn about ${missingSkills.concepts.join(", ")}`,
      resources: [
        { name: "DeepLearning.AI Courses", url: "https://www.deeplearning.ai/courses/" },
        { name: "Hugging Face Documentation", url: "https://huggingface.co/docs" },
      ],
    })
  }

  if (missingSkills.frameworks.length > 0) {
    recommendations.push({
      category: "AI Frameworks",
      description: `Build expertise in ${missingSkills.frameworks.join(", ")}`,
      resources: [
        { name: "LangChain Documentation", url: "https://js.langchain.com/docs/" },
        { name: "Hugging Face Transformers", url: "https://huggingface.co/docs/transformers/index" },
      ],
    })
  }

  if (missingSkills.agents.length > 0) {
    recommendations.push({
      category: "Agent Systems",
      description: "Develop experience with autonomous agent systems",
      resources: [
        { name: "LangChain Agents Guide", url: "https://js.langchain.com/docs/modules/agents/" },
        { name: "AutoGPT GitHub", url: "https://github.com/Significant-Gravitas/AutoGPT" },
      ],
    })
  }

  // Icons for each category
  const categoryIcons = {
    frameworks: <Code className="h-4 w-4" />,
    concepts: <Cpu className="h-4 w-4" />,
    infrastructure: <Server className="h-4 w-4" />,
    agents: <Robot className="h-4 w-4" />,
    data: <Database className="h-4 w-4" />,
    engineering: <Cpu className="h-4 w-4" />,
  }

  // User-friendly category names
  const categoryNames = {
    frameworks: "AI Frameworks",
    concepts: "AI/ML Concepts",
    infrastructure: "Infrastructure",
    agents: "Agent Systems",
    data: "Data Processing",
    engineering: "AI Engineering",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Engineering Skill Match Analysis</CardTitle>
        <CardDescription>
          Your resume matches approximately {matchPercentage}% of the AI engineering skills required for this position
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Match Percentage</span>
            <span className="font-bold text-lg">{matchPercentage}%</span>
          </div>
          <Progress value={matchPercentage} className="h-2" />
          <p className="text-sm text-gray-500">
            {matchPercentage < 30
              ? "Significant AI skill gaps identified"
              : matchPercentage < 60
                ? "Some AI skill gaps identified"
                : "Good match with some minor gaps in AI expertise"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="matched">Matched Skills</TabsTrigger>
            <TabsTrigger value="missing">Missing Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Matched AI Skills</h3>
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="font-bold text-2xl text-green-700">{Object.values(matchedSkills).flat().length}</p>
                  <p className="text-sm text-green-600">AI skills you already have</p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Missing AI Skills</h3>
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="font-bold text-2xl text-red-700">{Object.values(missingSkills).flat().length}</p>
                  <p className="text-sm text-red-600">AI skills to develop</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">AI Skills by Category</h3>
              {Object.entries(categoryNames).map(([category, name]) => {
                const matched = matchedSkills[category].length
                const missing = missingSkills[category].length
                const total = matched + missing

                if (total === 0) return null

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {categoryIcons[category]}
                      <h4 className="text-sm font-medium">{name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-green-200 rounded-full"
                        style={{
                          width: `${(matched / total) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="h-2 bg-red-200 rounded-full"
                        style={{
                          width: `${(missing / total) * 100}%`,
                        }}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {matched} / {total}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {showRecommendations && recommendations.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="font-medium">Recommendations</h3>
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-blue-800">{rec.category}</h4>
                    <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                    {rec.resources && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-blue-800">Resources:</p>
                        <ul className="text-xs text-blue-700 mt-1 space-y-1">
                          {rec.resources.map((resource, i) => (
                            <li key={i}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-900"
                              >
                                {resource.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="matched" className="space-y-4 pt-4">
            {Object.entries(matchedSkills).map(([category, skills]) => {
              if (skills.length === 0) return null

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {categoryIcons[category]}
                    <h3 className="font-medium">{categoryNames[category]}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800 border-green-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}

            {Object.values(matchedSkills).flat().length === 0 && (
              <p className="text-center text-gray-500">No matched AI skills found</p>
            )}
          </TabsContent>

          <TabsContent value="missing" className="space-y-4 pt-4">
            {Object.entries(missingSkills).map(([category, skills]) => {
              if (skills.length === 0) return null

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {categoryIcons[category]}
                    <h3 className="font-medium">{categoryNames[category]}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="border-red-200 text-red-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}

            {Object.values(missingSkills).flat().length === 0 && (
              <p className="text-center text-gray-500">No missing AI skills found</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

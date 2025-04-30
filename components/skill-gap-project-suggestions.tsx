"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Code, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SkillGapProjectSuggestionsProps {
  missingSkills: Array<{
    name: string
    priority: string
  }>
}

export function SkillGapProjectSuggestions({ missingSkills }: SkillGapProjectSuggestionsProps) {
  // Filter to high priority skills
  const highPrioritySkills = missingSkills.filter((skill) => skill.priority === "High")

  if (highPrioritySkills.length === 0) {
    return null
  }

  // Project suggestions for common skills
  const projectSuggestions: Record<
    string,
    {
      title: string
      description: string
      difficulty: "Beginner" | "Intermediate" | "Advanced"
      timeEstimate: string
      resources: Array<{ name: string; url: string }>
      tags: string[]
    }
  > = {
    "hugging face": {
      title: "Fine-tune a Hugging Face Model for Text Classification",
      description:
        "Create a project that fine-tunes a pre-trained Hugging Face model for a specific text classification task. This will demonstrate your ability to work with the Hugging Face ecosystem.",
      difficulty: "Intermediate",
      timeEstimate: "1-2 weeks",
      resources: [
        {
          name: "Hugging Face Course",
          url: "https://huggingface.co/course/chapter1/1",
        },
        {
          name: "Fine-tuning Tutorial",
          url: "https://huggingface.co/docs/transformers/training",
        },
      ],
      tags: ["NLP", "Fine-tuning", "Transformers"],
    },
    reasoning: {
      title: "Build a Chain-of-Thought Reasoning System",
      description:
        "Develop a system that implements chain-of-thought prompting to solve complex reasoning tasks. This will showcase your understanding of advanced prompting techniques.",
      difficulty: "Advanced",
      timeEstimate: "2-3 weeks",
      resources: [
        {
          name: "Chain-of-Thought Paper",
          url: "https://arxiv.org/abs/2201.11903",
        },
        {
          name: "LangChain CoT Guide",
          url: "https://python.langchain.com/docs/use_cases/question_answering/",
        },
      ],
      tags: ["Reasoning", "Prompt Engineering", "LLMs"],
    },
    "multi-agent coordination": {
      title: "Create a Multi-Agent Collaboration System",
      description:
        "Build a system where multiple specialized agents collaborate to solve complex tasks. This demonstrates your ability to design and implement multi-agent systems.",
      difficulty: "Advanced",
      timeEstimate: "3-4 weeks",
      resources: [
        {
          name: "LangChain Agents Guide",
          url: "https://python.langchain.com/docs/modules/agents/",
        },
        {
          name: "Multi-Agent Framework Tutorial",
          url: "https://github.com/langchain-ai/langgraph",
        },
      ],
      tags: ["Agents", "Collaboration", "LangChain"],
    },
    "synthetic data training": {
      title: "Generate and Use Synthetic Training Data",
      description:
        "Create a project that generates synthetic data for training a machine learning model. This will show your ability to work with data generation techniques.",
      difficulty: "Intermediate",
      timeEstimate: "2 weeks",
      resources: [
        {
          name: "Synthetic Data Generation Guide",
          url: "https://github.com/facebookresearch/AugLy",
        },
        {
          name: "LLM-based Data Generation",
          url: "https://arxiv.org/abs/2305.14314",
        },
      ],
      tags: ["Data Generation", "Training", "Augmentation"],
    },
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Project Suggestions for Critical Skill Gaps
        </CardTitle>
        <CardDescription>
          Build these projects to address your most important skill gaps and strengthen your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {highPrioritySkills.map((skill) => {
          const suggestion = projectSuggestions[skill.name.toLowerCase()]
          if (!suggestion) return null

          return (
            <div key={skill.name} className="border rounded-lg p-4 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">
                  {suggestion.title}
                  <Badge className="ml-2 bg-amber-100 text-amber-800">Addresses: {skill.name}</Badge>
                </h3>
                <Badge
                  variant="outline"
                  className={
                    suggestion.difficulty === "Beginner"
                      ? "border-green-200 text-green-800"
                      : suggestion.difficulty === "Intermediate"
                        ? "border-blue-200 text-blue-800"
                        : "border-purple-200 text-purple-800"
                  }
                >
                  {suggestion.difficulty}
                </Badge>
              </div>

              <p className="mt-2 text-gray-600">{suggestion.description}</p>

              <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Estimated time: {suggestion.timeEstimate}</span>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Learning Resources
                </h4>
                <div className="space-y-1">
                  {suggestion.resources.map((resource, i) => (
                    <a
                      key={i}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      {resource.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {suggestion.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="bg-white">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-4">
                <Button className="w-full" size="sm">
                  <Code className="h-4 w-4 mr-2" />
                  Generate Project Starter
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function Clock(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

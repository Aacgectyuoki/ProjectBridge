"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Code, Github, ExternalLink, BookOpen, Star } from "lucide-react"

// Sample AI project recommendations based on common skill gaps
const aiProjects = [
  {
    id: "langchain-agent",
    title: "Build an Autonomous AI Agent with LangChain",
    description:
      "Create a multi-functional AI agent that can reason, plan, and execute tasks using LangChain and modern LLMs.",
    difficulty: "Intermediate",
    timeEstimate: "3-4 weeks",
    skillsAddressed: ["LangChain", "Autonomous Agents", "TypeScript", "Node.js", "Vector Databases"],
    steps: [
      "Set up a TypeScript project with LangChain.js",
      "Implement agent reasoning with ReAct pattern",
      "Add tools for web browsing, calculation, and code execution",
      "Create a memory system with vector storage",
      "Build a simple UI for interacting with your agent",
      "Deploy to Vercel or similar platform",
    ],
    resources: [
      { name: "LangChain.js Documentation", url: "https://js.langchain.com/docs/" },
      {
        name: "Building LLM Powered Applications",
        url: "https://www.deeplearning.ai/short-courses/building-applications-with-vector-databases/",
      },
      { name: "ReAct Pattern Explained", url: "https://www.promptingguide.ai/techniques/react" },
    ],
    githubRepo: "https://github.com/langchain-ai/langchainjs",
  },
  {
    id: "rag-system",
    title: "Advanced RAG System with Multi-Vector Retrieval",
    description:
      "Build a sophisticated Retrieval-Augmented Generation system that uses multiple vector representations for improved accuracy.",
    difficulty: "Advanced",
    timeEstimate: "4-6 weeks",
    skillsAddressed: ["RAG", "Vector Databases", "LangChain", "TypeScript", "NLP"],
    steps: [
      "Set up document processing pipeline with chunking strategies",
      "Implement multiple embedding models for different aspects",
      "Create a hybrid search system with sparse and dense vectors",
      "Build query transformation for improved retrieval",
      "Implement re-ranking of search results",
      "Add a feedback loop for continuous improvement",
    ],
    resources: [
      { name: "Advanced RAG Techniques", url: "https://www.pinecone.io/learn/advanced-rag/" },
      { name: "LangChain Retrieval Guide", url: "https://js.langchain.com/docs/modules/data_connection/retrievers/" },
      {
        name: "Vector Database Implementation",
        url: "https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/",
      },
    ],
    githubRepo: "https://github.com/run-llama/llama_index",
  },
  {
    id: "multimodal-ai",
    title: "Multimodal AI Application with Vision and Text",
    description:
      "Create an application that can process both images and text, generating insights and descriptions using multimodal AI models.",
    difficulty: "Advanced",
    timeEstimate: "5-7 weeks",
    skillsAddressed: ["Multimodal AI", "Computer Vision", "NLP", "React", "Next.js"],
    steps: [
      "Set up a Next.js project with React and TypeScript",
      "Integrate with multimodal models like GPT-4V or Claude 3",
      "Implement image upload and processing",
      "Create a system for generating detailed image descriptions",
      "Add visual question answering capabilities",
      "Implement a user feedback system for model improvement",
    ],
    resources: [
      { name: "Multimodal AI Guide", url: "https://www.deeplearning.ai/short-courses/multimodal-prompting/" },
      { name: "Next.js AI Documentation", url: "https://nextjs.org/docs/app/building-your-application/ai" },
      { name: "Computer Vision Fundamentals", url: "https://www.coursera.org/learn/computer-vision-basics" },
    ],
    githubRepo: "https://github.com/vercel/ai",
  },
]

export function AIProjectRecommendations() {
  const [selectedProject, setSelectedProject] = useState(aiProjects[0])
  const [activeTab, setActiveTab] = useState("details")

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>AI Project Recommendations</CardTitle>
        <CardDescription>
          Build these projects to develop the AI engineering skills needed for the position
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-3">
            <h3 className="font-medium text-sm">Recommended Projects</h3>
            {aiProjects.map((project) => (
              <div
                key={project.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedProject.id === project.id
                    ? "bg-indigo-50 border border-indigo-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <h4 className="font-medium">{project.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{project.timeEstimate}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.skillsAddressed.slice(0, 2).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {project.skillsAddressed.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.skillsAddressed.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedProject.title}</h2>
                  <p className="text-gray-600 mt-2">{selectedProject.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{selectedProject.timeEstimate}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                    <Star className="h-4 w-4 text-gray-500" />
                    <span>{selectedProject.difficulty}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Skills Addressed</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.skillsAddressed.map((skill, index) => (
                      <Badge key={index} className="bg-indigo-100 text-indigo-800 border-indigo-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="gap-1.5" asChild>
                    <a href={selectedProject.githubRepo} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                      GitHub Repository
                    </a>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="pt-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Implementation Steps</h3>
                  <ol className="space-y-2">
                    {selectedProject.steps.map((step, index) => (
                      <li key={index} className="flex gap-2">
                        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="pt-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Learning Resources</h3>
                  <div className="space-y-3">
                    {selectedProject.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {index === 0 ? (
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                          ) : index === 1 ? (
                            <Code className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <ExternalLink className="h-5 w-5 text-indigo-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-indigo-700">{resource.name}</div>
                          <div className="text-sm text-gray-500 truncate">{resource.url}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

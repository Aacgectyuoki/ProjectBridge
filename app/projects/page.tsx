"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Code, ChevronLeft, ChevronRight, Clock, Star, ThumbsUp, ThumbsDown } from "lucide-react"
import { ProjectDetailModal } from "@/components/project-detail-modal"
import type { ProjectIdea } from "@/app/actions/generate-project-ideas"

export default function ProjectsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<ProjectIdea[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedProject, setSelectedProject] = useState<ProjectIdea | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savedProjects, setSavedProjects] = useState<ProjectIdea[]>([])

  useEffect(() => {
    // Try to get projects from localStorage
    const storedProjects = localStorage.getItem("projectIdeas")
    const storedSavedProjects = localStorage.getItem("savedProjects")

    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects)
        setProjects(parsedProjects)

        if (storedSavedProjects) {
          setSavedProjects(JSON.parse(storedSavedProjects))
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error parsing stored projects:", error)
        // Fallback to mock data
        setProjects(mockProjects)
        setIsLoading(false)
      }
    } else {
      // Fallback to mock data
      setTimeout(() => {
        setProjects(mockProjects)
        setIsLoading(false)
      }, 1500)
    }
  }, [])

  const handleNext = () => {
    if (currentIndex < projects.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleLike = () => {
    const project = projects[currentIndex]
    if (!savedProjects.some((p) => p.id === project.id)) {
      const updatedSavedProjects = [...savedProjects, project]
      setSavedProjects(updatedSavedProjects)
      // Save to localStorage
      localStorage.setItem("savedProjects", JSON.stringify(updatedSavedProjects))
    }
    handleNext()
  }

  const handleDislike = () => {
    handleNext()
  }

  const openProjectDetails = (project: ProjectIdea) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Code className="h-6 w-6" />
            <span>ProjectBridge</span>
          </Link>
          <nav className="ml-auto flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/analyze" className="text-sm font-medium">
              Analysis
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Project Ideas</h1>
          </div>

          {isLoading ? (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-center font-medium">Generating project ideas based on your skill gaps...</p>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {projects.length > 0 && (
                  <Card className="relative overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="absolute top-4 right-4 flex items-center gap-1 text-sm">
                        <span className="font-medium">{currentIndex + 1}</span>
                        <span className="text-gray-500">/ {projects.length}</span>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold">{projects[currentIndex].title}</h2>
                        <p className="text-gray-600">{projects[currentIndex].description}</p>
                        <div className="flex flex-wrap gap-2">
                          {projects[currentIndex].skillsAddressed.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{projects[currentIndex].timeEstimate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Difficulty:</span>
                          <span className="text-gray-500">{projects[currentIndex].difficulty}</span>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => openProjectDetails(projects[currentIndex])}
                        >
                          View Details
                        </Button>
                        <div className="flex justify-between pt-4">
                          <Button variant="outline" size="icon" onClick={handlePrevious} disabled={currentIndex === 0}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full bg-red-50 hover:bg-red-100 border-red-200"
                              onClick={handleDislike}
                            >
                              <ThumbsDown className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full bg-green-50 hover:bg-green-100 border-green-200"
                              onClick={handleLike}
                            >
                              <ThumbsUp className="h-4 w-4 text-green-500" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            disabled={currentIndex === projects.length - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4">Saved Projects</h2>
                {savedProjects.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">
                    <p>No saved projects yet</p>
                    <p className="text-sm mt-1">Swipe right on projects you like</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openProjectDetails(project)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-medium">{project.title}</h3>
                              <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      {selectedProject && (
        <ProjectDetailModal project={selectedProject} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}

// Mock data - in a real app, this would come from API
const mockProjects = [
  {
    id: "project-1",
    title: "Full-Stack E-commerce Dashboard",
    description: "Build a React and GraphQL-based dashboard for managing products, orders, and customers.",
    skillsAddressed: ["React", "TypeScript", "GraphQL", "Node.js"],
    difficulty: "Intermediate",
    timeEstimate: "4-6 weeks",
    steps: [
      "Set up a React project with TypeScript",
      "Create GraphQL schema for products, orders, and customers",
      "Implement authentication and authorization",
      "Build dashboard UI with data visualization",
      "Add CRUD operations for all entities",
      "Implement search and filtering functionality",
      "Deploy to a cloud platform",
    ],
    learningResources: [
      { title: "React Documentation", url: "https://reactjs.org/docs/getting-started.html", type: "Documentation" },
      { title: "GraphQL Tutorial", url: "https://www.howtographql.com/", type: "Tutorial" },
      { title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/", type: "Documentation" },
    ],
    tools: ["React", "TypeScript", "Apollo Client", "Node.js", "Express", "MongoDB"],
    deploymentOptions: ["Vercel", "Netlify", "AWS Amplify"],
    tags: ["e-commerce", "dashboard", "full-stack"],
  },
  {
    id: "project-2",
    title: "Real-time Chat Application",
    description: "Create a chat application with real-time messaging using WebSockets and React.",
    skillsAddressed: ["React", "WebSockets", "Node.js", "Express"],
    difficulty: "Intermediate",
    timeEstimate: "3-4 weeks",
    steps: [
      "Set up a React frontend project",
      "Create a Node.js backend with Express",
      "Implement WebSocket connection with Socket.io",
      "Build UI components for chat interface",
      "Add user authentication",
      "Implement real-time messaging features",
      "Add typing indicators and read receipts",
      "Deploy frontend and backend",
    ],
    learningResources: [
      { title: "Socket.io Documentation", url: "https://socket.io/docs/v4/", type: "Documentation" },
      { title: "React Hooks Guide", url: "https://reactjs.org/docs/hooks-intro.html", type: "Documentation" },
      { title: "Express.js Guide", url: "https://expressjs.com/en/guide/routing.html", type: "Documentation" },
    ],
    tools: ["React", "Socket.io", "Node.js", "Express", "MongoDB"],
    deploymentOptions: ["Heroku", "Vercel", "DigitalOcean"],
    tags: ["chat", "real-time", "websockets"],
  },
  {
    id: "project-3",
    title: "GraphQL API with TypeScript",
    description: "Build a fully-typed GraphQL API using TypeScript, Apollo Server, and a database of your choice.",
    skillsAddressed: ["GraphQL", "TypeScript", "Node.js", "Database Design"],
    difficulty: "Advanced",
    timeEstimate: "4-5 weeks",
    steps: [
      "Set up a TypeScript Node.js project",
      "Design database schema",
      "Create GraphQL schema and resolvers",
      "Implement data models and database connections",
      "Add authentication and authorization",
      "Implement pagination and filtering",
      "Write tests for API endpoints",
      "Document API with GraphQL Playground",
      "Deploy to a cloud platform",
    ],
    learningResources: [
      {
        title: "Apollo Server Documentation",
        url: "https://www.apollographql.com/docs/apollo-server/",
        type: "Documentation",
      },
      { title: "TypeScript Deep Dive", url: "https://basarat.gitbook.io/typescript/", type: "Book" },
      { title: "GraphQL Best Practices", url: "https://graphql.org/learn/best-practices/", type: "Documentation" },
    ],
    tools: ["TypeScript", "Apollo Server", "Node.js", "PostgreSQL", "Jest"],
    deploymentOptions: ["AWS Lambda", "Heroku", "DigitalOcean"],
    tags: ["api", "graphql", "typescript"],
  },
]

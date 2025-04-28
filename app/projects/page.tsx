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
  {
  "id": "project-4",
  "title": "AI-Powered Content Recommendation Engine",
  "description": "Build a recommendation system that suggests content based on user preferences and behavior using machine learning algorithms.",
  "skillsAddressed": ["Python", "Machine Learning", "API Development", "Data Processing", "React"],
  "difficulty": "Advanced",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Set up a Python backend with FastAPI",
    "Implement data collection and preprocessing pipeline",
    "Build recommendation algorithms (collaborative filtering, content-based)",
    "Create a RESTful API to serve recommendations",
    "Develop a React frontend to display recommendations",
    "Implement user feedback mechanisms",
    "Add A/B testing capabilities",
    "Deploy the system to a cloud platform"
  ],
  "learningResources": [
    { "title": "Hands-On Recommendation Systems with Python", "url": "https://www.packtpub.com/product/hands-on-recommendation-systems-with-python/9781788993753", "type": "Book" },
    { "title": "FastAPI Documentation", "url": "https://fastapi.tiangolo.com/", "type": "Documentation" },
    { "title": "Building Recommendation Systems with TensorFlow", "url": "https://www.tensorflow.org/recommenders", "type": "Documentation" }
  ],
  "tools": ["Python", "FastAPI", "TensorFlow", "Pandas", "React", "PostgreSQL", "Docker"],
  "deploymentOptions": ["AWS SageMaker", "Google Cloud AI Platform", "Azure ML"],
  "tags": ["machine learning", "recommendations", "ai", "data science"]
},
{
  "id": "project-5",
  "title": "Serverless Event-Driven Microservice",
  "description": "Create a scalable, event-driven application using serverless architecture to process and analyze data streams.",
  "skillsAddressed": ["AWS Lambda", "Serverless", "Event-Driven Architecture", "Node.js", "Infrastructure as Code"],
  "difficulty": "Intermediate",
  "timeEstimate": "3-5 weeks",
  "steps": [
    "Design event-driven architecture",
    "Set up AWS infrastructure using Terraform or CloudFormation",
    "Implement Lambda functions for data processing",
    "Create event sources (SQS, SNS, EventBridge)",
    "Build monitoring and alerting",
    "Implement error handling and dead-letter queues",
    "Add authentication and authorization",
    "Deploy and test the complete system"
  ],
  "learningResources": [
    { "title": "AWS Lambda Documentation", "url": "https://docs.aws.amazon.com/lambda/", "type": "Documentation" },
    { "title": "Serverless Framework", "url": "https://www.serverless.com/framework/docs/", "type": "Documentation" },
    { "title": "Event-Driven Architecture Course", "url": "https://www.pluralsight.com/courses/event-driven-architecture-big-picture", "type": "Course" }
  ],
  "tools": ["AWS Lambda", "AWS SQS", "AWS SNS", "Node.js", "Terraform", "CloudWatch", "DynamoDB"],
  "deploymentOptions": ["AWS CloudFormation", "Terraform", "Serverless Framework"],
  "tags": ["serverless", "aws", "event-driven", "microservices", "cloud"]
},
{
  "id": "project-6",
  "title": "Mobile-First Progressive Web App",
  "description": "Develop a progressive web application with offline capabilities, push notifications, and responsive design.",
  "skillsAddressed": ["PWA", "Service Workers", "Responsive Design", "IndexedDB", "Push Notifications"],
  "difficulty": "Intermediate",
  "timeEstimate": "4-6 weeks",
  "steps": [
    "Set up a React project with PWA template",
    "Implement responsive UI with mobile-first approach",
    "Add service worker for offline functionality",
    "Implement data caching with IndexedDB",
    "Set up push notifications",
    "Add app manifest for installability",
    "Optimize performance (code splitting, lazy loading)",
    "Deploy to a CDN"
  ],
  "learningResources": [
    { "title": "Google PWA Training", "url": "https://web.dev/learn/pwa/", "type": "Tutorial" },
    { "title": "Service Workers API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API", "type": "Documentation" },
    { "title": "IndexedDB API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API", "type": "Documentation" }
  ],
  "tools": ["React", "Workbox", "IndexedDB", "Lighthouse", "Web Push API"],
  "deploymentOptions": ["Firebase Hosting", "Netlify", "Vercel"],
  "tags": ["pwa", "mobile", "offline-first", "web-push"]
},
{
  "id": "project-7",
  "title": "Blockchain-Based Supply Chain Tracking System",
  "description": "Build a decentralized application for tracking products through a supply chain with immutable records.",
  "skillsAddressed": ["Blockchain", "Smart Contracts", "Solidity", "Web3.js", "React"],
  "difficulty": "Advanced",
  "timeEstimate": "8-10 weeks",
  "steps": [
    "Design the supply chain data model",
    "Develop smart contracts with Solidity",
    "Set up a local blockchain for development",
    "Create a React frontend with Web3 integration",
    "Implement user authentication with MetaMask",
    "Build QR code scanning for product tracking",
    "Add visualization for supply chain journey",
    "Deploy to a test network (Rinkeby, Ropsten)"
  ],
  "learningResources": [
    { "title": "Solidity Documentation", "url": "https://docs.soliditylang.org/", "type": "Documentation" },
    { "title": "Web3.js Documentation", "url": "https://web3js.readthedocs.io/", "type": "Documentation" },
    { "title": "Ethereum and Solidity: The Complete Developer's Guide", "url": "https://www.udemy.com/course/ethereum-and-solidity-the-complete-developers-guide/", "type": "Course" }
  ],
  "tools": ["Solidity", "Truffle", "Ganache", "Web3.js", "React", "MetaMask", "OpenZeppelin"],
  "deploymentOptions": ["Ethereum Mainnet", "Polygon", "Binance Smart Chain"],
  "tags": ["blockchain", "ethereum", "dapp", "supply-chain", "smart-contracts"]
},
{
  "id": "project-8",
  "title": "Containerized Microservices with Kubernetes",
  "description": "Create a scalable application using microservices architecture, containerization, and orchestration.",
  "skillsAddressed": ["Docker", "Kubernetes", "Microservices", "CI/CD", "API Gateway"],
  "difficulty": "Advanced",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Design microservices architecture",
    "Develop individual services (Node.js, Python, etc.)",
    "Containerize services with Docker",
    "Set up Kubernetes cluster",
    "Implement service discovery and load balancing",
    "Create CI/CD pipeline with GitHub Actions",
    "Add monitoring with Prometheus and Grafana",
    "Deploy to a cloud Kubernetes service"
  ],
  "learningResources": [
    { "title": "Kubernetes Documentation", "url": "https://kubernetes.io/docs/home/", "type": "Documentation" },
    { "title": "Docker Documentation", "url": "https://docs.docker.com/", "type": "Documentation" },
    { "title": "Microservices with Node.js and React", "url": "https://www.udemy.com/course/microservices-with-node-js-and-react/", "type": "Course" }
  ],
  "tools": ["Docker", "Kubernetes", "Helm", "GitHub Actions", "Prometheus", "Grafana", "Istio"],
  "deploymentOptions": ["Google Kubernetes Engine", "Amazon EKS", "Azure AKS"],
  "tags": ["kubernetes", "docker", "microservices", "devops", "cloud-native"]
},
{
  "id": "project-9",
  "title": "Augmented Reality Web Application",
  "description": "Build a web-based AR experience that allows users to place virtual objects in their real environment.",
  "skillsAddressed": ["WebXR", "Three.js", "JavaScript", "3D Modeling", "UX Design"],
  "difficulty": "Advanced",
  "timeEstimate": "5-7 weeks",
  "steps": [
    "Set up a Three.js project",
    "Implement WebXR API integration",
    "Create or source 3D models",
    "Build AR scene with lighting and physics",
    "Add user interactions (placing, moving objects)",
    "Implement camera permissions and fallbacks",
    "Optimize for mobile performance",
    "Deploy to HTTPS-enabled hosting"
  ],
  "learningResources": [
    { "title": "WebXR Device API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API", "type": "Documentation" },
    { "title": "Three.js Documentation", "url": "https://threejs.org/docs/", "type": "Documentation" },
    { "title": "AR.js Documentation", "url": "https://ar-js-org.github.io/AR.js-Docs/", "type": "Documentation" }
  ],
  "tools": ["Three.js", "WebXR API", "Blender", "GLTF", "JavaScript"],
  "deploymentOptions": ["GitHub Pages", "Netlify", "Vercel"],
  "tags": ["augmented-reality", "webxr", "3d", "interactive"]
},
{
  "id": "project-10",
  "title": "Real-time Data Analytics Dashboard",
  "description": "Create an interactive dashboard that processes and visualizes streaming data in real-time.",
  "skillsAddressed": ["Data Visualization", "Stream Processing", "WebSockets", "D3.js", "React"],
  "difficulty": "Intermediate",
  "timeEstimate": "4-6 weeks",
  "steps": [
    "Set up a React application with data visualization libraries",
    "Implement backend with streaming data capabilities",
    "Create WebSocket connections for real-time updates",
    "Build interactive charts and graphs with D3.js",
    "Add filtering and aggregation features",
    "Implement time-series analysis",
    "Add user customization options",
    "Deploy frontend and backend services"
  ],
  "learningResources": [
    { "title": "D3.js Documentation", "url": "https://d3js.org/", "type": "Documentation" },
    { "title": "React and D3.js", "url": "https://wattenberger.com/blog/react-and-d3", "type": "Tutorial" },
    { "title": "Streaming Data Architecture", "url": "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/", "type": "Book" }
  ],
  "tools": ["React", "D3.js", "Socket.io", "Node.js", "Redis", "Recharts", "Nivo"],
  "deploymentOptions": ["Heroku", "Vercel", "DigitalOcean"],
  "tags": ["data-visualization", "real-time", "analytics", "dashboard"]
},
{
  "id": "project-11",
  "title": "Accessibility-First Design System",
  "description": "Build a comprehensive component library and design system with accessibility as the primary focus.",
  "skillsAddressed": ["Accessibility", "Component Design", "CSS Architecture", "Testing", "Documentation"],
  "difficulty": "Intermediate",
  "timeEstimate": "5-7 weeks",
  "steps": [
    "Research accessibility standards (WCAG 2.1)",
    "Set up a component library with Storybook",
    "Implement base components with accessibility features",
    "Create theme system with proper color contrast",
    "Add keyboard navigation support",
    "Implement screen reader compatibility",
    "Write automated accessibility tests",
    "Create comprehensive documentation"
  ],
  "learningResources": [
    { "title": "WCAG Guidelines", "url": "https://www.w3.org/WAI/standards-guidelines/wcag/", "type": "Documentation" },
    { "title": "Storybook for Accessibility", "url": "https://storybook.js.org/addons/@storybook/addon-a11y", "type": "Documentation" },
    { "title": "Inclusive Components", "url": "https://inclusive-components.design/", "type": "Book" }
  ],
  "tools": ["React", "Storybook", "Axe", "Jest", "Testing Library", "CSS Modules", "TypeScript"],
  "deploymentOptions": ["npm", "GitHub Packages", "Chromatic"],
  "tags": ["accessibility", "design-system", "component-library", "a11y"]
},
{
  "id": "project-12",
  "title": "Natural Language Processing Chatbot",
  "description": "Develop a conversational AI chatbot that can understand and respond to user queries using NLP techniques.",
  "skillsAddressed": ["NLP", "Machine Learning", "API Integration", "Python", "React"],
  "difficulty": "Advanced",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Set up a Python backend with Flask or FastAPI",
    "Integrate with NLP services (Hugging Face, spaCy)",
    "Implement intent recognition and entity extraction",
    "Build conversation flow management",
    "Create a React frontend with chat interface",
    "Add context awareness and memory",
    "Implement analytics to track user interactions",
    "Deploy backend and frontend services"
  ],
  "learningResources": [
    { "title": "Hugging Face Transformers", "url": "https://huggingface.co/transformers/", "type": "Documentation" },
    { "title": "spaCy Documentation", "url": "https://spacy.io/usage", "type": "Documentation" },
    { "title": "Building AI Applications with Python", "url": "https://www.manning.com/books/build-a-career-in-ai", "type": "Book" }
  ],
  "tools": ["Python", "Flask/FastAPI", "Hugging Face", "spaCy", "React", "Redis", "Docker"],
  "deploymentOptions": ["Heroku", "AWS Lambda", "Google Cloud Run"],
  "tags": ["nlp", "chatbot", "ai", "machine-learning", "conversational-ui"]
},
{
  "id": "project-13",
  "title": "Cross-Platform Mobile App with Flutter",
  "description": "Build a feature-rich mobile application that works on both iOS and Android using Flutter framework.",
  "skillsAddressed": ["Flutter", "Dart", "Mobile Development", "State Management", "API Integration"],
  "difficulty": "Intermediate",
  "timeEstimate": "5-7 weeks",
  "steps": [
    "Set up Flutter development environment",
    "Design app architecture and navigation",
    "Implement UI components and screens",
    "Add state management with Provider or Bloc",
    "Integrate with backend APIs",
    "Implement local storage and offline support",
    "Add authentication and user profiles",
    "Deploy to app stores (Google Play, App Store)"
  ],
  "learningResources": [
    { "title": "Flutter Documentation", "url": "https://flutter.dev/docs", "type": "Documentation" },
    { "title": "Dart Programming Language", "url": "https://dart.dev/guides", "type": "Documentation" },
    { "title": "Flutter in Action", "url": "https://www.manning.com/books/flutter-in-action", "type": "Book" }
  ],
  "tools": ["Flutter", "Dart", "Provider/Bloc", "Firebase", "VS Code", "Android Studio"],
  "deploymentOptions": ["Google Play Store", "Apple App Store", "TestFlight"],
  "tags": ["flutter", "mobile", "cross-platform", "ios", "android"]
},
{
  "id": "project-14",
  "title": "IoT Home Automation System",
  "description": "Build a complete home automation system with IoT devices, a central hub, and a mobile control app.",
  "skillsAddressed": ["IoT", "Embedded Systems", "MQTT", "React Native", "Node.js"],
  "difficulty": "Advanced",
  "timeEstimate": "8-10 weeks",
  "steps": [
    "Set up Raspberry Pi or Arduino as central hub",
    "Configure sensors and actuators (temperature, motion, lights)",
    "Implement MQTT broker for device communication",
    "Create Node.js backend for business logic",
    "Build React Native mobile app for control",
    "Add automation rules and scheduling",
    "Implement voice control integration",
    "Set up secure remote access"
  ],
  "learningResources": [
    { "title": "Raspberry Pi Documentation", "url": "https://www.raspberrypi.org/documentation/", "type": "Documentation" },
    { "title": "MQTT Essentials", "url": "https://www.hivemq.com/mqtt-essentials/", "type": "Tutorial" },
    { "title": "React Native Documentation", "url": "https://reactnative.dev/docs/getting-started", "type": "Documentation" }
  ],
  "tools": ["Raspberry Pi/Arduino", "MQTT", "Node.js", "React Native", "Mosquitto", "GPIO Sensors"],
  "deploymentOptions": ["Self-hosted", "AWS IoT Core", "Google Cloud IoT"],
  "tags": ["iot", "home-automation", "embedded", "mqtt", "raspberry-pi"]
},
{
  "id": "project-15",
  "title": "Video Streaming Platform",
  "description": "Create a video streaming service with content upload, transcoding, and adaptive playback capabilities.",
  "skillsAddressed": ["Video Streaming", "FFmpeg", "HLS/DASH", "Cloud Storage", "React"],
  "difficulty": "Advanced",
  "timeEstimate": "7-9 weeks",
  "steps": [
    "Set up cloud storage for video files",
    "Implement video upload with progress tracking",
    "Create video transcoding pipeline with FFmpeg",
    "Set up HLS/DASH streaming formats",
    "Build React frontend with video player",
    "Add user authentication and profiles",
    "Implement content categorization and search",
    "Set up CDN for global distribution"
  ],
  "learningResources": [
    { "title": "FFmpeg Documentation", "url": "https://ffmpeg.org/documentation.html", "type": "Documentation" },
    { "title": "Video.js Documentation", "url": "https://docs.videojs.com/", "type": "Documentation" },
    { "title": "HLS Specification", "url": "https://developer.apple.com/streaming/", "type": "Documentation" }
  ],
  "tools": ["FFmpeg", "Video.js", "AWS S3/CloudFront", "Node.js", "React", "Redis", "MongoDB"],
  "deploymentOptions": ["AWS MediaConvert", "Google Cloud Video Intelligence", "Cloudflare Stream"],
  "tags": ["video", "streaming", "media", "transcoding", "hls"]
},
{
  "id": "project-16",
  "title": "Gamified Learning Platform",
  "description": "Develop an interactive learning platform with gamification elements to increase engagement and retention.",
  "skillsAddressed": ["Gamification", "React", "Node.js", "MongoDB", "WebSockets"],
  "difficulty": "Intermediate",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Design gamification system (points, badges, levels)",
    "Create user progress tracking system",
    "Implement interactive learning modules",
    "Build real-time leaderboards with WebSockets",
    "Add social features (friends, challenges)",
    "Create achievement system",
    "Implement analytics dashboard",
    "Add content management system for educators"
  ],
  "learningResources": [
    { "title": "Gamification Design Framework", "url": "https://yukaichou.com/gamification-examples/octalysis-complete-gamification-framework/", "type": "Framework" },
    { "title": "MongoDB University", "url": "https://university.mongodb.com/", "type": "Course" },
    { "title": "React Game Design Patterns", "url": "https://www.packtpub.com/product/react-and-react-native-third-edition/9781839211140", "type": "Book" }
  ],
  "tools": ["React", "Node.js", "MongoDB", "Socket.io", "Redux", "Express", "Chart.js"],
  "deploymentOptions": ["Heroku", "DigitalOcean", "AWS Elastic Beanstalk"],
  "tags": ["gamification", "education", "e-learning", "interactive", "social"]
},
{
  "id": "project-17",
  "title": "Voice-Controlled Personal Assistant",
  "description": "Build a voice-activated assistant that can perform tasks, answer questions, and control smart devices.",
  "skillsAddressed": ["Speech Recognition", "Natural Language Processing", "API Integration", "Python", "React"],
  "difficulty": "Advanced",
  "timeEstimate": "7-9 weeks",
  "steps": [
    "Set up speech recognition system",
    "Implement wake word detection",
    "Create intent recognition system",
    "Build task execution framework",
    "Integrate with external APIs (weather, news, etc.)",
    "Add smart home device control",
    "Implement conversation context management",
    "Create web dashboard for configuration"
  ],
  "learningResources": [
    { "title": "SpeechRecognition API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition", "type": "Documentation" },
    { "title": "Rasa NLU Documentation", "url": "https://rasa.com/docs/rasa/", "type": "Documentation" },
    { "title": "Building Voice Assistants", "url": "https://www.manning.com/books/voice-applications-for-alexa-and-google-assistant", "type": "Book" }
  ],
  "tools": ["Python", "TensorFlow", "Rasa", "Flask", "React", "WebSockets", "Redis"],
  "deploymentOptions": ["Self-hosted", "AWS", "Google Cloud"],
  "tags": ["voice-assistant", "speech-recognition", "nlp", "smart-home", "ai"]
},
{
  "id": "project-18",
  "title": "Cryptocurrency Trading Bot",
  "description": "Create an automated trading bot that analyzes market data and executes trades based on predefined strategies.",
  "skillsAddressed": ["Algorithmic Trading", "Data Analysis", "API Integration", "Python", "Financial Analysis"],
  "difficulty": "Advanced",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Set up cryptocurrency exchange API connections",
    "Implement data collection and storage",
    "Create technical analysis indicators",
    "Build trading strategy framework",
    "Implement backtesting system",
    "Add risk management features",
    "Create performance dashboard",
    "Set up alerts and notifications"
  ],
  "learningResources": [
    { "title": "CCXT Library Documentation", "url": "https://github.com/ccxt/ccxt/wiki", "type": "Documentation" },
    { "title": "Python for Finance", "url": "https://www.oreilly.com/library/view/python-for-finance/9781492024323/", "type": "Book" },
    { "title": "Technical Analysis Library", "url": "https://technical-analysis-library-in-python.readthedocs.io/en/latest/", "type": "Documentation" }
  ],
  "tools": ["Python", "Pandas", "CCXT", "PostgreSQL", "Dash/Plotly", "Redis", "Docker"],
  "deploymentOptions": ["AWS EC2", "DigitalOcean", "Self-hosted VPS"],
  "tags": ["cryptocurrency", "trading", "finance", "algorithmic-trading", "data-analysis"]
},
{
  "id": "project-19",
  "title": "Collaborative Document Editor",
  "description": "Build a real-time collaborative document editor with rich text formatting and version history.",
  "skillsAddressed": ["Operational Transformation", "WebSockets", "React", "Node.js", "MongoDB"],
  "difficulty": "Advanced",
  "timeEstimate": "7-9 weeks",
  "steps": [
    "Implement rich text editor with Draft.js or Slate",
    "Create operational transformation engine",
    "Set up WebSocket server for real-time collaboration",
    "Build document versioning system",
    "Add user presence indicators",
    "Implement commenting and suggestions",
    "Create document organization system",
    "Add export options (PDF, Markdown, etc.)"
  ],
  "learningResources": [
    { "title": "Operational Transformation", "url": "http://operational-transformation.github.io/", "type": "Documentation" },
    { "title": "Draft.js Documentation", "url": "https://draftjs.org/docs/getting-started", "type": "Documentation" },
    { "title": "Building Real-time Applications", "url": "https://www.manning.com/books/real-time-web-application-development", "type": "Book" }
  ],
  "tools": ["React", "Draft.js/Slate", "Socket.io", "Node.js", "MongoDB", "Redis", "Express"],
  "deploymentOptions": ["Heroku", "DigitalOcean", "AWS Elastic Beanstalk"],
  "tags": ["collaboration", "real-time", "document-editor", "operational-transformation"]
},
{
  "id": "project-20",
  "title": "Geospatial Data Visualization Platform",
  "description": "Create an interactive mapping platform for visualizing and analyzing geospatial data sets.",
  "skillsAddressed": ["GIS", "Data Visualization", "Mapbox/Leaflet", "React", "PostGIS"],
  "difficulty": "Intermediate",
  "timeEstimate": "5-7 weeks",
  "steps": [
    "Set up mapping library (Mapbox GL or Leaflet)",
    "Implement geospatial database with PostGIS",
    "Create data import and processing pipeline",
    "Build layer management system",
    "Add interactive data filters",
    "Implement custom visualization styles",
    "Create data export functionality",
    "Add collaborative map sharing"
  ],
  "learningResources": [
    { "title": "Mapbox GL JS Documentation", "url": "https://docs.mapbox.com/mapbox-gl-js/", "type": "Documentation" },
    { "title": "PostGIS Documentation", "url": "https://postgis.net/documentation/", "type": "Documentation" },
    { "title": "Geospatial Analysis with Python", "url": "https://www.manning.com/books/geospatial-analysis-with-python", "type": "Book" }
  ],
  "tools": ["React", "Mapbox GL/Leaflet", "PostGIS", "PostgreSQL", "Turf.js", "Node.js", "D3.js"],
  "deploymentOptions": ["Netlify", "Vercel", "AWS"],
  "tags": ["gis", "maps", "data-visualization", "geospatial", "interactive"]
},
{
  "id": "project-21",
  "title": "Headless CMS with GraphQL API",
  "description": "Build a flexible content management system with a GraphQL API for delivering content to multiple platforms.",
  "skillsAddressed": ["GraphQL", "Content Modeling", "Node.js", "React", "MongoDB"],
  "difficulty": "Intermediate",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Design content model architecture",
    "Implement GraphQL schema and resolvers",
    "Create content editing interface",
    "Build media management system",
    "Implement user roles and permissions",
    "Add content versioning and scheduling",
    "Create webhooks for content updates",
    "Implement caching and performance optimizations"
  ],
  "learningResources": [
    { "title": "GraphQL Documentation", "url": "https://graphql.org/learn/", "type": "Documentation" },
    { "title": "Apollo Server Documentation", "url": "https://www.apollographql.com/docs/apollo-server/", "type": "Documentation" },
    { "title": "Content Management APIs", "url": "https://www.contentful.com/developers/docs/", "type": "Documentation" }
  ],
  "tools": ["Node.js", "GraphQL", "Apollo Server", "MongoDB", "React", "Express", "Redis"],
  "deploymentOptions": ["Heroku", "DigitalOcean", "AWS"],
  "tags": ["cms", "graphql", "headless", "content-management", "api"]
},
{
  "id": "project-22",
  "title": "Peer-to-Peer File Sharing Application",
  "description": "Create a decentralized file sharing application using WebRTC for direct peer-to-peer transfers.",
  "skillsAddressed": ["WebRTC", "P2P Networking", "Encryption", "JavaScript", "React"],
  "difficulty": "Advanced",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Implement WebRTC data channels",
    "Create signaling server for peer discovery",
    "Build file chunking and reassembly system",
    "Implement end-to-end encryption",
    "Create transfer progress tracking",
    "Add resumable transfers",
    "Build user interface with React",
    "Implement NAT traversal techniques"
  ],
  "learningResources": [
    { "title": "WebRTC Documentation", "url": "https://webrtc.org/getting-started/overview", "type": "Documentation" },
    { "title": "PeerJS Documentation", "url": "https://peerjs.com/docs/", "type": "Documentation" },
    { "title": "Practical WebRTC", "url": "https://www.packtpub.com/product/practical-webrtc/9781785280442", "type": "Book" }
  ],
  "tools": ["WebRTC", "PeerJS", "React", "Node.js", "Socket.io", "Web Crypto API"],
  "deploymentOptions": ["Netlify", "Vercel", "GitHub Pages"],
  "tags": ["p2p", "webrtc", "file-sharing", "decentralized", "encryption"]
},
{
  "id": "project-23",
  "title": "Automated Testing Framework",
  "description": "Build a comprehensive testing framework for web applications with visual regression, E2E, and performance testing.",
  "skillsAddressed": ["Test Automation", "CI/CD", "JavaScript", "Puppeteer/Playwright", "Performance Testing"],
  "difficulty": "Intermediate",
  "timeEstimate": "5-7 weeks",
  "steps": [
    "Set up E2E testing with Playwright or Cypress",
    "Implement visual regression testing",
    "Create performance testing suite",
    "Build test reporting dashboard",
    "Integrate with CI/CD pipelines",
    "Add parallel test execution",
    "Implement test data management",
    "Create documentation and examples"
  ],
  "learningResources": [
    { "title": "Playwright Documentation", "url": "https://playwright.dev/docs/intro", "type": "Documentation" },
    { "title": "Web Performance Testing", "url": "https://web.dev/metrics/", "type": "Documentation" },
    { "title": "Visual Testing Handbook", "url": "https://storybook.js.org/tutorials/visual-testing-handbook/", "type": "Tutorial" }
  ],
  "tools": ["Playwright/Cypress", "Jest", "Lighthouse", "GitHub Actions", "Percy", "Puppeteer", "TypeScript"],
  "deploymentOptions": ["npm package", "GitHub", "Self-hosted"],
  "tags": ["testing", "automation", "ci-cd", "quality-assurance", "performance"]
},
{
  "id": "project-24",
  "title": "Virtual Reality Web Experience",
  "description": "Create an immersive VR experience accessible through web browsers using WebXR and Three.js.",
  "skillsAddressed": ["WebXR", "3D Graphics", "Three.js", "JavaScript", "UX Design"],
  "difficulty": "Advanced",
  "timeEstimate": "7-9 weeks",
  "steps": [
    "Set up Three.js and WebXR API",
    "Create 3D environment and assets",
    "Implement VR controls and interactions",
    "Add physics and collision detection",
    "Create spatial audio system",
    "Optimize for performance across devices",
    "Add multiplayer capabilities",
    "Implement progressive enhancement for non-VR devices"
  ],
  "learningResources": [
    { "title": "WebXR Device API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API", "type": "Documentation" },
    { "title": "Three.js Documentation", "url": "https://threejs.org/docs/", "type": "Documentation" },
    { "title": "3D Game Development with WebXR and Three.js", "url": "https://www.packtpub.com/product/learn-webxr/9781803238432", "type": "Book" }
  ],
  "tools": ["Three.js", "WebXR API", "Blender", "Ammo.js/Cannon.js", "Howler.js", "GLSL"],
  "deploymentOptions": ["Netlify", "Vercel", "GitHub Pages"],
  "tags": ["vr", "webxr", "3d", "immersive", "three-js"]
},
{
  "id": "project-25",
  "title": "Offline-First Progressive Web App",
  "description": "Build a fully functional application that works offline first and synchronizes when connectivity is restored.",
  "skillsAddressed": ["PWA", "Offline Storage", "Service Workers", "Sync Strategies", "IndexedDB"],
  "difficulty": "Intermediate",
  "timeEstimate": "5-7 weeks",
  "steps": [
    "Design offline-first architecture",
    "Implement service worker for offline caching",
    "Create IndexedDB data storage",
    "Build conflict resolution system",
    "Implement background sync",
    "Add push notifications",
    "Create offline UI indicators",
    "Optimize for installation and performance"
  ],
  "learningResources": [
    { "title": "Offline Web Applications", "url": "https://web.dev/learn/pwa/offline-data/", "type": "Tutorial" },
    { "title": "IndexedDB API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API", "type": "Documentation" },
    { "title": "Workbox Documentation", "url": "https://developers.google.com/web/tools/workbox", "type": "Documentation" }
  ],
  "tools": ["Workbox", "IndexedDB", "Service Workers", "React", "PouchDB", "Background Sync API"],
  "deploymentOptions": ["Firebase Hosting", "Netlify", "Vercel"],
  "tags": ["pwa", "offline-first", "service-worker", "sync", "indexeddb"]
},
{
  "id": "project-26",
  "title": "AI-Powered Image Generation Tool",
  "description": "Create a web application that generates images from text descriptions using AI models like DALL-E or Stable Diffusion.",
  "skillsAddressed": ["AI Integration", "API Design", "React", "Python", "Image Processing"],
  "difficulty": "Advanced",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Set up AI model integration (Hugging Face, OpenAI, etc.)",
    "Create image generation API with Python",
    "Build prompt engineering interface",
    "Implement image gallery and organization",
    "Add image editing and refinement tools",
    "Create sharing and export options",
    "Implement user accounts and history",
    "Add style transfer and customization options"
  ],
  "learningResources": [
    { "title": "Hugging Face Diffusers", "url": "https://huggingface.co/docs/diffusers/", "type": "Documentation" },
    { "title": "FastAPI Documentation", "url": "https://fastapi.tiangolo.com/", "type": "Documentation" },
    { "title": "Deep Learning for Computer Vision", "url": "https://www.deeplearningbook.org/", "type": "Book" }
  ],
  "tools": ["Python", "FastAPI", "Hugging Face", "PyTorch", "React", "Redis", "PostgreSQL"],
  "deploymentOptions": ["Hugging Face Spaces", "Google Cloud Run", "AWS SageMaker"],
  "tags": ["ai", "image-generation", "deep-learning", "generative-ai", "stable-diffusion"]
},
{
  "id": "project-27",
  "title": "Secure Password Manager",
  "description": "Build an end-to-end encrypted password management application with zero-knowledge architecture.",
  "skillsAddressed": ["Cryptography", "Security", "React", "Node.js", "IndexedDB"],
  "difficulty": "Advanced",
  "timeEstimate": "7-9 weeks",
  "steps": [
    "Implement client-side encryption with Web Crypto API",
    "Create secure master password handling",
    "Build password generation and strength analysis",
    "Implement secure data synchronization",
    "Create browser extension for autofill",
    "Add two-factor authentication",
    "Implement secure password sharing",
    "Create security audit and breach detection"
  ],
  "learningResources": [
    { "title": "Web Crypto API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API", "type": "Documentation" },
    { "title": "Zero Knowledge Proof", "url": "https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/", "type": "Tutorial" },
    { "title": "Practical Cryptography for Developers", "url": "https://cryptobook.nakov.com/", "type": "Book" }
  ],
  "tools": ["Web Crypto API", "React", "Node.js", "IndexedDB", "WebExtension API", "Express", "PostgreSQL"],
  "deploymentOptions": ["Self-hosted", "Heroku", "AWS"],
  "tags": ["security", "cryptography", "password-manager", "encryption", "zero-knowledge"]
},
{
  "id": "project-28",
  "title": "Social Media Analytics Dashboard",
  "description": "Create a comprehensive analytics platform for tracking and visualizing social media performance across multiple platforms.",
  "skillsAddressed": ["Data Visualization", "API Integration", "React", "Node.js", "Data Analysis"],
  "difficulty": "Intermediate",
  "timeEstimate": "6-8 weeks",
  "steps": [
    "Integrate with social media APIs (Twitter, Facebook, Instagram, etc.)",
    "Create data collection and processing pipeline",
    "Build interactive dashboards with charts and graphs",
    "Implement sentiment analysis for comments and mentions",
    "Add competitor analysis features",
    "Create automated reporting system",
    "Implement trend detection algorithms",
    "Add custom alert system"
  ],
  "learningResources": [
    { "title": "Twitter API Documentation", "url": "https://developer.twitter.com/en/docs", "type": "Documentation" },
    { "title": "D3.js Documentation", "url": "https://d3js.org/", "type": "Documentation" },
    { "title": "Social Media Mining", "url": "https://www.cambridge.org/core/books/social-media-mining/CB0DB232C31E20C8B2F1C3826D6D5A55", "type": "Book" }
  ],
  "tools": ["React", "Node.js", "D3.js/Chart.js", "MongoDB", "Redis", "NLP.js", "Bull"],
  "deploymentOptions": ["Heroku", "DigitalOcean", "AWS"],
  "tags": ["analytics", "social-media", "data-visualization", "sentiment-analysis", "reporting"]
}
]

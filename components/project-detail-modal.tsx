"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ExternalLink, Save, Code, Layers, BookOpen } from "lucide-react"
import { useState } from "react"
import type { ProjectIdea } from "@/app/actions/generate-project-ideas"

interface ProjectDetailModalProps {
  project: ProjectIdea
  isOpen: boolean
  onClose: () => void
}

export function ProjectDetailModal({ project, isOpen, onClose }: ProjectDetailModalProps) {
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    // Get existing saved projects
    const savedProjectsJson = localStorage.getItem("savedProjects")
    let savedProjects = []

    if (savedProjectsJson) {
      try {
        savedProjects = JSON.parse(savedProjectsJson)
      } catch (error) {
        console.error("Error parsing saved projects:", error)
      }
    }

    // Add current project if not already saved
    if (!savedProjects.some((p) => p.id === project.id)) {
      savedProjects.push(project)
      localStorage.setItem("savedProjects", JSON.stringify(savedProjects))
    }
  }

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
          <DialogDescription>{project.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-wrap gap-2">
            {project.skillsAddressed.map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Estimated time: {project.timeEstimate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              <span>Difficulty: {project.difficulty}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
              <Code className="h-5 w-5 text-indigo-600" />
              Project Steps
            </h3>
            <ol className="space-y-2 list-decimal list-inside">
              {project.steps.map((step, index) => (
                <li key={index} className="text-gray-700">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Learning Resources
            </h3>
            <ul className="space-y-2">
              {project.learningResources.map((resource, index) => (
                <li key={index} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {resource.title}
                  </a>
                  <Badge variant="outline" className="ml-1">
                    {resource.type}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Tools & Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {project.tools.map((tool, index) => (
                  <Badge key={index} variant="outline">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Deployment Options</h3>
              <div className="flex flex-wrap gap-2">
                {project.deploymentOptions.map((option, index) => (
                  <Badge key={index} variant="outline">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {project.additionalNotes && (
            <div>
              <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
              <p className="text-gray-700">{project.additionalNotes}</p>
            </div>
          )}

          {project.tags && project.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isSaved} className="gap-1.5">
            {isSaved ? "Saved" : "Save Project"}
            <Save className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

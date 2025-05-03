"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ThumbsDown, ThumbsUp } from "lucide-react"
import { ProjectDetailModal } from "./project-detail-modal"
import type { ProjectIdea } from "@/app/actions/generate-project-ideas"

interface ProjectCardProps {
  project: ProjectIdea
  index: number
  total: number
}

export function ProjectCard({ project, index, total }: ProjectCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardContent className="pt-6 flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-bold line-clamp-2">{project.title}</h3>
              <p className="text-muted-foreground line-clamp-3">{project.description}</p>
            </div>
            <div className="text-right text-muted-foreground ml-2">
              {index + 1} / {total}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags &&
              project.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs py-1">
                  {tag}
                </Badge>
              ))}
          </div>

          <div className="flex items-center text-muted-foreground mb-4">
            <Clock className="mr-2 h-4 w-4" />
            <span>{project.timeEstimate}</span>
          </div>

          <div className="flex items-center mb-2">
            <span className="font-medium mr-2">Difficulty:</span>
            <span>{project.difficulty}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-auto">
          <Button className="w-full" onClick={() => setShowModal(true)}>
            View Details
          </Button>

          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${feedback === "dislike" ? "bg-red-100" : ""}`}
              onClick={() => setFeedback("dislike")}
            >
              <ThumbsDown className={`h-5 w-5 ${feedback === "dislike" ? "text-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${feedback === "like" ? "bg-green-100" : ""}`}
              onClick={() => setFeedback("like")}
            >
              <ThumbsUp className={`h-5 w-5 ${feedback === "like" ? "text-green-500" : ""}`} />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {showModal && <ProjectDetailModal project={project} onClose={() => setShowModal(false)} />}
    </>
  )
}

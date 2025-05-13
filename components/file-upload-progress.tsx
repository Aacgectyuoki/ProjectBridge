"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

interface FileUploadProgressProps {
  isUploading: boolean
  fileName?: string
  fileSize?: number
  onComplete?: () => void
}

export function FileUploadProgress({ isUploading, fileName, fileSize, onComplete }: FileUploadProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isUploading) {
      // Reset progress when a new upload starts
      setProgress(0)

      // Simulate progress for better UX
      // In a real implementation, this would be based on actual upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we approach 90%
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 90 ? 1 : 0.5
          const newProgress = Math.min(prev + increment, 95)
          return newProgress
        })
      }, 300)

      return () => clearInterval(interval)
    } else if (progress > 0) {
      // When upload is complete, quickly finish the progress bar
      setProgress(100)

      // Call onComplete after a short delay
      const timeout = setTimeout(() => {
        if (onComplete) onComplete()
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [isUploading, onComplete])

  if (!isUploading && progress === 0) return null

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>{fileName || "Uploading file..."}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      {fileSize && <div className="text-xs text-gray-400 text-right">{formatFileSize(fileSize)}</div>}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " bytes"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

import type React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function ResponsiveContainer({ children, className, fullWidth = false }: ResponsiveContainerProps) {
  return (
    <div
      className={cn("px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 mx-auto", fullWidth ? "w-full" : "max-w-7xl", className)}
    >
      {children}
    </div>
  )
}

export type ProgressCallback = (status: {
  stage: "starting" | "reading" | "processing" | "complete" | "error"
  progress: number
  error?: Error
}) => void

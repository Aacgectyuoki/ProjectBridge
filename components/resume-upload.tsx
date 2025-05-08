"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { processFile } from "@/utils/file-processor"
import { Progress } from "@/components/ui/progress"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"

interface ResumeUploadProps {
  onUpload?: (text: string) => void
  onFileSelect?: (selected: boolean) => void
  onTextExtracted?: (text: string) => void
}

export function ResumeUpload({ onUpload, onFileSelect, onTextExtracted }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [manualText, setManualText] = useState("")
  const [activeTab, setActiveTab] = useState("upload")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)
    setProgress(0)
    setProgressStage("Starting")
    setError("")
    setExtractedText("")

    if (onFileSelect) {
      onFileSelect(true)
    }

    try {
      const text = await processFile(selectedFile, (data) => {
        setProgress(data.progress)
        setProgressStage(data.stage)
        if (data.error) {
          setError(data.error.message || "Error processing file")
        }
      })

      setExtractedText(text)
      setIsProcessing(false)

      if (onTextExtracted) {
        onTextExtracted(text)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      setError(error.message || "Error processing file")
      setIsProcessing(false)
    }
  }

  const handleTextSubmit = () => {
    const textToProcess = activeTab === "upload" ? extractedText : manualText

    if (!textToProcess.trim()) {
      setError("Please enter text before submitting")
      return
    }

    // Always call onUpload with the processed text
    if (onUpload) {
      onUpload(textToProcess)
    }

    // Also call onTextExtracted to trigger validation
    if (onTextExtracted) {
      onTextExtracted(textToProcess)
    }

    // Clear any previous errors
    setError("")
  }

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <div>
              <h2 className="text-sm font-medium mb-2">Step 1: Upload your resume file or paste text</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleChooseFile}
                  variant="secondary"
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file && <span className="text-sm text-gray-500">{file.name}</span>}
              </div>

              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{progressStage}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {extractedText && (
              <div>
                <h2 className="text-sm font-medium mb-2">Step 1.5: Review or edit extracted text</h2>
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="min-h-[200px]"
                  placeholder="Extracted text will appear here"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="paste" className="space-y-4 pt-4">
            <div>
              <h2 className="text-sm font-medium mb-2">Step 1: Paste your resume text</h2>
              <Textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="min-h-[200px]"
                placeholder="Paste your resume text here"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleTextSubmit}
          className="w-full"
          disabled={
            (activeTab === "upload" && (!extractedText.trim() || isProcessing)) ||
            (activeTab === "paste" && !manualText.trim())
          }
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Step 2: Analyze Text
        </Button>
      </CardFooter>
    </Card>
  )
}

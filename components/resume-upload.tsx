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
import {
  Upload,
  AlertCircle,
  CheckCircle,
  FileText,
  FileIcon as FilePdf,
  FileIcon as FileDocIcon,
  Info,
  Lock,
  ImageIcon,
  Scan,
} from "lucide-react"

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
  const [showExtractionTip, setShowExtractionTip] = useState(false)
  const [isEncryptedPDF, setIsEncryptedPDF] = useState(false)
  const [isScannedPDF, setIsScannedPDF] = useState(false)
  const [isPerformingOCR, setIsPerformingOCR] = useState(false)
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
    setShowExtractionTip(false)
    setIsEncryptedPDF(false)
    setIsScannedPDF(false)
    setIsPerformingOCR(false)

    if (onFileSelect) {
      onFileSelect(true)
    }

    try {
      const text = await processFile(selectedFile, (data) => {
        setProgress(data.progress)
        setProgressStage(data.stage)

        // Detect special PDF types from progress stage
        if (data.stage === "detected encrypted pdf") {
          setIsEncryptedPDF(true)
        } else if (data.stage === "detected scanned pdf") {
          setIsScannedPDF(true)
        } else if (
          data.stage === "preparing ocr" ||
          data.stage === "performing ocr" ||
          data.stage === "processing ocr results" ||
          data.stage === "loading tesseract.js" ||
          data.stage === "initializing worker" ||
          data.stage === "loading language data" ||
          data.stage === "initializing language"
        ) {
          setIsPerformingOCR(true)
        }

        if (data.error) {
          setError(data.error.message || "Error processing file")
        }
      })

      setExtractedText(text)
      setIsProcessing(false)
      setIsPerformingOCR(false)

      // Show extraction tip if the text contains our error message
      if (
        text.includes("couldn't retrieve readable text") ||
        text.includes("security settings") ||
        text.includes("scanned images")
      ) {
        setShowExtractionTip(true)
      }

      if (onTextExtracted) {
        onTextExtracted(text)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      setError(error.message || "Error processing file")
      setIsProcessing(false)
      setIsPerformingOCR(false)
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

  // Get file icon based on file type
  const getFileIcon = () => {
    if (!file) return <FileText className="h-4 w-4" />

    if (file.type === "application/pdf") {
      if (isEncryptedPDF) {
        return <Lock className="h-4 w-4 text-amber-500" />
      } else if (isScannedPDF) {
        return <Scan className="h-4 w-4 text-amber-500" />
      } else {
        return <FilePdf className="h-4 w-4" />
      }
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return <FileDocIcon className="h-4 w-4" />
    } else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
      return <ImageIcon className="h-4 w-4" />
    } else {
      return <FileText className="h-4 w-4" />
    }
  }

  // Format progress stage for display
  const formatProgressStage = (stage: string): string => {
    // Replace underscores and hyphens with spaces
    let formatted = stage.replace(/[_-]/g, " ")

    // Capitalize first letter of each word
    formatted = formatted
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return formatted
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Resume
        </CardTitle>
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
                {file && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    {getFileIcon()}
                    {file.name}
                    {isEncryptedPDF && <span className="ml-1 text-amber-500">(Secured PDF)</span>}
                    {isScannedPDF && <span className="ml-1 text-amber-500">(Scanned PDF)</span>}
                  </span>
                )}
              </div>

              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={`capitalize ${isPerformingOCR ? "text-blue-600 font-medium" : ""}`}>
                      {isPerformingOCR ? "Performing OCR: " : ""}
                      {formatProgressStage(progressStage)}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className={`h-2 ${isPerformingOCR ? "bg-blue-100" : ""}`}
                    indicatorClassName={isPerformingOCR ? "bg-blue-600" : undefined}
                  />
                  {isPerformingOCR && (
                    <p className="text-xs text-blue-600">
                      Performing Optical Character Recognition to extract text from scanned document...
                    </p>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showExtractionTip && (
                <Alert variant="default" className="mt-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700">
                    <p className="font-medium">PDF Extraction Tips:</p>
                    <ul className="list-disc pl-5 mt-1 text-sm">
                      <li>Some PDFs contain scanned images rather than text</li>
                      <li>Security settings may prevent text extraction</li>
                      <li>Try copying text directly from your PDF viewer</li>
                      <li>For best results, use a text-based PDF or Word document</li>
                    </ul>
                  </AlertDescription>
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

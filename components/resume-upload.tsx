"use client"
import { useState, useEffect, useRef } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Linkedin, FileText, AlertCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { analyzeResume } from "@/app/actions/analyze-resume"
import { extractSkills } from "@/app/actions/extract-skills"
import { useToast } from "@/hooks/use-toast"
import { SkillsLogger } from "@/utils/skills-logger"
import { EnhancedSkillsLogger } from "@/utils/enhanced-skills-logger"
import { getCurrentSessionId, forceNewSession } from "@/utils/analysis-session-manager"
import { storeCompatibleAnalysisData } from "@/utils/analysis-session-manager"
import { validateResumeFile, extractTextFromFile } from "@/utils/file-processor"
import { logDetailedError, checkpoint, timeExecution } from "@/utils/debug-utils"
import { cleanupExtractedSkills } from "@/utils/skill-extraction-utils"
import { cleanExtractedText } from "@/utils/text-preprocessor"
import { FileUploadProgress } from "@/components/file-upload-progress"

export function ResumeUpload({ onUpload, onFileSelect }) {
  const [file, setFile] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [extractedText, setExtractedText] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [showExtractedText, setShowExtractedText] = useState(false)
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  // Reset progress when component unmounts
  useEffect(() => {
    return () => {
      setUploadProgress(0)
    }
  }, [])

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    // Notify parent component that a file has been selected
    if (onFileSelect) {
      onFileSelect(true)
    }

    // Read file content if it's a text file
    if (selectedFile.type === "text/plain") {
      try {
        const reader = new FileReader()
        reader.onload = (event) => {
          setResumeText(event.target.result)
          setExtractedText(event.target.result)
          setShowExtractedText(true)
        }
        reader.readAsText(selectedFile)
      } catch (error) {
        logDetailedError(error, "handleFileChange")
        toast({
          title: "Error reading file",
          description: "Could not read the file content. Please try again.",
          variant: "destructive",
        })
      }
    } else if (
      selectedFile.type === "application/pdf" ||
      selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For PDF and DOCX files, extract text
      setIsExtracting(true)
      setExtractionProgress(0)

      try {
        // STEP 1: Extract text from file
        const text = await extractTextFromFile(selectedFile, (progress) => {
          setExtractionProgress(progress)
        })

        setExtractedText(text)
        setShowExtractedText(true)
        setIsExtracting(false)
      } catch (error) {
        setIsExtracting(false)
        logDetailedError(error, "extractTextFromFile")
        toast({
          title: "Text Extraction Failed",
          description:
            "Failed to extract text from the file. Please try another file or paste your resume text directly.",
          variant: "destructive",
        })
      }
    }
  }

  const handleLinkedinSubmit = (e) => {
    e.preventDefault()
    if (linkedinUrl) {
      setIsUploading(true)
      // In a real app, you would process the LinkedIn URL here
      setTimeout(() => {
        setIsUploading(false)
        onUpload({ type: "linkedin", data: linkedinUrl })
      }, 1500)
    }
  }

  const formatSkillsList = (skills) => {
    if (!skills || skills.length === 0) return "None detected"
    return skills.join(", ")
  }

  // Function to store analysis data consistently
  const storeAnalysisResults = (analysisData, extractedSkills, sourceText) => {
    try {
      checkpoint("storeAnalysisResults-start", { sessionId: getCurrentSessionId() })

      // Clean up and properly categorize skills
      const cleanedAnalysis = {
        ...analysisData,
        skills: cleanupExtractedSkills({ skills: analysisData.skills }).skills,
      }

      // Store in both session-specific and legacy formats
      storeCompatibleAnalysisData("resumeAnalysis", cleanedAnalysis)
      storeCompatibleAnalysisData("extractedResumeSkills", extractedSkills)

      // Also store the raw text for reference
      if (sourceText) {
        storeCompatibleAnalysisData("resumeText", sourceText)
      }

      // Log for debugging
      checkpoint("storeAnalysisResults-complete", {
        technicalSkills: cleanedAnalysis.skills.technical?.length || 0,
        softSkills: cleanedAnalysis.skills.soft?.length || 0,
      })

      return true
    } catch (error) {
      logDetailedError(error, "storeAnalysisResults")
      return false
    }
  }

  // Function to extract basic skills (fallback)
  const extractBasicSkills = (text) => {
    const technicalSkills = []
    const softSkills = []

    // Basic keyword matching (expand as needed)
    const technicalKeywords = ["JavaScript", "React", "Node.js", "HTML", "CSS", "Python", "Java"]
    const softKeywords = ["Communication", "Teamwork", "Leadership", "Problem-solving"]

    technicalKeywords.forEach((keyword) => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        technicalSkills.push(keyword)
      }
    })

    softKeywords.forEach((keyword) => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        softSkills.push(keyword)
      }
    })

    return {
      technical: technicalSkills,
      soft: softSkills,
    }
  }

  const handleTextAnalysis = async (e) => {
    e.preventDefault()
    setError("")

    if (resumeText) {
      // Create a new session for this analysis
      forceNewSession()

      try {
        setIsAnalyzing(true)
        checkpoint("handleTextAnalysis-start")

        // Clean and preprocess the text
        const cleanedText = cleanExtractedText(resumeText)

        // First, extract skills using our new LLM-based extractor
        let extractedSkills
        try {
          extractedSkills = await timeExecution(() => extractSkills(cleanedText, "resume"), "extractSkills")
          checkpoint("extractSkills-complete", extractedSkills)

          // Log the extraction with our enhanced logger
          EnhancedSkillsLogger.logExtractedSkills(cleanedText, extractedSkills, "resume-text-input", 0)
        } catch (skillsError) {
          logDetailedError(skillsError, "extractSkills")
          // Continue with default skills
          extractedSkills = {
            technical: [],
            soft: [],
            tools: [],
            frameworks: [],
            languages: [],
            databases: [],
            methodologies: [],
            platforms: [],
            other: [],
          }

          toast({
            title: "Skills extraction limited",
            description: "We had trouble extracting all skills. Basic analysis will continue.",
            variant: "warning",
          })
        }

        // Then, analyze the resume for other information
        let analysisResult
        try {
          analysisResult = await timeExecution(() => analyzeResume(cleanedText), "analyzeResume")
          checkpoint("analyzeResume-complete", {
            hasSkills: !!analysisResult?.skills,
            technicalSkillsCount: analysisResult?.skills?.technical?.length || 0,
          })

          // Validate the result has the expected structure
          if (!analysisResult || !analysisResult.skills) {
            throw new Error("Invalid analysis result structure")
          }
        } catch (analysisError) {
          logDetailedError(analysisError, "analyzeResume")

          // Create a fallback analysis result
          analysisResult = {
            skills: {
              technical: extractedSkills.technical || [],
              soft: extractedSkills.soft || [],
            },
            experience: [],
            education: [],
            summary: "Analysis could not be completed fully.",
            strengths: [],
            weaknesses: ["Resume analysis was incomplete due to technical issues."],
          }

          toast({
            title: "Analysis partially completed",
            description: "We encountered some issues analyzing your resume, but extracted the skills successfully.",
            variant: "warning",
          })
        }

        // Combine the results - use the more detailed skill extraction
        const enhancedAnalysis = {
          ...analysisResult,
          skills: {
            technical: [
              ...(analysisResult.skills.technical || []),
              ...(extractedSkills.technical || []),
              ...(extractedSkills.frameworks || []),
              ...(extractedSkills.languages || []),
              ...(extractedSkills.databases || []),
              ...(extractedSkills.tools || []),
              ...(extractedSkills.platforms || []),
            ].filter(
              (skill, index, self) => skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
            ),
            soft: analysisResult.skills.soft
              ? [
                  ...(analysisResult.skills.soft || []),
                  ...(extractedSkills.soft || []),
                  ...(extractedSkills.methodologies || []),
                ].filter(
                  (skill, index, self) =>
                    skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
                )
              : [],
          },
          extractedSkills, // Add the full extracted skills data
        }

        // Store the analysis result using our session management
        const storageSuccess = storeAnalysisResults(enhancedAnalysis, extractedSkills, cleanedText)
        checkpoint("storeAnalysisResults", { success: storageSuccess })

        setIsAnalyzing(false)
        onUpload({
          type: "text",
          data: cleanedText,
          analysis: enhancedAnalysis,
        })

        // Log the skills
        SkillsLogger.logSkills(
          enhancedAnalysis.skills.technical || [],
          enhancedAnalysis.skills.soft || [],
          "resume-text",
        )

        // Show more detailed toast with actual skills
        toast({
          title: "Resume analyzed successfully",
          description: (
            <div className="space-y-1">
              <p>
                <strong>Technical skills:</strong>{" "}
                {formatSkillsList((enhancedAnalysis.skills.technical || []).slice(0, 5))}
                {enhancedAnalysis.skills.technical && enhancedAnalysis.skills.technical.length > 5
                  ? ` and ${enhancedAnalysis.skills.technical.length - 5} more`
                  : ""}
              </p>
              {enhancedAnalysis.skills.soft && enhancedAnalysis.skills.soft.length > 0 && (
                <p>
                  <strong>Soft skills:</strong> {formatSkillsList(enhancedAnalysis.skills.soft.slice(0, 3))}
                  {enhancedAnalysis.skills.soft.length > 3
                    ? ` and ${enhancedAnalysis.skills.soft.length - 3} more`
                    : ""}
                </p>
              )}
              <p>
                <strong>Work experiences:</strong> {(analysisResult.experience || []).length}
              </p>
            </div>
          ),
          duration: 5000, // Show for longer since there's more to read
        })
      } catch (error) {
        setIsAnalyzing(false)
        logDetailedError(error, "handleTextAnalysis-main")

        // Provide a more specific error message for JSON parsing issues
        let errorMessage = "Failed to analyze resume. Please try again."
        if (error.message && error.message.includes("JSON")) {
          errorMessage =
            "There was an issue processing the resume data. The system is trying to recover automatically. Please try again if needed."

          // Attempt a retry with a simplified prompt
          try {
            toast({
              title: "Retrying analysis",
              description: "We encountered an issue and are trying again with a simplified approach.",
              variant: "warning",
            })

            // Create a simplified fallback analysis
            const fallbackAnalysis = {
              skills: {
                technical: extractBasicSkills(resumeText).technical,
                soft: [],
              },
              experience: [],
              education: [],
              summary: "Analysis could not be completed fully.",
              strengths: [],
              weaknesses: ["Resume analysis was incomplete due to technical issues."],
            }

            // Store the fallback analysis
            storeAnalysisResults(fallbackAnalysis, { technical: fallbackAnalysis.skills.technical }, resumeText)

            setIsAnalyzing(false)
            onUpload({
              type: "text",
              data: resumeText,
              analysis: fallbackAnalysis,
            })

            return
          } catch (retryError) {
            logDetailedError(retryError, "handleTextAnalysis-retry")
          }
        }

        setError(error.message || errorMessage)
        toast({
          title: "Analysis failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    setError("")
    setUploadProgress(0)

    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a new session for this upload
      forceNewSession()
      setIsUploading(true)
      checkpoint("handleFileUpload-start", { fileName: file.name, fileType: file.type, fileSize: file.size })

      // Validate the file
      const validation = validateResumeFile(file)
      if (!validation.valid) {
        setIsUploading(false)
        setError(validation.message || "Invalid file")
        toast({
          title: "Invalid file",
          description: validation.message,
          variant: "destructive",
        })
        return
      }

      // Set initial progress
      setUploadProgress(10)

      // Extract text from the file
      let extractedText
      try {
        // Update progress to show we're starting extraction
        setUploadProgress(20)

        extractedText = await timeExecution(() => extractTextFromFile(file), "extractTextFromFile")
        checkpoint("extractTextFromFile-complete", { textLength: extractedText.length })

        // Clean and preprocess the extracted text
        extractedText = cleanExtractedText(extractedText)

        // Update progress after text extraction
        setUploadProgress(40)

        // Store the raw text for reference
        storeCompatibleAnalysisData("resumeText", extractedText)
      } catch (extractionError) {
        logDetailedError(extractionError, "extractTextFromFile")
        setIsUploading(false)
        setUploadProgress(0)
        setError("Failed to extract text from file")
        toast({
          title: "Text extraction failed",
          description: "We couldn't read the content of your file. Please try another file or paste the text directly.",
          variant: "destructive",
        })
        return
      }

      // Extract skills using our LLM-based extractor
      let extractedSkills
      try {
        // Update progress to show we're starting skill extraction
        setUploadProgress(50)

        extractedSkills = await timeExecution(() => extractSkills(extractedText, "resume"), "extractSkills")
        checkpoint("extractSkills-complete", extractedSkills)

        // Update progress after skill extraction
        setUploadProgress(70)
      } catch (skillsError) {
        logDetailedError(skillsError, "extractSkills")
        // Continue with default skills
        extractedSkills = {
          technical: [],
          soft: [],
          tools: [],
          frameworks: [],
          languages: [],
          databases: [],
          methodologies: [],
          platforms: [],
          other: [],
        }
      }

      // Analyze the resume for other information
      let analysisResult
      try {
        // Update progress to show we're starting resume analysis
        setUploadProgress(80)

        analysisResult = await timeExecution(() => analyzeResume(extractedText), "analyzeResume")
        checkpoint("analyzeResume-complete", {
          hasSkills: !!analysisResult?.skills,
          technicalSkillsCount: analysisResult?.skills?.technical?.length || 0,
        })

        // Update progress after resume analysis
        setUploadProgress(90)
      } catch (analysisError) {
        logDetailedError(analysisError, "analyzeResume")
        // Create a fallback analysis result
        analysisResult = {
          skills: {
            technical: extractedSkills.technical || [],
            soft: extractedSkills.soft || [],
          },
          experience: [],
          education: [],
          summary: "Analysis could not be completed fully.",
          strengths: [],
          weaknesses: ["Resume analysis was incomplete due to technical issues."],
        }
      }

      // Combine the results
      const enhancedAnalysis = {
        ...analysisResult,
        skills: {
          technical: [
            ...(analysisResult.skills?.technical || []),
            ...(extractedSkills.technical || []),
            ...(extractedSkills.frameworks || []),
            ...(extractedSkills.languages || []),
            ...(extractedSkills.databases || []),
            ...(extractedSkills.tools || []),
            ...(extractedSkills.platforms || []),
          ].filter(
            (skill, index, self) => skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
          ),
          soft: [
            ...(analysisResult.skills?.soft || []),
            ...(extractedSkills.soft || []),
            ...(extractedSkills.methodologies || []),
          ].filter(
            (skill, index, self) => skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
          ),
        },
        extractedSkills,
      }

      // Clean up skills to ensure proper categorization
      const cleanedAnalysis = {
        ...enhancedAnalysis,
        skills: cleanupExtractedSkills({ skills: enhancedAnalysis.skills }).skills,
      }

      // Store the analysis result
      const storageSuccess = storeAnalysisResults(cleanedAnalysis, extractedSkills, extractedText)
      checkpoint("storeAnalysisResults", { success: storageSuccess })

      // Log the skills
      SkillsLogger.logSkills(
        cleanedAnalysis.skills.technical || [],
        cleanedAnalysis.skills.soft || [],
        `resume-file-${file.type}`,
      )

      // Complete the progress
      setUploadProgress(100)

      // Short delay before completing to show 100% progress
      setTimeout(() => {
        setIsUploading(false)
        onUpload({
          type: "file",
          data: {
            name: file.name,
            type: file.type,
            size: file.size,
            text: extractedText, // Include the extracted text
          },
          analysis: cleanedAnalysis,
        })

        // Show success toast
        toast({
          title: "Resume analyzed successfully",
          description: (
            <div className="space-y-1">
              <p>
                <strong>Technical skills:</strong>{" "}
                {formatSkillsList((cleanedAnalysis.skills.technical || []).slice(0, 5))}
                {cleanedAnalysis.skills.technical && cleanedAnalysis.skills.technical.length > 5
                  ? ` and ${cleanedAnalysis.skills.technical.length - 5} more`
                  : ""}
              </p>
              {cleanedAnalysis.skills.soft && cleanedAnalysis.skills.soft.length > 0 && (
                <p>
                  <strong>Soft skills:</strong> {formatSkillsList(cleanedAnalysis.skills.soft.slice(0, 3))}
                  {cleanedAnalysis.skills.soft.length > 3 ? ` and ${cleanedAnalysis.skills.soft.length - 3} more` : ""}
                </p>
              )}
              <p>
                <strong>Work experiences:</strong> {(analysisResult.experience || []).length}
              </p>
            </div>
          ),
          duration: 5000,
        })
      }, 500)
    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
      logDetailedError(error, "handleFileUpload-main")
      setError(error.message || "Failed to analyze resume. Please try again.")
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze resume. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExtractedTextSubmit = () => {
    if (!extractedText.trim()) {
      toast({
        title: "Empty Text",
        description: "Please enter your resume text before submitting.",
        variant: "destructive",
      })
      return
    }

    // Process the extracted text using the existing file upload flow
    setResumeText(extractedText)

    // Create a synthetic file object for the extracted text
    const syntheticFile = new File([extractedText], "extracted-text.txt", { type: "text/plain" })
    setFile(syntheticFile)

    // Submit the form to process the text
    handleFileUpload({ preventDefault: () => {} })
  }

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setFile(null)
    setUploadProgress(0)
    setExtractedText("")
    setShowExtractedText(false)
    if (onFileSelect) {
      onFileSelect(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Resume
          </TabsTrigger>
          <TabsTrigger value="linkedin">
            <Linkedin className="mr-2 h-4 w-4" />
            LinkedIn URL
          </TabsTrigger>
          <TabsTrigger value="text">
            <FileText className="mr-2 h-4 w-4" />
            Paste Text
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <form onSubmit={handleFileUpload}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="resume">Step 1: Upload Resume File</Label>
                <Input
                  id="resume"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                  ref={fileInputRef}
                />
                {file && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                    <Button variant="ghost" size="sm" onClick={resetFileInput} type="button">
                      Clear
                    </Button>
                  </div>
                )}

                {/* Text extraction progress */}
                {isExtracting && (
                  <FileUploadProgress
                    progress={extractionProgress}
                    fileName={file?.name || ""}
                    fileSize={file?.size || 0}
                    status="Extracting text..."
                  />
                )}

                {/* Show extracted text for review/edit */}
                {showExtractedText && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="extracted-text">Step 1.5: Review Extracted Text</Label>
                    <Textarea
                      id="extracted-text"
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="min-h-[200px]"
                      placeholder="Extracted text will appear here. You can edit it if needed."
                    />
                  </div>
                )}

                {/* Upload progress bar */}
                {isUploading && (
                  <FileUploadProgress
                    progress={uploadProgress}
                    fileName={file?.name || ""}
                    fileSize={file?.size || 0}
                    status="Analyzing resume..."
                  />
                )}
              </div>

              {showExtractedText ? (
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={resetFileInput} disabled={isUploading}>
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExtractedTextSubmit}
                    disabled={isUploading || !extractedText.trim()}
                  >
                    Step 2: Analyze Text
                  </Button>
                </div>
              ) : (
                <Button disabled={isUploading || !file || isExtracting} type="submit">
                  {isUploading ? "Analyzing..." : "Upload and Analyze"}
                </Button>
              )}
            </div>
          </form>
        </TabsContent>
        <TabsContent value="linkedin">
          <form onSubmit={handleLinkedinSubmit}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                <Input
                  id="linkedin-url"
                  type="url"
                  placeholder="https://www.linkedin.com/in/johndoe"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
              <Button disabled={isUploading || !linkedinUrl} type="submit">
                {isUploading ? "Analyzing..." : "Analyze LinkedIn Profile"}
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="text">
          <form onSubmit={handleTextAnalysis}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="resume-text">Resume Text</Label>
                <Textarea
                  id="resume-text"
                  placeholder="Paste your resume text here"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <Button disabled={isAnalyzing || !resumeText} type="submit">
                {isAnalyzing ? "Analyzing..." : "Analyze Text"}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

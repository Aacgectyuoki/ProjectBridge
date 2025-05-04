"use client"

import { AlertDescription } from "@/components/ui/alert"

import { AlertTitle } from "@/components/ui/alert"

import { Alert } from "@/components/ui/alert"

import { useState } from "react"
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
import { storeAnalysisData, getCurrentSessionId } from "@/utils/analysis-session-manager"

export function ResumeUpload({ onUpload, onFileSelect }) {
  const [file, setFile] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const sessionId = getCurrentSessionId()

  // Add this function near the top of the component, after the useState declarations
  const validateInput = (text: string) => {
    // Check if the text is too similar to the job description (if available)
    const jobDescText = localStorage.getItem("jobDescriptionText")
    if (jobDescText) {
      // Simple similarity check - if more than 80% similar, likely the same text
      const similarity = calculateTextSimilarity(text, jobDescText)
      if (similarity > 0.8) {
        toast({
          title: "Warning: Similar to job description",
          description:
            "Your resume text appears very similar to the job description. Please ensure you've pasted your actual resume.",
          variant: "warning",
          duration: 6000,
        })
        return false
      }
    }
    return true
  }

  // Add this helper function
  const calculateTextSimilarity = (text1: string, text2: string) => {
    // Normalize texts
    const normalized1 = text1.toLowerCase().replace(/\s+/g, " ").trim()
    const normalized2 = text2.toLowerCase().replace(/\s+/g, " ").trim()

    // Simple check - if texts are nearly identical
    if (normalized1 === normalized2) return 1.0

    // If one is a substring of the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.9
    }

    // More sophisticated check could be implemented here
    // For now, just check if they share a lot of the same words
    const words1 = new Set(normalized1.split(" "))
    const words2 = new Set(normalized2.split(" "))

    const intersection = new Set([...words1].filter((x) => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Notify parent component that a file has been selected
      if (onFileSelect) {
        onFileSelect(true)
      }

      // Read file content if it's a text file
      if (selectedFile.type === "text/plain") {
        try {
          const text = await selectedFile.text()
          setResumeText(text)
        } catch (error) {
          console.error("Error reading file:", error)
          toast({
            title: "Error reading file",
            description: "Could not read the file content. Please try again.",
            variant: "destructive",
          })
        }
      }
    } else {
      // Notify parent component that no file is selected
      if (onFileSelect) {
        onFileSelect(false)
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
      console.log(`Storing resume analysis in session ${sessionId}`)

      // Store in session storage with session ID
      storeAnalysisData("resumeAnalysis", analysisData)
      storeAnalysisData("extractedResumeSkills", extractedSkills)

      // Also store the raw text for reference
      if (sourceText) {
        storeAnalysisData("resumeText", sourceText)
      }

      // Log for debugging
      console.log("Resume analysis stored successfully")
      console.log("Technical skills:", analysisData.skills.technical)
      if (analysisData.skills.soft) {
        console.log("Soft skills:", analysisData.skills.soft)
      }

      return true
    } catch (error) {
      console.error("Error storing resume analysis:", error)
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

  const handleTextAnalysis = async (text) => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeResume(text)
      if (result) {
        // setAnalysisResults(result); // This line was removed because setAnalysisResults is not defined
      } else {
        toast({
          title: "Analysis Error",
          description: "Failed to analyze resume. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Resume analysis error:", error)
      toast({
        title: "Analysis Error",
        description: "An unexpected error occurred during analysis.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleTextAnalysisOld = async (e) => {
    e.preventDefault()
    setError("")

    if (resumeText) {
      // Validate input before proceeding
      if (!validateInput(resumeText)) {
        // Continue anyway, but the warning has been shown
      }

      try {
        setIsAnalyzing(true)
        const startTime = performance.now()

        // First, extract skills using our new LLM-based extractor
        let extractedSkills
        try {
          extractedSkills = await extractSkills(resumeText, "resume")
          console.log("Successfully extracted skills:", extractedSkills)

          // Log the extraction with our enhanced logger
          const processingTime = performance.now() - startTime
          EnhancedSkillsLogger.logExtractedSkills(
            resumeText,
            extractedSkills,
            "resume-text-input",
            Math.round(processingTime),
          )
        } catch (skillsError) {
          console.error("Error extracting skills:", skillsError)
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
          analysisResult = await analyzeResume(resumeText)

          // Validate the result has the expected structure
          if (!analysisResult || !analysisResult.skills) {
            console.error("Invalid analysis result structure:", analysisResult)
            throw new Error("Invalid analysis result structure")
          }
        } catch (analysisError) {
          console.error("Error in resume analysis:", analysisError)

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
        storeAnalysisResults(enhancedAnalysis, extractedSkills, resumeText)

        setIsAnalyzing(false)
        onUpload({
          type: "text",
          data: resumeText,
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
        console.error("Analysis error:", error)

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
            console.error("Retry also failed:", retryError)
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

    if (file) {
      setIsUploading(true)

      try {
        // For text files, we can analyze directly
        if (file.type === "text/plain") {
          const text = await file.text()

          // Extract skills using our new LLM-based extractor
          let extractedSkills
          try {
            extractedSkills = await extractSkills(text, "resume")
          } catch (skillsError) {
            console.error("Error extracting skills:", skillsError)
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

          // Analyze the resume for other information
          let analysisResult
          try {
            analysisResult = await analyzeResume(text)

            // Validate the result has the expected structure
            if (!analysisResult || !analysisResult.skills) {
              console.error("Invalid analysis result structure:", analysisResult)
              throw new Error("Invalid analysis result structure")
            }
          } catch (analysisError) {
            console.error("Error in resume analysis:", analysisError)

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

          // Combine the results
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
                (skill, index, self) =>
                  skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
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
          storeAnalysisResults(enhancedAnalysis, extractedSkills, text)

          SkillsLogger.logSkills(
            enhancedAnalysis.skills.technical || [],
            enhancedAnalysis.skills.soft || [],
            `resume-file-${file.type}`,
          )

          setIsUploading(false)
          onUpload({
            type: "file",
            data: {
              name: file.name,
              type: file.type,
              size: file.size,
            },
            analysis: enhancedAnalysis,
          })

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
        } else {
          // For PDF and DOCX files, we need to extract text first
          // In a real implementation, this would use a server-side API
          // For now, we'll use a more comprehensive mock that includes all skills

          // Read the file as an ArrayBuffer to simulate processing
          const reader = new FileReader()

          reader.onload = async () => {
            // Simulate text extraction from PDF/DOCX
            // In a real app, this would use a PDF/DOCX parsing library

            // Create a more comprehensive mock resume text that includes all skills
            const mockResumeText = `
            John Doe
            Software Developer
            
            SKILLS
            JavaScript, React, Node.js, HTML, CSS, TypeScript, GraphQL, MongoDB, AWS, Docker
            Leadership, Team Management, Communication, Problem Solving, Agile Methodologies
            
            EXPERIENCE
            Senior Developer at Tech Co (2020-Present)
            - Developed web applications using React and Node.js
            - Led a team of 5 developers
            - Implemented CI/CD pipelines using GitHub Actions and Docker
            - Designed and built GraphQL APIs with Apollo Server
            
            Junior Developer at Startup Inc (2018-2020)
            - Built responsive websites with HTML, CSS, and JavaScript
            - Worked with REST APIs and MongoDB
            - Participated in Agile development processes
            
            EDUCATION
            Bachelor of Computer Science, University of Technology (2018)
          `

            try {
              // Extract skills using our new LLM-based extractor
              let extractedSkills
              try {
                extractedSkills = await extractSkills(mockResumeText, "resume")
              } catch (skillsError) {
                console.error("Error extracting skills:", skillsError)
                // Continue with default skills
                extractedSkills = {
                  technical: [
                    "JavaScript",
                    "React",
                    "Node.js",
                    "HTML",
                    "CSS",
                    "TypeScript",
                    "GraphQL",
                    "MongoDB",
                    "AWS",
                    "Docker",
                  ],
                  soft: ["Leadership", "Team Management", "Communication", "Problem Solving", "Agile Methodologies"],
                  tools: ["Docker", "GitHub Actions"],
                  frameworks: ["React"],
                  languages: ["JavaScript", "TypeScript"],
                  databases: ["MongoDB"],
                  methodologies: ["Agile"],
                  platforms: ["AWS"],
                  other: [],
                }

                toast({
                  title: "Skills extraction limited",
                  description: "We had trouble extracting all skills. Basic analysis will continue.",
                  variant: "warning",
                })
              }

              // Analyze the resume for other information
              let analysisResult
              try {
                analysisResult = await analyzeResume(mockResumeText)

                // Validate the result has the expected structure
                if (!analysisResult || !analysisResult.skills) {
                  console.error("Invalid analysis result structure:", analysisResult)
                  throw new Error("Invalid analysis result structure")
                }
              } catch (analysisError) {
                console.error("Error in resume analysis:", analysisError)

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
                  description:
                    "We encountered some issues analyzing your resume, but extracted the skills successfully.",
                  variant: "warning",
                })
              }

              // Combine the results
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
                    (skill, index, self) =>
                      skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
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
              storeAnalysisResults(enhancedAnalysis, extractedSkills, mockResumeText)

              SkillsLogger.logSkills(
                enhancedAnalysis.skills.technical || [],
                enhancedAnalysis.skills.soft || [],
                `resume-file-${file.type}`,
              )

              setIsUploading(false)
              onUpload({
                type: "file",
                data: {
                  name: file.name,
                  type: file.type,
                  size: file.size,
                },
                analysis: enhancedAnalysis,
              })

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
              setIsUploading(false)
              console.error("Analysis error:", error)
              setError(error.message || "Failed to analyze resume. Please try again.")
              toast({
                title: "Analysis failed",
                description: error.message || "Failed to analyze resume. Please try again.",
                variant: "destructive",
              })
            }
          }

          reader.onerror = () => {
            setIsUploading(false)
            setError("Could not read the file content. Please try again.")
            toast({
              title: "Error reading file",
              description: "Could not read the file content. Please try again.",
              variant: "destructive",
            })
          }

          // Start reading the file
          reader.readAsArrayBuffer(file)
        }
      } catch (error) {
        setIsUploading(false)
        console.error("Analysis error:", error)
        setError(error.message || "Failed to analyze resume. Please")
      }
    }
  }

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
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
                <Label htmlFor="resume">Resume File</Label>
                <Input id="resume" type="file" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
              </div>
              <Button disabled={isUploading} type="submit">
                {isUploading ? "Uploading..." : "Upload and Analyze"}
              </Button>
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
              <Button disabled={isUploading} type="submit">
                {isUploading ? "Analyzing..." : "Analyze LinkedIn Profile"}
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="text">
          <form onSubmit={handleTextAnalysisOld}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="resume-text">Resume Text</Label>
                <Textarea
                  id="resume-text"
                  placeholder="Paste your resume text here"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
              <Button disabled={isAnalyzing} type="submit">
                {isAnalyzing ? "Analyzing..." : "Analyze Text"}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

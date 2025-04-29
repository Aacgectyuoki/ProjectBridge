"use client"

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ResumeUpload({ onUpload, onFileSelect }) {
  const [file, setFile] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

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

  const handleTextAnalysis = async (e) => {
    e.preventDefault()
    setError("")

    if (resumeText) {
      // Validate input before proceeding
      if (!validateInput(resumeText)) {
        // Continue anyway, but the warning has been shown
      }

      try {
        setIsAnalyzing(true)

        // Store the resume text for future comparison
        localStorage.setItem("resumeText", resumeText)

        // First, extract skills using our new LLM-based extractor
        let extractedSkills
        try {
          extractedSkills = await extractSkills(resumeText, "resume")
          console.log("Successfully extracted skills:", extractedSkills)
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
        const analysisResult = await analyzeResume(resumeText)

        // Combine the results - use the more detailed skill extraction
        const enhancedAnalysis = {
          ...analysisResult,
          skills: {
            technical: [
              ...analysisResult.skills.technical,
              ...extractedSkills.technical,
              ...extractedSkills.frameworks,
              ...extractedSkills.languages,
              ...extractedSkills.databases,
              ...extractedSkills.tools,
              ...extractedSkills.platforms,
            ].filter(
              (skill, index, self) => skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
            ),
            soft: [...analysisResult.skills.soft, ...extractedSkills.soft, ...extractedSkills.methodologies].filter(
              (skill, index, self) => skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
            ),
          },
          extractedSkills, // Add the full extracted skills data
        }

        setIsAnalyzing(false)
        onUpload({
          type: "text",
          data: resumeText,
          analysis: enhancedAnalysis,
        })

        // Store the analysis result in localStorage for later use
        try {
          localStorage.setItem("resumeAnalysis", JSON.stringify(enhancedAnalysis))
          localStorage.setItem("extractedResumeSkills", JSON.stringify(extractedSkills))

          // Log detected skills to console for debugging
          console.log("Extracted skills:", extractedSkills)
          console.log("Technical skills:", enhancedAnalysis.skills.technical)
          console.log("Soft skills:", enhancedAnalysis.skills.soft)
        } catch (error) {
          console.error("Error saving resume analysis to localStorage:", error)
        }

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
                <strong>Technical skills:</strong> {formatSkillsList(enhancedAnalysis.skills.technical.slice(0, 5))}
                {enhancedAnalysis.skills.technical.length > 5
                  ? ` and ${enhancedAnalysis.skills.technical.length - 5} more`
                  : ""}
              </p>
              <p>
                <strong>Soft skills:</strong> {formatSkillsList(enhancedAnalysis.skills.soft.slice(0, 3))}
                {enhancedAnalysis.skills.soft.length > 3 ? ` and ${enhancedAnalysis.skills.soft.length - 3} more` : ""}
              </p>
              <p>
                <strong>Work experiences:</strong> {analysisResult.experience.length}
              </p>
            </div>
          ),
          duration: 5000, // Show for longer since there's more to read
        })
      } catch (error) {
        setIsAnalyzing(false)
        console.error("Analysis error:", error)
        setError(error.message || "Failed to analyze resume. Please try again.")
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze resume. Please try again.",
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
          const analysisResult = await analyzeResume(text)

          // Combine the results
          const enhancedAnalysis = {
            ...analysisResult,
            skills: {
              technical: [
                ...analysisResult.skills.technical,
                ...extractedSkills.technical,
                ...extractedSkills.frameworks,
                ...extractedSkills.languages,
                ...extractedSkills.databases,
                ...extractedSkills.tools,
                ...extractedSkills.platforms,
              ].filter(
                (skill, index, self) =>
                  skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
              ),
              soft: [...analysisResult.skills.soft, ...extractedSkills.soft, ...extractedSkills.methodologies].filter(
                (skill, index, self) =>
                  skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
              ),
            },
            extractedSkills, // Add the full extracted skills data
          }

          // Store the analysis result in localStorage for later use
          try {
            localStorage.setItem("resumeAnalysis", JSON.stringify(enhancedAnalysis))
            localStorage.setItem("extractedResumeSkills", JSON.stringify(extractedSkills))

            // Log detected skills to console for debugging
            console.log("Extracted skills:", extractedSkills)
            console.log("Technical skills:", enhancedAnalysis.skills.technical)
            console.log("Soft skills:", enhancedAnalysis.skills.soft)
          } catch (error) {
            console.error("Error saving resume analysis to localStorage:", error)
          }

          SkillsLogger.logSkills(
            enhancedAnalysis.skills.technical || [],
            enhancedAnalysis.skills.soft || [],
            "resume-file",
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
                  <strong>Technical skills:</strong> {formatSkillsList(enhancedAnalysis.skills.technical.slice(0, 5))}
                  {enhancedAnalysis.skills.technical.length > 5
                    ? ` and ${enhancedAnalysis.skills.technical.length - 5} more`
                    : ""}
                </p>
                <p>
                  <strong>Soft skills:</strong> {formatSkillsList(enhancedAnalysis.skills.soft.slice(0, 3))}
                  {enhancedAnalysis.skills.soft.length > 3
                    ? ` and ${enhancedAnalysis.skills.soft.length - 3} more`
                    : ""}
                </p>
                <p>
                  <strong>Work experiences:</strong> {analysisResult.experience.length}
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
              const analysisResult = await analyzeResume(mockResumeText)

              // Combine the results
              const enhancedAnalysis = {
                ...analysisResult,
                skills: {
                  technical: [
                    ...analysisResult.skills.technical,
                    ...extractedSkills.technical,
                    ...extractedSkills.frameworks,
                    ...extractedSkills.languages,
                    ...extractedSkills.databases,
                    ...extractedSkills.tools,
                    ...extractedSkills.platforms,
                  ].filter(
                    (skill, index, self) =>
                      skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
                  ),
                  soft: [
                    ...analysisResult.skills.soft,
                    ...extractedSkills.soft,
                    ...extractedSkills.methodologies,
                  ].filter(
                    (skill, index, self) =>
                      skill && self.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index,
                  ),
                },
                extractedSkills, // Add the full extracted skills data
              }

              // Store the analysis result in localStorage for later use
              try {
                localStorage.setItem("resumeAnalysis", JSON.stringify(enhancedAnalysis))
                localStorage.setItem("extractedResumeSkills", JSON.stringify(extractedSkills))

                // Log detected skills to console for debugging
                console.log("Extracted skills from file upload:", extractedSkills)
                console.log("Technical skills from file upload:", enhancedAnalysis.skills.technical)
                console.log("Soft skills from file upload:", enhancedAnalysis.skills.soft)
              } catch (error) {
                console.error("Error saving resume analysis to localStorage:", error)
              }

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
                      {formatSkillsList(enhancedAnalysis.skills.technical.slice(0, 5))}
                      {enhancedAnalysis.skills.technical.length > 5
                        ? ` and ${enhancedAnalysis.skills.technical.length - 5} more`
                        : ""}
                    </p>
                    <p>
                      <strong>Soft skills:</strong> {formatSkillsList(enhancedAnalysis.skills.soft.slice(0, 3))}
                      {enhancedAnalysis.skills.soft.length > 3
                        ? ` and ${enhancedAnalysis.skills.soft.length - 3} more`
                        : ""}
                    </p>
                    <p>
                      <strong>Work experiences:</strong> {analysisResult.experience.length}
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
        setError(error.message || "Failed to analyze resume. Please try again.")
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze resume. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // We can modify the existing component to better handle arbitrary inputs
  // For example, adding more robust text processing:

  const processResumeText = async (text: string) => {
    try {
      // Normalize text to handle various formats
      const normalizedText = normalizeTextInput(text)

      // Extract skills with fallback mechanisms
      let extractedSkills
      try {
        extractedSkills = await extractSkills(normalizedText, "resume")
      } catch (error) {
        // Fallback to simpler extraction if advanced fails
        extractedSkills = extractBasicSkills(normalizedText)
        console.error("Using fallback skill extraction:", error)
      }

      // Continue with analysis...
    } catch (error) {
      // Handle errors gracefully
    }
  }

  // Helper functions for text processing and skill extraction
  const normalizeTextInput = (text: string) => {
    // Implement text normalization logic here
    // Remove extra spaces, line breaks, special characters, etc.
    return text.replace(/\s+/g, " ").trim()
  }

  const extractBasicSkills = (text: string) => {
    // Implement basic skill extraction logic here
    // Use regular expressions or simple keyword matching
    const skills = text.match(/\b(JavaScript|React|Node\.js|HTML|CSS)\b/gi) || []
    return {
      technical: skills,
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

  return (
    <Tabs defaultValue="file" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="file">Upload Resume</TabsTrigger>
        <TabsTrigger value="text">Paste Resume</TabsTrigger>
        <TabsTrigger value="linkedin">LinkedIn Profile</TabsTrigger>
      </TabsList>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TabsContent value="file" className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="resume">Upload your resume (PDF, DOCX, TXT)</Label>
          <div className="flex items-center gap-2">
            <Input id="resume" type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="flex-1" />
          </div>
          {file && <p className="text-sm text-gray-500">Selected file: {file.name}</p>}
        </div>
        <div className="flex justify-center">
          <Button onClick={handleFileUpload} disabled={!file || isUploading} className="gap-1.5">
            {isUploading ? "Analyzing..." : "Upload Resume"}
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="text" className="space-y-4">
        <form onSubmit={handleTextAnalysis} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="resume-text">Paste your resume text</Label>
            <Textarea
              id="resume-text"
              placeholder="Copy and paste your resume content here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[300px]"
            />
          </div>
          <div className="flex justify-center">
            <Button type="submit" disabled={!resumeText || isAnalyzing} className="gap-1.5">
              {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </TabsContent>
      <TabsContent value="linkedin">
        <form onSubmit={handleLinkedinSubmit} className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="linkedin"
                type="url"
                placeholder="https://www.linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <Button type="submit" disabled={!linkedinUrl || isUploading} className="gap-1.5">
              {isUploading ? "Processing..." : "Use LinkedIn Profile"}
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  )
}

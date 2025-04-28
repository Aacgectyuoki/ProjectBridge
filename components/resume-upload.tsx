"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Linkedin, FileText } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { analyzeResume } from "@/app/actions/analyze-resume"
import { useToast } from "@/hooks/use-toast"

export function ResumeUpload({ onUpload, onFileSelect }) {
  const [file, setFile] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

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

  const handleTextAnalysis = async (e) => {
    e.preventDefault()
    if (resumeText) {
      try {
        setIsAnalyzing(true)
        const analysisResult = await analyzeResume(resumeText)
        setIsAnalyzing(false)
        onUpload({
          type: "text",
          data: resumeText,
          analysis: analysisResult,
        })

        // Store the analysis result in localStorage for later use
        try {
          localStorage.setItem("resumeAnalysis", JSON.stringify(analysisResult))
        } catch (error) {
          console.error("Error saving resume analysis to localStorage:", error)
        }

        toast({
          title: "Resume analyzed successfully",
          description: `Found ${analysisResult.skills.technical.length} technical skills and ${analysisResult.experience.length} work experiences.`,
        })
      } catch (error) {
        setIsAnalyzing(false)
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze resume",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (file) {
      setIsUploading(true)

      try {
        // For text files, we can analyze directly
        if (file.type === "text/plain") {
          const text = await file.text()
          const analysisResult = await analyzeResume(text)

          // Store the analysis result in localStorage for later use
          try {
            localStorage.setItem("resumeAnalysis", JSON.stringify(analysisResult))
          } catch (error) {
            console.error("Error saving resume analysis to localStorage:", error)
          }

          setIsUploading(false)
          onUpload({
            type: "file",
            data: {
              name: file.name,
              type: file.type,
              size: file.size,
            },
            analysis: analysisResult,
          })

          toast({
            title: "Resume analyzed successfully",
            description: `Found ${analysisResult.skills.technical.length} technical skills and ${analysisResult.experience.length} work experiences.`,
          })
        } else {
          // For non-text files (PDF, DOCX), in a real app you would:
          // 1. Upload the file to a server
          // 2. Parse the file on the server
          // 3. Return the parsed content

          // For now, we'll simulate this with a mock analysis after a delay
          setTimeout(async () => {
            // Create a mock resume text for demonstration
            const mockResumeText = `
              John Doe
              Software Developer
              
              SKILLS
              JavaScript, React, Node.js, HTML, CSS
              
              EXPERIENCE
              Senior Developer at Tech Co (2020-Present)
              - Developed web applications using React and Node.js
              - Led a team of 5 developers
              
              Junior Developer at Startup Inc (2018-2020)
              - Built responsive websites
              - Worked with REST APIs
              
              EDUCATION
              Bachelor of Computer Science, University of Technology (2018)
            `

            const analysisResult = await analyzeResume(mockResumeText)

            // Store the analysis result in localStorage for later use
            try {
              localStorage.setItem("resumeAnalysis", JSON.stringify(analysisResult))
            } catch (error) {
              console.error("Error saving resume analysis to localStorage:", error)
            }

            setIsUploading(false)
            onUpload({
              type: "file",
              data: {
                name: file.name,
                type: file.type,
                size: file.size,
              },
              analysis: analysisResult,
            })

            toast({
              title: "Resume analyzed successfully",
              description: `Found ${analysisResult.skills.technical.length} technical skills and ${analysisResult.experience.length} work experiences.`,
            })
          }, 2000)
        }
      } catch (error) {
        setIsUploading(false)
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze resume",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Tabs defaultValue="file" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="file">Upload Resume</TabsTrigger>
        <TabsTrigger value="text">Paste Resume</TabsTrigger>
        <TabsTrigger value="linkedin">LinkedIn Profile</TabsTrigger>
      </TabsList>
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

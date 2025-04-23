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

export function ResumeUpload({ onUpload }) {
  const [file, setFile] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)

      // Read file content if it's a text file
      if (selectedFile.type === "text/plain") {
        const text = await selectedFile.text()
        setResumeText(text)
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

  const simulateUpload = (file) => {
    setIsUploading(true)
    setTimeout(() => {
      setIsUploading(false)
      onUpload({ type: "file", data: file })
    }, 1500)
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
          <Button
            onClick={() => file && onUpload({ type: "file", data: file })}
            disabled={!file || isUploading}
            className="gap-1.5"
          >
            {isUploading ? "Uploading..." : "Upload Resume"}
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

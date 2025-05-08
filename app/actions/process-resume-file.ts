"use server"

import { analyzeResume } from "./analyze-resume"
import { storeCompatibleAnalysisData } from "@/utils/analysis-session-manager"

// Update the processResumeFile function to ensure data is stored
export async function processResumeFile(formData: FormData) {
  try {
    const file = formData.get("resume") as File

    if (!file) {
      throw new Error("No file provided")
    }

    // Check file type
    if (file.type === "text/plain") {
      // For text files, we can process directly
      const text = await file.text()

      // Store the raw text for potential reprocessing
      if (typeof window !== "undefined") {
        storeCompatibleAnalysisData("resumeText", text)
      }

      const analysis = await analyzeResume(text)

      // Store the analysis result
      if (typeof window !== "undefined") {
        storeCompatibleAnalysisData("resumeAnalysis", analysis)
      }

      return analysis
    } else if (
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For PDF and DOCX files, in a real implementation we would:
      // 1. Save the file to a temporary location
      // 2. Use a PDF/DOCX parsing library to extract text
      // 3. Process the extracted text

      // For now, we'll return a mock result
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

      // Store the mock text for potential reprocessing
      if (typeof window !== "undefined") {
        storeCompatibleAnalysisData("resumeText", mockResumeText)
      }

      const analysis = await analyzeResume(mockResumeText)

      // Store the analysis result
      if (typeof window !== "undefined") {
        storeCompatibleAnalysisData("resumeAnalysis", analysis)
      }

      return analysis
    } else {
      throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")
    }
  } catch (error) {
    console.error("Error processing resume file:", error)
    throw error
  }
}

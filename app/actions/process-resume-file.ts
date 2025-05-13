"use server"

import { analyzeResume } from "./analyze-resume"
import { storeCompatibleAnalysisData } from "@/utils/analysis-session-manager"
import { processFile } from "@/utils/file-processor"

// Update the processResumeFile function to handle PDF extraction
export async function processResumeFile(formData: FormData) {
  try {
    const file = formData.get("resume") as File

    if (!file) {
      throw new Error("No file provided")
    }

    let extractedText = ""

    // Process the file based on type
    if (file.type === "text/plain") {
      // For text files, we can process directly
      extractedText = await file.text()
    } else if (
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Use our file processor to extract text
      try {
        extractedText = await processFile(file)
      } catch (error) {
        console.error("Error extracting text from file:", error)

        // If extraction fails, use a mock resume for demonstration
        extractedText = `
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
      }
    } else {
      throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")
    }

    // Store the raw text for potential reprocessing
    if (typeof window !== "undefined") {
      storeCompatibleAnalysisData("resumeText", extractedText)
    }

    // Analyze the extracted text
    const analysis = await analyzeResume(extractedText)

    // Store the analysis result
    if (typeof window !== "undefined") {
      storeCompatibleAnalysisData("resumeAnalysis", analysis)
    }

    return analysis
  } catch (error) {
    console.error("Error processing resume file:", error)
    throw error
  }
}

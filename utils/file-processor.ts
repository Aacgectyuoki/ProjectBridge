/**
 * Utility for processing resume files (PDF, DOCX, TXT)
 */
import { cleanExtractedText } from "./text-preprocessor"

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Supported file types
const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

/**
 * Validates a resume file
 * @param file The file to validate
 * @returns An object with validation result and message
 */
export function validateResumeFile(file: File): { valid: boolean; message?: string } {
  // Check if file exists
  if (!file) {
    return { valid: false, message: "No file selected" }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  // Check file type
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Unsupported file type. Please upload a PDF, DOCX, or TXT file`,
    }
  }

  return { valid: true }
}

/**
 * STEP 1: Extract raw text from a file
 * This function ONLY extracts text without any skill analysis
 * @param file The file to extract text from
 * @param onProgress Optional callback for progress updates
 * @returns The extracted raw text
 */
export async function extractTextFromFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // Report initial progress
    if (onProgress) onProgress(10)

    let extractedText = ""

    // For text files, just read the text
    if (file.type === "text/plain") {
      extractedText = await file.text()
      if (onProgress) onProgress(100)
    }
    // For PDF files
    else if (file.type === "application/pdf") {
      if (onProgress) onProgress(30)

      try {
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer()
        if (onProgress) onProgress(50)

        // Extract text from PDF using a simplified approach
        extractedText = await extractTextFromPDFSimplified(arrayBuffer)
        if (onProgress) onProgress(90)
      } catch (pdfError) {
        console.error("PDF extraction error:", pdfError)
        // Fallback to file reader for basic text extraction
        extractedText = await readFileAsText(file)
      }
    }
    // For DOCX files
    else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      if (onProgress) onProgress(30)

      try {
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer()
        if (onProgress) onProgress(50)

        // Extract text from DOCX using a simplified approach
        extractedText = await extractTextFromDOCXSimplified(arrayBuffer)
        if (onProgress) onProgress(90)
      } catch (docxError) {
        console.error("DOCX extraction error:", docxError)
        // Fallback to file reader for basic text extraction
        extractedText = await readFileAsText(file)
      }
    }

    // Clean the extracted text
    const cleanedText = cleanExtractedText(extractedText)
    if (onProgress) onProgress(100)

    return cleanedText
  } catch (error) {
    console.error("Error extracting text from file:", error)
    throw new Error(`Failed to extract text from ${file.name}: ${error.message}`)
  }
}

/**
 * Extract text from a PDF file using a simplified approach
 * This is a more compatible implementation that doesn't rely on pdf.js workers
 */
async function extractTextFromPDFSimplified(buffer: ArrayBuffer): Promise<string> {
  // In a real implementation, we would use pdf.js
  // For now, we'll use a more compatible approach that works in the v0 environment

  // Convert ArrayBuffer to a string representation (not actual text extraction)
  // This is just to demonstrate the flow - in a real app, use proper PDF extraction
  const bytes = new Uint8Array(buffer)
  let text = ""

  // Look for text markers in the PDF
  // This is a very simplified approach and won't work well for most PDFs
  // It's just to show the concept without requiring pdf.js
  for (let i = 0; i < bytes.length; i++) {
    // Only include ASCII printable characters
    if (bytes[i] >= 32 && bytes[i] <= 126) {
      text += String.fromCharCode(bytes[i])
    }
  }

  // Extract what looks like text content
  // This is extremely simplified and won't work well
  const textBlocks = text.match(/[A-Za-z0-9\s.,;:'"!?()-]{10,}/g) || []

  return (
    textBlocks.join("\n\n") +
    "\n\nNote: PDF extraction is limited in this environment. For best results, please paste your resume text directly."
  )
}

/**
 * Extract text from a DOCX file using a simplified approach
 */
async function extractTextFromDOCXSimplified(buffer: ArrayBuffer): Promise<string> {
  try {
    // Try to dynamically import mammoth if available
    const mammoth = await import("mammoth").catch(() => null)

    if (mammoth) {
      // Use mammoth to extract text from the DOCX file
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      return result.value
    } else {
      // Fallback if mammoth is not available
      return "DOCX extraction is limited in this environment. For best results, please paste your resume text directly."
    }
  } catch (error) {
    console.error("Error extracting text from DOCX:", error)
    return "DOCX extraction failed. For best results, please paste your resume text directly."
  }
}

/**
 * Fallback method to read file as text
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("FileReader failed"))
    reader.readAsText(file)
  })
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use validateResumeFile instead
 */
export function isValidResumeFile(file: File): boolean {
  return validateResumeFile(file).valid
}

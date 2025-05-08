import { cleanExtractedText } from "./text-preprocessor"
import type { ProgressCallback } from "@/types/file-processing"
import { extractTextFromPDFBinary, extractTextFromDOCXBinary } from "./document-extraction-fallback"

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Supported file types
const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
]

/**
 * Validates a file
 */
export function validateFile(file: File): { valid: boolean; message?: string } {
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
 * Process a file and extract its text content
 */
export async function processFile(file: File, onProgress?: ProgressCallback): Promise<string> {
  try {
    if (!file) {
      throw new Error("No file provided")
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.message || "Invalid file")
    }

    // Report starting
    if (onProgress) onProgress({ stage: "starting", progress: 0 })

    let extractedText = ""

    // Process based on file type
    if (file.type === "application/pdf") {
      if (onProgress) onProgress({ stage: "loading pdf.js", progress: 10 })

      try {
        // Try to use PDF.js if available
        const pdfjs = await import("pdfjs-dist").catch(() => null)

        if (pdfjs) {
          // Set the worker source
          const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.entry").catch(() => null)
          if (pdfjsWorker) {
            pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
          }

          if (onProgress) onProgress({ stage: "reading pdf", progress: 30 })

          // Load the PDF file
          const arrayBuffer = await readFileAsArrayBuffer(file)
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

          if (onProgress) onProgress({ stage: "extracting text", progress: 50 })

          // Extract text from each page
          let textContent = ""
          for (let i = 1; i <= pdf.numPages; i++) {
            if (onProgress)
              onProgress({
                stage: `extracting page ${i}/${pdf.numPages}`,
                progress: 50 + (i / pdf.numPages) * 40,
              })

            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            const strings = content.items.map((item) => ("str" in item ? item.str : ""))
            textContent += strings.join(" ") + "\n\n"
          }

          extractedText = textContent
        } else {
          // Fallback to basic extraction
          if (onProgress) onProgress({ stage: "using fallback extraction", progress: 30 })
          const arrayBuffer = await readFileAsArrayBuffer(file)
          extractedText = extractTextFromPDFBinary(arrayBuffer)
        }
      } catch (error) {
        console.error("PDF extraction error:", error)
        // Fallback to basic extraction
        if (onProgress) onProgress({ stage: "using fallback extraction", progress: 30 })
        try {
          const arrayBuffer = await readFileAsArrayBuffer(file)
          extractedText = extractTextFromPDFBinary(arrayBuffer)
        } catch (fallbackError) {
          extractedText = `PDF extraction failed. Please paste the text content directly.`
        }
      }

      if (onProgress) onProgress({ stage: "processing", progress: 90 })
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      if (onProgress) onProgress({ stage: "loading mammoth.js", progress: 10 })

      try {
        // Try to use mammoth.js if available
        const mammoth = await import("mammoth").catch(() => null)

        if (mammoth) {
          if (onProgress) onProgress({ stage: "reading docx", progress: 30 })

          // Load the DOCX file
          const arrayBuffer = await readFileAsArrayBuffer(file)

          if (onProgress) onProgress({ stage: "extracting text", progress: 50 })

          // Extract text from the DOCX
          const result = await mammoth.extractRawText({ arrayBuffer })
          extractedText = result.value
        } else {
          // Fallback to basic extraction
          if (onProgress) onProgress({ stage: "using fallback extraction", progress: 30 })
          const arrayBuffer = await readFileAsArrayBuffer(file)
          extractedText = extractTextFromDOCXBinary(arrayBuffer)
        }
      } catch (error) {
        console.error("DOCX extraction error:", error)
        // Fallback to basic extraction
        if (onProgress) onProgress({ stage: "using fallback extraction", progress: 30 })
        try {
          const arrayBuffer = await readFileAsArrayBuffer(file)
          extractedText = extractTextFromDOCXBinary(arrayBuffer)
        } catch (fallbackError) {
          extractedText = `DOCX extraction failed. Please paste the text content directly.`
        }
      }

      if (onProgress) onProgress({ stage: "processing", progress: 90 })
    } else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
      if (onProgress) onProgress({ stage: "reading", progress: 30 })

      // For images, we'll return a message about limitations
      extractedText = `Image processing is limited in this environment. The file "${file.name}" was uploaded successfully, but text extraction from images requires additional libraries. Please paste the text content directly.`

      if (onProgress) onProgress({ stage: "processing", progress: 70 })
    } else if (file.type === "text/plain") {
      if (onProgress) onProgress({ stage: "reading", progress: 30 })

      // For text files, read as text
      extractedText = await readFileAsText(file)

      if (onProgress) onProgress({ stage: "processing", progress: 70 })
    } else {
      // Try to read as text for unknown types
      if (onProgress) onProgress({ stage: "reading", progress: 30 })

      try {
        extractedText = await readFileAsText(file)
      } catch (error) {
        extractedText = `Unsupported file type: ${file.type}. Please upload a PDF, DOCX, or text file, or paste the content directly.`
      }

      if (onProgress) onProgress({ stage: "processing", progress: 70 })
    }

    // Clean the extracted text
    extractedText = cleanExtractedText(extractedText)

    // Report completion
    if (onProgress) onProgress({ stage: "complete", progress: 100 })

    return extractedText
  } catch (error) {
    console.error("Error processing file:", error)

    if (onProgress) {
      onProgress({
        stage: "error",
        progress: 0,
        error: error as Error,
      })
    }

    throw error
  }
}

/**
 * Read file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file as text"))
    reader.readAsText(file)
  })
}

/**
 * Read file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error("Failed to read file as ArrayBuffer"))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Legacy function for backward compatibility
 */
export function isValidFile(file: File): boolean {
  return validateFile(file).valid
}

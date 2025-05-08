import { cleanExtractedText } from "./text-preprocessor"
import type { ProgressCallback } from "@/types/file-processing"
import { extractTextFromPDF, extractPDFMetadata, isPDFScanned, isPDFEncrypted } from "./pdf-text-extractor"

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
      if (onProgress) onProgress({ stage: "analyzing pdf", progress: 10 })

      try {
        // Check if PDF is encrypted
        const isEncrypted = await isPDFEncrypted(file)
        if (isEncrypted) {
          if (onProgress) onProgress({ stage: "detected encrypted pdf", progress: 20 })
          extractedText = `This PDF appears to be secured or encrypted. Security settings may prevent text extraction. Please try:
1. Opening the PDF in a desktop viewer and enabling text copying
2. Providing an unlocked version of the document
3. Copying the text directly from your PDF viewer and pasting it here`

          if (onProgress) onProgress({ stage: "processing", progress: 90 })
          return extractedText
        }

        // Check if PDF is likely scanned
        const isScanned = await isPDFScanned(file)
        if (isScanned) {
          if (onProgress) onProgress({ stage: "detected scanned pdf", progress: 20 })

          // For scanned PDFs, we'll attempt OCR
          if (onProgress) onProgress({ stage: "preparing ocr", progress: 30 })

          // Use our enhanced PDF extractor with OCR enabled
          if (onProgress) onProgress({ stage: "performing ocr", progress: 40 })
          extractedText = await extractTextFromPDF(file, {
            attemptMultipleStrategies: true,
            extractMetadata: true,
            attemptOCR: true,
          })

          if (onProgress) onProgress({ stage: "processing ocr results", progress: 80 })
        } else {
          // Try to extract metadata
          if (onProgress) onProgress({ stage: "extracting metadata", progress: 30 })
          const metadata = await extractPDFMetadata(file)

          // Use our enhanced PDF extractor
          if (onProgress) onProgress({ stage: "extracting text", progress: 40 })
          extractedText = await extractTextFromPDF(file, {
            attemptMultipleStrategies: true,
            extractMetadata: true,
            attemptOCR: false,
          })

          // If we have metadata but extraction failed, add metadata to the message
          if (extractedText.includes("couldn't retrieve readable text") && Object.keys(metadata).length > 0) {
            extractedText +=
              "\n\nDocument Metadata:\n" +
              Object.entries(metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join("\n")
          }
        }

        if (onProgress) onProgress({ stage: "processing", progress: 70 })
      } catch (error) {
        console.error("PDF extraction error:", error)
        extractedText = `PDF extraction encountered an error: ${error.message}. Please paste the text content directly.`
      }

      if (onProgress) onProgress({ stage: "processing", progress: 90 })
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      if (onProgress) onProgress({ stage: "loading mammoth.js", progress: 10 })

      try {
        // Import mammoth.js dynamically
        const mammoth = await import("mammoth")

        if (onProgress) onProgress({ stage: "reading docx", progress: 30 })

        // Load the DOCX file
        const arrayBuffer = await readFileAsArrayBuffer(file)

        if (onProgress) onProgress({ stage: "extracting text", progress: 50 })

        // Extract text from the DOCX
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
      } catch (error) {
        console.error("DOCX extraction error:", error)
        extractedText = `DOCX extraction encountered an error: ${error.message}. Please paste the text content directly.`
      }

      if (onProgress) onProgress({ stage: "processing", progress: 90 })
    } else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
      if (onProgress) onProgress({ stage: "reading", progress: 30 })

      try {
        // For images, we'll attempt OCR
        if (onProgress) onProgress({ stage: "preparing ocr", progress: 40 })

        // Extract text using OCR
        const { extractTextFromImage } = await import("./tesseract-ocr")

        if (onProgress) onProgress({ stage: "performing ocr", progress: 50 })

        // Convert file to blob
        const blob = file.slice(0, file.size, file.type)

        // Perform OCR
        extractedText = await extractTextFromImage(blob, {
          language: "eng",
          logger: (progress) => {
            if (onProgress) {
              onProgress({
                stage: progress.status,
                progress: 50 + progress.progress / 2, // Scale from 50-100%
              })
            }
          },
        })

        if (extractedText.length < 100) {
          extractedText = `Image OCR produced limited results. The file "${file.name}" was processed, but text extraction from images may be incomplete. Please paste the text content directly if needed.`
        }
      } catch (error) {
        console.error("Image OCR error:", error)
        extractedText = `Image processing is limited in this environment. The file "${file.name}" was uploaded successfully, but text extraction from images requires additional libraries. Please paste the text content directly.`
      }

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

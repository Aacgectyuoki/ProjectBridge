import { cleanExtractedText } from "./text-preprocessor"
import type { ProgressCallback } from "@/types/file-processing"
import { extractTextFromPDF, extractPDFMetadata, isPDFScanned, isPDFEncrypted } from "./pdf-text-extractor"
import { handleError, ErrorCategory, ErrorSeverity } from "./error-handler"

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

/**
 * Check if the File API is supported
 */
function isFileAPISupported(): boolean {
  return isBrowser() && "File" in window && "FileReader" in window
}

/**
 * Log detailed environment information for debugging
 */
function logEnvironmentInfo(): void {
  if (!isBrowser()) {
    console.log("Not running in browser environment")
    return
  }

  console.log("Browser environment detected")
  console.log("File API supported:", isFileAPISupported())
  console.log("User Agent:", navigator.userAgent)
  console.log("PDF.js supported:", typeof window["pdfjs"] !== "undefined")
}

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
 * Error types specific to file processing
 */
export enum FileProcessingErrorType {
  FILE_TOO_LARGE = "file_too_large",
  UNSUPPORTED_TYPE = "unsupported_type",
  ENCRYPTED_PDF = "encrypted_pdf",
  EXTRACTION_FAILED = "extraction_failed",
  INVALID_FILE = "invalid_file",
  SCANNED_DOCUMENT = "scanned_document",
  OCR_FAILED = "ocr_failed",
  ENVIRONMENT_ERROR = "environment_error",
  BROWSER_COMPATIBILITY = "browser_compatibility",
}

/**
 * Custom error class for file processing errors
 */
export class FileProcessingError extends Error {
  type: FileProcessingErrorType
  details?: any

  constructor(message: string, type: FileProcessingErrorType, details?: any) {
    super(message)
    this.name = "FileProcessingError"
    this.type = type
    this.details = details
  }
}

/**
 * Validates a file
 */
export function validateFile(file: File): { valid: boolean; message?: string; errorType?: FileProcessingErrorType } {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      message: "No file selected",
      errorType: FileProcessingErrorType.INVALID_FILE,
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      errorType: FileProcessingErrorType.FILE_TOO_LARGE,
    }
  }

  // Check file type
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Unsupported file type. Please upload a PDF, DOCX, or TXT file`,
      errorType: FileProcessingErrorType.UNSUPPORTED_TYPE,
    }
  }

  return { valid: true }
}

/**
 * Process a file and extract its text content
 */
export async function processFile(file: File, onProgress?: ProgressCallback): Promise<string> {
  // Log environment information
  logEnvironmentInfo()

  // Check if we're in a browser environment
  if (!isBrowser()) {
    throw new FileProcessingError(
      "File processing is only available in browser environments",
      FileProcessingErrorType.ENVIRONMENT_ERROR,
    )
  }

  // Check if File API is supported
  if (!isFileAPISupported()) {
    throw new FileProcessingError(
      "Your browser does not support the File API required for file processing",
      FileProcessingErrorType.BROWSER_COMPATIBILITY,
    )
  }

  try {
    if (!file) {
      const error = new FileProcessingError("No file provided", FileProcessingErrorType.INVALID_FILE)

      handleError(error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.WARNING)

      throw error
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      const error = new FileProcessingError(
        validation.message || "Invalid file",
        validation.errorType || FileProcessingErrorType.INVALID_FILE,
      )

      handleError(error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.WARNING)

      throw error
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

          const error = new FileProcessingError(
            "This PDF appears to be secured or encrypted. Security settings may prevent text extraction.",
            FileProcessingErrorType.ENCRYPTED_PDF,
          )

          handleError(
            error,
            ErrorCategory.FILE_PROCESSING,
            ErrorSeverity.WARNING,
            { notifyUser: false }, // Don't notify user since we'll show a specific message
          )

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

          try {
            // Use our enhanced PDF extractor with OCR enabled
            if (onProgress) onProgress({ stage: "performing ocr", progress: 40 })
            extractedText = await extractTextFromPDF(file, {
              attemptMultipleStrategies: true,
              extractMetadata: true,
              attemptOCR: true,
            })

            if (onProgress) onProgress({ stage: "processing ocr results", progress: 80 })
          } catch (ocrError) {
            handleError(ocrError as Error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.WARNING, { notifyUser: false })

            extractedText = `OCR processing failed for this scanned document. Please try:
1. Using a clearer scan of the document
2. Copying the text directly from your PDF viewer (if it has built-in OCR)
3. Providing a text-based PDF or Word document instead`
          }
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
        handleError(error as Error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.ERROR, { notifyUser: false })

        extractedText = `PDF extraction encountered an error: ${(error as Error).message}. Please paste the text content directly.`
      }

      if (onProgress) onProgress({ stage: "processing", progress: 90 })
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      if (onProgress) onProgress({ stage: "loading mammoth.js", progress: 10 })

      try {
        // Import mammoth.js dynamically
        const mammoth = await import("mammoth").catch((error) => {
          handleError(error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.ERROR, { notifyUser: false })
          return null
        })

        if (!mammoth) {
          throw new FileProcessingError(
            "Failed to load document processing library",
            FileProcessingErrorType.EXTRACTION_FAILED,
          )
        }

        if (onProgress) onProgress({ stage: "reading docx", progress: 30 })

        // Load the DOCX file
        const arrayBuffer = await readFileAsArrayBuffer(file)

        if (onProgress) onProgress({ stage: "extracting text", progress: 50 })

        // Extract text from the DOCX
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
      } catch (error) {
        handleError(error as Error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.ERROR, { notifyUser: false })

        extractedText = `DOCX extraction encountered an error: ${(error as Error).message}. Please paste the text content directly.`
      }

      if (onProgress) onProgress({ stage: "processing", progress: 90 })
    } else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
      if (onProgress) onProgress({ stage: "reading", progress: 30 })

      try {
        // For images, we'll attempt OCR
        if (onProgress) onProgress({ stage: "preparing ocr", progress: 40 })

        // Extract text using OCR
        const { extractTextFromImage } = await import("./tesseract-ocr").catch((error) => {
          handleError(error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.ERROR, { notifyUser: false })
          return { extractTextFromImage: null }
        })

        if (!extractTextFromImage) {
          throw new FileProcessingError("Failed to load OCR library", FileProcessingErrorType.OCR_FAILED)
        }

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
        handleError(error as Error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.ERROR, { notifyUser: false })

        extractedText = `Image processing is limited in this environment. The file "${file.name}" was uploaded successfully, but text extraction from images requires additional libraries. Please paste the text content directly.`
      }

      if (onProgress) onProgress({ stage: "processing", progress: 70 })
    } else if (file.type === "text/plain") {
      if (onProgress) onProgress({ stage: "reading", progress: 30 })

      try {
        // For text files, read as text
        extractedText = await readFileAsText(file)
      } catch (error) {
        handleError(error as Error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.ERROR, { notifyUser: false })

        extractedText = `Failed to read text file: ${(error as Error).message}. Please paste the content directly.`
      }

      if (onProgress) onProgress({ stage: "processing", progress: 70 })
    } else {
      // Try to read as text for unknown types
      if (onProgress) onProgress({ stage: "reading", progress: 30 })

      try {
        extractedText = await readFileAsText(file)
      } catch (error) {
        handleError(error as Error, ErrorCategory.FILE_PROCESSING, ErrorSeverity.ERROR, { notifyUser: false })

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

    // If it's already a FileProcessingError, rethrow it
    if (error instanceof FileProcessingError) {
      throw error
    }

    // Otherwise, wrap it in a FileProcessingError
    throw new FileProcessingError(
      (error as Error).message || "Unknown file processing error",
      FileProcessingErrorType.EXTRACTION_FAILED,
      error,
    )
  }
}

/**
 * Read file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (event) => {
      const error = new FileProcessingError("Failed to read file as text", FileProcessingErrorType.EXTRACTION_FAILED, {
        event,
        file,
      })
      reject(error)
    }
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
    reader.onerror = (event) => {
      const error = new FileProcessingError(
        "Failed to read file as ArrayBuffer",
        FileProcessingErrorType.EXTRACTION_FAILED,
        { event, file },
      )
      reject(error)
    }
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Legacy function for backward compatibility
 */
export function isValidFile(file: File): boolean {
  return validateFile(file).valid
}

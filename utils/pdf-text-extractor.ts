/**
 * Advanced PDF text extraction utility with OCR fallback
 */

import { processPDFWithOCR } from "./tesseract-ocr"

// PDF extraction options
interface PDFExtractionOptions {
  attemptMultipleStrategies?: boolean
  extractMetadata?: boolean
  attemptOCR?: boolean
  maxContentLength?: number
}

// PDF extraction result
interface PDFExtractionResult {
  text: string
  metadata?: Record<string, string>
  isEncrypted?: boolean
  isScanned?: boolean
  pageCount?: number
  ocrApplied?: boolean
  extractionMethod?: string
}

/**
 * Extract text from a PDF file with advanced techniques
 */
export async function extractTextFromPDF(file: File, options: PDFExtractionOptions = {}): Promise<string> {
  try {
    // Set default options
    const opts = {
      attemptMultipleStrategies: true,
      extractMetadata: true,
      attemptOCR: true,
      maxContentLength: 1000000,
      ...options,
    }

    // Read the file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file)

    // Extract result with detailed information
    const result = await extractPDFWithDetails(arrayBuffer, file.name, opts)

    // If we have text, return it
    if (result.text && result.text.length > 100 && !containsBinaryData(result.text)) {
      return result.text
    }

    // Handle special cases
    if (result.isEncrypted) {
      return `This PDF appears to be secured or encrypted. Security settings may prevent text extraction. Please try:
1. Opening the PDF in a desktop viewer and enabling text copying
2. Providing an unlocked version of the document
3. Copying the text directly from your PDF viewer and pasting it here`
    }

    if (result.isScanned && !result.ocrApplied) {
      return `This PDF appears to contain scanned images rather than digital text. For best results, please try:
1. Using OCR software to convert the scanned document to text
2. Copying the text directly from your PDF viewer (if it has built-in OCR)
3. Providing a text-based PDF or Word document instead`
    }

    // General fallback message
    return `The PDF extraction couldn't retrieve readable text from "${file.name}". This may be due to the PDF containing scanned images or having security restrictions. Please paste the text content directly.`
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return `PDF extraction encountered an error: ${error.message}. Please paste the text content directly.`
  }
}

/**
 * Extract PDF with detailed information
 */
async function extractPDFWithDetails(
  buffer: ArrayBuffer,
  fileName: string,
  options: PDFExtractionOptions,
): Promise<PDFExtractionResult> {
  // Initialize result
  const result: PDFExtractionResult = {
    text: "",
    metadata: {},
    isEncrypted: false,
    isScanned: false,
    pageCount: 0,
    ocrApplied: false,
    extractionMethod: "unknown",
  }

  // Check for encryption and get metadata
  const pdfInfo = await analyzePDFStructure(buffer)
  result.isEncrypted = pdfInfo.isEncrypted
  result.metadata = pdfInfo.metadata
  result.pageCount = pdfInfo.pageCount || 0

  // If encrypted and we have no override, return early
  if (result.isEncrypted && !options.attemptMultipleStrategies) {
    return result
  }

  // Strategy 1: Extract text using PDF.js-like approach
  try {
    const text = await extractTextUsingPDFJSApproach(buffer)
    if (text && text.length > 100 && !containsBinaryData(text)) {
      result.text = text
      result.extractionMethod = "pdfjs-like"
      return result
    }
  } catch (error) {
    console.log("PDF.js-like extraction failed:", error)
  }

  // Strategy 2: Extract text using pattern matching
  if (options.attemptMultipleStrategies) {
    try {
      const text = await extractTextUsingPatternMatching(buffer)
      if (text && text.length > 100 && !containsBinaryData(text)) {
        result.text = text
        result.extractionMethod = "pattern-matching"
        return result
      }
    } catch (error) {
      console.log("Pattern matching extraction failed:", error)
    }
  }

  // Strategy 3: Extract text using binary analysis
  if (options.attemptMultipleStrategies) {
    try {
      const text = await extractTextUsingBinaryAnalysis(buffer)
      if (text && text.length > 100 && !containsBinaryData(text)) {
        result.text = text
        result.extractionMethod = "binary-analysis"
        return result
      }
    } catch (error) {
      console.log("Binary analysis extraction failed:", error)
    }
  }

  // If we got here with no text, it might be a scanned document
  result.isScanned = true

  // Strategy 4: Attempt OCR if enabled and we have no text
  if (options.attemptOCR && result.isScanned) {
    try {
      console.log("Attempting OCR on scanned PDF")
      const text = await processPDFWithOCR(buffer, {
        language: "eng",
        logger: (progress) => {
          console.log(`OCR progress: ${progress.status} - ${progress.progress}%`)
        },
      })

      if (text && text.length > 100 && !containsBinaryData(text)) {
        result.text = text
        result.ocrApplied = true
        result.extractionMethod = "ocr"
        return result
      }
    } catch (error) {
      console.log("OCR extraction failed:", error)
    }
  }

  return result
}

/**
 * Analyze PDF structure to detect encryption and extract metadata
 */
async function analyzePDFStructure(buffer: ArrayBuffer): Promise<{
  isEncrypted: boolean
  metadata: Record<string, string>
  pageCount?: number
}> {
  const bytes = new Uint8Array(buffer)
  let pdfString = ""

  // Convert to string (only ASCII printable chars)
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 32 && bytes[i] <= 126) {
      pdfString += String.fromCharCode(bytes[i])
    } else {
      pdfString += " "
    }
  }

  // Check for encryption
  const isEncrypted =
    pdfString.includes("/Encrypt") ||
    pdfString.includes("/Standard") ||
    pdfString.includes("/Crypt") ||
    pdfString.includes("/SecuritySettings")

  // Extract metadata
  const metadata: Record<string, string> = {}

  // Common metadata fields
  const fields = [
    { name: "Title", pattern: /\/Title\s*$$([^)]+)$$/ },
    { name: "Author", pattern: /\/Author\s*$$([^)]+)$$/ },
    { name: "Subject", pattern: /\/Subject\s*$$([^)]+)$$/ },
    { name: "Keywords", pattern: /\/Keywords\s*$$([^)]+)$$/ },
    { name: "Creator", pattern: /\/Creator\s*$$([^)]+)$$/ },
    { name: "Producer", pattern: /\/Producer\s*$$([^)]+)$$/ },
    { name: "CreationDate", pattern: /\/CreationDate\s*$$([^)]+)$$/ },
    { name: "ModDate", pattern: /\/ModDate\s*$$([^)]+)$$/ },
  ]

  for (const field of fields) {
    const match = pdfString.match(field.pattern)
    if (match && match[1]) {
      metadata[field.name] = match[1].trim()
    }
  }

  // Try to determine page count
  const pageCountMatch = pdfString.match(/\/Count\s+(\d+)/)
  const pageCount = pageCountMatch ? Number.parseInt(pageCountMatch[1], 10) : undefined

  return { isEncrypted, metadata, pageCount }
}

/**
 * Extract text using an approach similar to PDF.js
 */
async function extractTextUsingPDFJSApproach(buffer: ArrayBuffer): Promise<string> {
  // This is a simplified version of what PDF.js would do
  // In a real implementation, this would parse the PDF structure

  const bytes = new Uint8Array(buffer)
  let pdfString = ""

  // Convert to string
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 32 && bytes[i] <= 126) {
      pdfString += String.fromCharCode(bytes[i])
    } else {
      pdfString += " "
    }
  }

  // Look for text objects in the PDF
  let extractedText = ""

  // Find text objects (typically between BT and ET markers)
  const textObjects = pdfString.match(/BT[\s\S]+?ET/g) || []
  for (const textObj of textObjects) {
    // Extract text strings (typically in parentheses)
    const textStrings = textObj.match(/$$([^)]+)$$/g) || []
    for (const textString of textStrings) {
      const cleaned = textString.replace(/^$$|$$$/g, "")
      if (cleaned && cleaned.length > 1) {
        extractedText += cleaned + " "
      }
    }
    extractedText += "\n"
  }

  return extractedText
}

/**
 * Extract text using pattern matching
 */
async function extractTextUsingPatternMatching(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer)
  let pdfString = ""

  // Convert to string
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 32 && bytes[i] <= 126) {
      pdfString += String.fromCharCode(bytes[i])
    } else {
      pdfString += " "
    }
  }

  let extractedText = ""

  // Pattern 1: Look for text in parentheses
  const parenthesesMatches = pdfString.match(/$$([^)]+)$$/g) || []
  for (const match of parenthesesMatches) {
    const cleaned = match.replace(/^$$|$$$/g, "").trim()
    if (cleaned.length > 3 && /[a-zA-Z]{3,}/.test(cleaned)) {
      extractedText += cleaned + " "
    }
  }

  // Pattern 2: Look for text in angle brackets
  const angleBracketMatches = pdfString.match(/<([^>]+)>/g) || []
  for (const match of angleBracketMatches) {
    const cleaned = match.replace(/^<|>$/g, "").trim()
    if (cleaned.length > 3 && /[a-zA-Z]{3,}/.test(cleaned)) {
      extractedText += cleaned + " "
    }
  }

  // Pattern 3: Look for potential text blocks
  const textBlocks = pdfString.match(/[A-Za-z\s.,;:'"!?()-]{10,}/g) || []
  for (const block of textBlocks) {
    if (block.length > 20 && !extractedText.includes(block)) {
      extractedText += block + "\n\n"
    }
  }

  return extractedText
}

/**
 * Extract text using binary analysis
 */
async function extractTextUsingBinaryAnalysis(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer)

  // Look for sequences of ASCII text
  let currentText = ""
  let extractedText = ""
  let textMode = false

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]

    // Check if this is a printable ASCII character
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      const char = String.fromCharCode(byte)

      // If we're not in text mode and this is a letter, start text mode
      if (!textMode && /[a-zA-Z]/.test(char)) {
        textMode = true
      }

      if (textMode) {
        currentText += char
      }
    } else {
      // If we were in text mode and have accumulated text, save it
      if (textMode && currentText.length > 10) {
        // Only keep text that looks like natural language
        if (/[a-zA-Z]{3,}/.test(currentText)) {
          extractedText += currentText + "\n"
        }
      }

      // Reset
      textMode = false
      currentText = ""
    }
  }

  // Clean up the extracted text
  return extractedText
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim()
}

/**
 * Clean extracted text
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim()
}

/**
 * Check if text contains binary data
 */
function containsBinaryData(text: string): boolean {
  // Check for common binary data markers
  if (text.includes("endobj") || text.includes("endstream") || text.includes("xref") || text.includes("startxref")) {
    return true
  }

  // Check for high ratio of non-text characters
  const nonTextChars = text.replace(/[a-zA-Z0-9\s.,;:'"!?()-]/g, "").length
  const ratio = nonTextChars / text.length

  return ratio > 0.3
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
 * Extract metadata from a PDF file
 */
export async function extractPDFMetadata(file: File): Promise<Record<string, string>> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file)
    const pdfInfo = await analyzePDFStructure(arrayBuffer)
    return pdfInfo.metadata
  } catch (error) {
    console.error("Error extracting PDF metadata:", error)
    return {}
  }
}

/**
 * Check if a PDF is likely to be scanned
 */
export async function isPDFScanned(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file)
    const result = await extractPDFWithDetails(arrayBuffer, file.name, {
      attemptMultipleStrategies: true,
      extractMetadata: true,
      attemptOCR: false,
    })

    return result.isScanned
  } catch (error) {
    console.error("Error checking if PDF is scanned:", error)
    return false
  }
}

/**
 * Check if a PDF is encrypted
 */
export async function isPDFEncrypted(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file)
    const pdfInfo = await analyzePDFStructure(arrayBuffer)
    return pdfInfo.isEncrypted
  } catch (error) {
    console.error("Error checking if PDF is encrypted:", error)
    return false
  }
}

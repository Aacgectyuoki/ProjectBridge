/**
 * Tesseract.js OCR integration for extracting text from scanned PDFs
 */

// OCR options
interface OCROptions {
  language?: string
  logger?: (progress: { status: string; progress: number }) => void
  maxPagesToProcess?: number
}

/**
 * Extract text from an image using Tesseract.js OCR
 */
export async function extractTextFromImage(imageData: Blob | ArrayBuffer, options: OCROptions = {}): Promise<string> {
  try {
    // Set default options
    const opts = {
      language: "eng",
      maxPagesToProcess: 20,
      ...options,
    }

    // Load Tesseract.js from CDN
    const Tesseract = await loadTesseractFromCDN(opts.logger)

    // Create worker
    const worker = await createTesseractWorker(Tesseract, opts.language, opts.logger)

    // Process the image
    let result: string
    if (imageData instanceof Blob) {
      const { data } = await worker.recognize(imageData)
      result = data.text
    } else {
      // Convert ArrayBuffer to Blob
      const blob = new Blob([new Uint8Array(imageData)], { type: "image/png" })
      const { data } = await worker.recognize(blob)
      result = data.text
    }

    // Terminate worker
    await worker.terminate()

    return result
  } catch (error) {
    console.error("OCR error:", error)
    return `OCR processing encountered an error: ${error.message}. Please try copying text directly from your PDF viewer.`
  }
}

/**
 * Load Tesseract.js from CDN
 */
async function loadTesseractFromCDN(logger?: (progress: { status: string; progress: number }) => void): Promise<any> {
  try {
    if (logger) logger({ status: "loading tesseract.js", progress: 0 })

    // Load Tesseract.js from CDN
    const tesseractScript = document.createElement("script")
    tesseractScript.src = "https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js"

    // Wait for script to load
    await new Promise((resolve, reject) => {
      tesseractScript.onload = resolve
      tesseractScript.onerror = reject
      document.head.appendChild(tesseractScript)
    })

    if (logger) logger({ status: "tesseract.js loaded", progress: 100 })

    // Return the global Tesseract object
    return window.Tesseract
  } catch (error) {
    console.error("Error loading Tesseract.js:", error)
    throw new Error("Failed to load OCR library")
  }
}

/**
 * Create a Tesseract worker
 */
async function createTesseractWorker(
  Tesseract: any,
  language = "eng",
  logger?: (progress: { status: string; progress: number }) => void,
): Promise<any> {
  if (logger) logger({ status: "initializing worker", progress: 0 })

  // Create worker
  const worker = await Tesseract.createWorker({
    logger: (m: any) => {
      if (logger) {
        logger({
          status: m.status,
          progress: m.progress * 100,
        })
      }
    },
  })

  if (logger) logger({ status: "loading language data", progress: 20 })

  // Load language
  await worker.loadLanguage(language)

  if (logger) logger({ status: "initializing language", progress: 60 })

  // Initialize language
  await worker.initialize(language)

  if (logger) logger({ status: "ready", progress: 100 })

  return worker
}

/**
 * Extract text from a PDF page using OCR
 */
export async function extractTextFromPDFPageWithOCR(
  pdfPage: any, // PDF.js page object
  options: OCROptions = {},
): Promise<string> {
  try {
    // Set default options
    const opts = {
      language: "eng",
      ...options,
    }

    // Render the page to a canvas
    const viewport = pdfPage.getViewport({ scale: 2.0 }) // Higher scale for better OCR
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not create canvas context")
    }

    // Render the PDF page to the canvas
    await pdfPage.render({
      canvasContext: ctx,
      viewport,
    }).promise

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/png")
    })

    // Extract text using OCR
    const text = await extractTextFromImage(blob, opts)

    return text
  } catch (error) {
    console.error("Error extracting text from PDF page with OCR:", error)
    return ""
  }
}

/**
 * Process a PDF with OCR
 */
export async function processPDFWithOCR(pdfData: ArrayBuffer, options: OCROptions = {}): Promise<string> {
  try {
    // Set default options
    const opts = {
      language: "eng",
      maxPagesToProcess: 20,
      ...options,
    }

    // Load PDF.js
    const pdfjsLib = await loadPDFJSFromCDN(opts.logger)

    // Load the PDF
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise

    // Get total pages
    const numPages = pdf.numPages
    const pagesToProcess = Math.min(numPages, opts.maxPagesToProcess)

    // Extract text from each page
    let extractedText = ""
    for (let i = 1; i <= pagesToProcess; i++) {
      if (opts.logger) {
        opts.logger({
          status: `Processing page ${i} of ${pagesToProcess}`,
          progress: (i / pagesToProcess) * 100,
        })
      }

      // Get the page
      const page = await pdf.getPage(i)

      // Try to extract text normally first
      let pageText = ""
      try {
        const textContent = await page.getTextContent()
        pageText = textContent.items.map((item: any) => item.str).join(" ")
      } catch (error) {
        console.log("Normal text extraction failed, falling back to OCR")
      }

      // If no text was extracted, try OCR
      if (!pageText || pageText.trim().length < 50) {
        pageText = await extractTextFromPDFPageWithOCR(page, opts)
      }

      extractedText += pageText + "\n\n"
    }

    return extractedText.trim()
  } catch (error) {
    console.error("Error processing PDF with OCR:", error)
    return `OCR processing encountered an error: ${error.message}. Please try copying text directly from your PDF viewer.`
  }
}

/**
 * Load PDF.js from CDN
 */
async function loadPDFJSFromCDN(logger?: (progress: { status: string; progress: number }) => void): Promise<any> {
  try {
    if (logger) logger({ status: "loading pdf.js", progress: 0 })

    // Load PDF.js from CDN
    const pdfjsScript = document.createElement("script")
    pdfjsScript.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"

    // Wait for script to load
    await new Promise((resolve, reject) => {
      pdfjsScript.onload = resolve
      pdfjsScript.onerror = reject
      document.head.appendChild(pdfjsScript)
    })

    if (logger) logger({ status: "pdf.js loaded", progress: 100 })

    // Return the global pdfjsLib object
    return window.pdfjsLib
  } catch (error) {
    console.error("Error loading PDF.js:", error)
    throw new Error("Failed to load PDF library")
  }
}

/**
 * Declare global window interface
 */
declare global {
  interface Window {
    Tesseract: any
    pdfjsLib: any
  }
}

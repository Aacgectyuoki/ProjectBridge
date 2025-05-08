/**
 * Fallback method to extract text from PDF binary data
 * This is a very basic approach that won't work well for all PDFs
 */
export function extractTextFromPDFBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let text = ""

  // Convert the binary data to a string, only including ASCII printable characters
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 32 && bytes[i] <= 126) {
      text += String.fromCharCode(bytes[i])
    }
  }

  // Look for patterns that might indicate text content
  // This is a very simplified approach
  const textBlocks = text.match(/[A-Za-z0-9\s.,;:'"!?()-]{10,}/g) || []
  return textBlocks.join("\n\n")
}

/**
 * Fallback method to extract text from DOCX binary data
 * This looks for text between <w:t> tags which contain the actual text in DOCX files
 */
export function extractTextFromDOCXBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let text = ""

  // Convert the binary data to a string, only including ASCII printable characters
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 32 && bytes[i] <= 126) {
      text += String.fromCharCode(bytes[i])
    }
  }

  // Extract text between <w:t> tags
  const textMatches = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []

  // Join the matches with spaces
  return textMatches
    .map((match) => {
      const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
      return textMatch ? textMatch[1] : ""
    })
    .join(" ")
}

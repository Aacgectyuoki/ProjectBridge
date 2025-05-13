/**
 * Fallback methods for document text extraction when libraries fail
 */

/**
 * Extract text from DOCX binary data
 * This is a fallback when mammoth.js fails
 */
export function extractTextFromDOCXBinary(buffer: ArrayBuffer): string {
  try {
    // Convert ArrayBuffer to string (only ASCII printable chars)
    const bytes = new Uint8Array(buffer)
    let docString = ""

    for (let i = 0; i < bytes.length; i++) {
      // Only include ASCII printable characters
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        docString += String.fromCharCode(bytes[i])
      } else {
        docString += " " // Replace non-printable with space
      }
    }

    // Extract text using pattern matching
    let extractedText = ""

    // Look for content in XML tags that might contain text
    const contentMatches = docString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []
    for (const match of contentMatches) {
      const textMatch = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/)
      if (textMatch && textMatch[1]) {
        extractedText += textMatch[1] + " "
      }
    }

    // Look for paragraph breaks
    const paragraphMatches = docString.match(/<w:p[^>]*>/g) || []
    if (paragraphMatches.length > 0) {
      // Replace paragraph markers with newlines
      extractedText = extractedText.replace(new RegExp(`(${paragraphMatches.join("|")})`, "g"), "\n")
    }

    return extractedText || "Could not extract text from DOCX. Please paste content manually."
  } catch (error) {
    console.error("Error in DOCX fallback extraction:", error)
    return "DOCX extraction failed. Please paste the text content directly."
  }
}

/**
 * Extract text from RTF binary data
 */
export function extractTextFromRTFBinary(buffer: ArrayBuffer): string {
  try {
    // Convert ArrayBuffer to string
    const bytes = new Uint8Array(buffer)
    let rtfString = ""

    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        rtfString += String.fromCharCode(bytes[i])
      }
    }

    // Remove RTF control sequences
    const plainText = rtfString
      .replace(/\{\\rtf1[^{}]*\}/g, "") // Remove header
      .replace(/\\\w+\s?/g, "") // Remove control words
      .replace(/\\\{/g, "{")
      .replace(/\\\}/g, "}") // Unescape braces
      .replace(/\\'[0-9a-f]{2}/g, "") // Remove hex escapes
      .replace(/\{|\}/g, "") // Remove remaining braces

    return plainText || "Could not extract text from RTF. Please paste content manually."
  } catch (error) {
    console.error("Error in RTF extraction:", error)
    return "RTF extraction failed. Please paste the text content directly."
  }
}

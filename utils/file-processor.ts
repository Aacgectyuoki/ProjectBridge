/**
 * Extracts text content from various file types
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === "text/plain") {
      // For text files, we can read directly
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read text file"))
      reader.readAsText(file)
    } else if (file.type === "application/pdf") {
      // In a real implementation, we would use a PDF parsing library
      // For now, we'll simulate with a delay
      setTimeout(() => {
        resolve("This is simulated text extracted from a PDF file")
      }, 1000)
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // In a real implementation, we would use a DOCX parsing library
      // For now, we'll simulate with a delay
      setTimeout(() => {
        resolve("This is simulated text extracted from a DOCX file")
      }, 1000)
    } else {
      reject(new Error("Unsupported file type"))
    }
  })
}

/**
 * Validates if a file is of an acceptable type
 */
export function isValidResumeFile(file: File): boolean {
  const validTypes = [
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]
  return validTypes.includes(file.type)
}

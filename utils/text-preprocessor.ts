/**
 * Utility functions for preprocessing text before analysis
 */

/**
 * Clean up text extracted from documents
 * @param text Raw text extracted from a document
 * @returns Cleaned text
 */
export function cleanExtractedText(text: string): string {
  if (!text) return ""

  return (
    text
      // Replace multiple spaces with a single space
      .replace(/\s+/g, " ")
      // Replace multiple newlines with a single newline
      .replace(/\n+/g, "\n")
      // Remove strange Unicode characters that might appear in PDFs
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
      // Remove excessive whitespace at the beginning and end
      .trim()
  )
}

/**
 * Normalize text for better analysis
 * @param text Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  return (
    cleanExtractedText(text)
      // Convert to lowercase for case-insensitive matching
      .toLowerCase()
      // Replace special characters with spaces
      .replace(/[^\w\s]/g, " ")
      // Replace multiple spaces with a single space
      .replace(/\s+/g, " ")
      .trim()
  )
}

/**
 * Extract sections from a resume
 * @param text Resume text
 * @returns Object with resume sections
 */
export function extractResumeSections(text: string): Record<string, string> {
  const cleanText = cleanExtractedText(text)

  // Common section headers in resumes
  const sectionPatterns = [
    { name: "contact", pattern: /\b(contact|personal info|information)\b/i },
    { name: "summary", pattern: /\b(summary|profile|objective|about me)\b/i },
    { name: "experience", pattern: /\b(experience|work|employment|job history)\b/i },
    { name: "education", pattern: /\b(education|academic|qualification|degree)\b/i },
    { name: "skills", pattern: /\b(skills|expertise|competencies|technical skills)\b/i },
    { name: "projects", pattern: /\b(projects|portfolio|works)\b/i },
    { name: "certifications", pattern: /\b(certifications|certificates|credentials)\b/i },
    { name: "languages", pattern: /\b(languages|language proficiency)\b/i },
    { name: "interests", pattern: /\b(interests|hobbies|activities)\b/i },
    { name: "references", pattern: /\b(references|recommendations)\b/i },
  ]

  const sections: Record<string, string> = {}

  // Split text into lines
  const lines = cleanText.split("\n")

  let currentSection = "other"
  let currentContent: string[] = []

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    // Check if this line is a section header
    let isSectionHeader = false
    for (const { name, pattern } of sectionPatterns) {
      if (pattern.test(line) && line.length < 50) {
        // Section headers are usually short
        // Save the current section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n")
        }

        // Start a new section
        currentSection = name
        currentContent = []
        isSectionHeader = true
        break
      }
    }

    // If not a section header, add to current section content
    if (!isSectionHeader) {
      currentContent.push(line)
    }
  }

  // Save the last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n")
  }

  return sections
}

/**
 * Extract skills section from resume text
 * This is a helper function to focus on the skills section if it exists
 * @param text The full resume text
 * @returns The skills section text or the full text if no skills section is found
 */
export function extractSkillsSection(text: string): string {
  const sections = extractResumeSections(text)

  // If we found a skills section, return it
  if (sections.skills && sections.skills.length > 0) {
    return sections.skills
  }

  // Otherwise return the full text
  return text
}

/**
 * Preprocess text for skill extraction
 * This combines multiple preprocessing steps for optimal skill extraction
 * @param text The raw text from a resume
 * @returns Preprocessed text ready for skill extraction
 */
export function preprocessForSkillExtraction(text: string): string {
  // First clean the text
  const cleanedText = cleanExtractedText(text)

  // Try to extract the skills section
  const skillsSection = extractSkillsSection(cleanedText)

  // If the skills section is very short, use the full text
  if (skillsSection.length < 50) {
    return cleanedText
  }

  // Otherwise use the skills section with some context
  return `SKILLS SECTION FROM RESUME:\n${skillsSection}\n\nFULL RESUME:\n${cleanedText.substring(0, 1000)}...`
}

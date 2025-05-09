/**
 * Validates and ensures consistency between summary and structured data
 */

import type { SkillGapAnalysisResult } from "@/app/actions/analyze-skills-gap"
import { extractTechnologiesFromSummary } from "./summary-skill-extractor"

/**
 * Validates consistency between summary and structured data
 * @param result The skills gap analysis result
 * @returns Object with validation results and warnings
 */
export function validateSkillsGapConsistency(result: SkillGapAnalysisResult): {
  isConsistent: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // Extract technologies mentioned in the summary
  const summaryTechnologies = extractTechnologiesFromSummary(result.summary)

  // Get all skills from structured data
  const structuredSkills = [...result.matchedSkills.map((s) => s.name), ...result.missingSkills.map((s) => s.name)]

  // Check if any technologies in the summary are missing from structured data
  const missingFromStructure = summaryTechnologies.filter(
    (tech) =>
      !structuredSkills.some(
        (skill) =>
          skill.toLowerCase() === tech.toLowerCase() ||
          skill.toLowerCase().includes(tech.toLowerCase()) ||
          tech.toLowerCase().includes(skill.toLowerCase()),
      ),
  )

  if (missingFromStructure.length > 0) {
    warnings.push(
      `Technologies mentioned in summary but missing from structured data: ${missingFromStructure.join(", ")}`,
    )
  }

  // Check if summary mentions missing skills but missingSkills array is empty
  const hasMissingSkillsInSummary = /lack(s|ing)|missing|need(s) to|should learn|doesn't have/.test(
    result.summary.toLowerCase(),
  )
  if (hasMissingSkillsInSummary && result.missingSkills.length === 0) {
    warnings.push("Summary mentions missing skills but missingSkills array is empty")
  }

  // Check if summary mentions matched skills but matchedSkills array is empty
  const hasMatchedSkillsInSummary =
    /has|possess(es)|demonstrate(s)|show(s)|strong in|proficient in|experienced in/.test(result.summary.toLowerCase())
  if (hasMatchedSkillsInSummary && result.matchedSkills.length === 0) {
    warnings.push("Summary mentions matched skills but matchedSkills array is empty")
  }

  // Check if recommendations are empty but summary suggests improvements
  const suggestsImprovements = /should|could|need(s) to|improve|learn|acquire|gain/.test(result.summary.toLowerCase())
  if (suggestsImprovements && result.recommendations.length === 0) {
    warnings.push("Summary suggests improvements but recommendations array is empty")
  }

  return {
    isConsistent: warnings.length === 0,
    warnings,
  }
}

/**
 * Logs validation warnings to console
 * @param result The skills gap analysis result
 */
export function logSkillsGapValidation(result: SkillGapAnalysisResult): void {
  const validation = validateSkillsGapConsistency(result)

  if (!validation.isConsistent) {
    console.warn("Skills gap analysis consistency warnings:")
    validation.warnings.forEach((warning) => console.warn(`- ${warning}`))
  } else {
    console.log("Skills gap analysis is consistent between summary and structured data")
  }
}

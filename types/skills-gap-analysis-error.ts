// Error types specific to skills gap analysis
export enum SkillsGapAnalysisErrorType {
  INSUFFICIENT_DATA = "insufficient_data",
  API_ERROR = "api_error",
  PARSING_ERROR = "parsing_error",
  VALIDATION_ERROR = "validation_error",
  UNKNOWN_ERROR = "unknown_error",
}

// Custom error class for skills gap analysis errors
export class SkillsGapAnalysisError extends Error {
  type: SkillsGapAnalysisErrorType
  details?: any

  constructor(message: string, type: SkillsGapAnalysisErrorType, details?: any) {
    super(message)
    this.name = "SkillsGapAnalysisError"
    this.type = type
    this.details = details
  }
}

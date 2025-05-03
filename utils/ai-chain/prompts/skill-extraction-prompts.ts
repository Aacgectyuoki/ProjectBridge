export const jobSkillExtractionPrompt = {
  format: ({ text }) => `
You are an AI assistant specialized in extracting skills from job descriptions.

Job Description:
${text}

Extract all skills mentioned in the job description and categorize them. Return ONLY a JSON object with the following structure:
{
  "technical": ["skill1", "skill2", ...],
  "soft": ["skill1", "skill2", ...],
  "tools": ["tool1", "tool2", ...],
  "frameworks": ["framework1", "framework2", ...],
  "languages": ["language1", "language2", ...],
  "databases": ["database1", "database2", ...],
  "methodologies": ["methodology1", "methodology2", ...],
  "platforms": ["platform1", "platform2", ...],
  "other": ["other1", "other2", ...]
}

Guidelines:
1. Return ONLY the JSON object, no additional text
2. Use double quotes for all strings and property names
3. Do not include trailing commas
4. If a category has no skills, use an empty array []
5. Be specific and extract actual skills, not general requirements
6. Normalize similar skills (e.g., "React.js" and "ReactJS" should be normalized to "React")
7. Do not include duplicate skills within a category
`,
}

export const jobSkillExtractionChunkPrompt = {
  format: ({ text, chunkIndex, totalChunks }) => `
You are an AI assistant specialized in extracting skills from job descriptions.

This is chunk ${chunkIndex} of ${totalChunks} from a job description.

Job Description Chunk:
${text}

Extract all skills mentioned in this chunk and categorize them. Return ONLY a JSON object with the following structure:
{
  "technical": ["skill1", "skill2", ...],
  "soft": ["skill1", "skill2", ...],
  "tools": ["tool1", "tool2", ...],
  "frameworks": ["framework1", "framework2", ...],
  "languages": ["language1", "language2", ...],
  "databases": ["database1", "database2", ...],
  "methodologies": ["methodology1", "methodology2", ...],
  "platforms": ["platform1", "platform2", ...],
  "other": ["other1", "other2", ...]
}

Guidelines:
1. Return ONLY the JSON object, no additional text
2. Use double quotes for all strings and property names
3. Do not include trailing commas
4. If a category has no skills, use an empty array []
5. Be specific and extract actual skills, not general requirements
6. Normalize similar skills (e.g., "React.js" and "ReactJS" should be normalized to "React")
7. Do not include duplicate skills within a category
`,
}

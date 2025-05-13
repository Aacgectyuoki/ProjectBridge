export const jobSkillExtractionPrompt = {
  format: ({ text }) => `
You are an AI assistant specialized in extracting skills from job descriptions across all industries and roles.

Job Description:
${text}

Extract all skills mentioned in the job description and categorize them. Return ONLY a JSON object with the following structure:
{
  "technical": ["skill1", "skill2"],
  "soft": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "frameworks": ["framework1", "framework2"],
  "languages": ["language1", "language2"],
  "databases": ["database1", "database2"],
  "methodologies": ["methodology1", "methodology2"],
  "platforms": ["platform1", "platform2"],
  "other": ["other1", "other2"]
}

CRITICAL JSON FORMATTING INSTRUCTIONS:
1. Use double quotes for all strings and property names
2. Do not include trailing commas after the last item in arrays or objects
3. Ensure each array element is properly separated by a comma
4. Do not include extra commas between array elements
5. If a category has no skills, use an empty array []
6. Do not include any explanatory text before or after the JSON object
7. Ensure the response is valid JSON that can be parsed with JSON.parse()

SKILL EXTRACTION GUIDELINES:
1. Be specific and extract actual skills, not general requirements
2. Include both explicitly stated skills and implied skills
3. Normalize similar skills (e.g., "React.js" and "ReactJS" should be normalized to "React")
4. Do not include duplicate skills within a category
5. For experience requirements (e.g., "5+ years"), do not include the years as a skill
6. Extract specific technologies, not generic descriptions
7. Categorize skills appropriately based on the following guidelines:

CATEGORIZATION GUIDELINES:
- technical: Core technical abilities and knowledge areas
- soft: Interpersonal and non-technical professional skills
- tools: Software applications, platforms, and utilities
- frameworks: Programming frameworks and libraries
- languages: Programming and markup languages
- databases: Database technologies and data storage systems
- methodologies: Work approaches, processes, and methodologies
- platforms: Operating systems, cloud platforms, and infrastructure
- other: Skills that don't fit into the above categories

EXAMPLES OF VALID RESPONSES:

Example 1 (Software Engineer):
{
  "technical": ["algorithm design", "system architecture", "API design", "performance optimization"],
  "soft": ["communication", "teamwork", "problem solving"],
  "tools": ["Git", "JIRA", "VS Code"],
  "frameworks": ["React", "Node.js", "Express"],
  "languages": ["JavaScript", "TypeScript", "Python"],
  "databases": ["MongoDB", "PostgreSQL"],
  "methodologies": ["Agile", "Scrum", "TDD"],
  "platforms": ["AWS", "Docker", "Kubernetes"],
  "other": ["CI/CD", "microservices"]
}

Example 2 (Marketing Specialist):
{
  "technical": ["SEO", "content strategy", "A/B testing", "conversion optimization"],
  "soft": ["creativity", "communication", "time management"],
  "tools": ["Google Analytics", "HubSpot", "Mailchimp", "Adobe Creative Suite"],
  "frameworks": [],
  "languages": [],
  "databases": [],
  "methodologies": ["growth hacking", "inbound marketing"],
  "platforms": ["WordPress", "Shopify", "social media platforms"],
  "other": ["market research", "brand development"]
}

Example 3 (Data Scientist):
{
  "technical": ["machine learning", "statistical analysis", "data visualization", "feature engineering"],
  "soft": ["critical thinking", "communication", "problem solving"],
  "tools": ["Jupyter", "Tableau", "Power BI"],
  "frameworks": ["TensorFlow", "PyTorch", "scikit-learn"],
  "languages": ["Python", "R", "SQL"],
  "databases": ["PostgreSQL", "MongoDB", "Hadoop"],
  "methodologies": ["A/B testing", "cross-validation"],
  "platforms": ["AWS", "Azure", "GCP"],
  "other": ["NLP", "computer vision", "time series analysis"]
}

Now, extract the skills from the job description provided and return ONLY the JSON object.
`,
}

export const jobSkillExtractionChunkPrompt = {
  format: ({ text, chunkIndex, totalChunks }) => `
You are an AI assistant specialized in extracting skills from job descriptions across all industries and roles.

This is chunk ${chunkIndex} of ${totalChunks} from a job description.

Job Description Chunk:
${text}

Extract all skills mentioned in this chunk and categorize them. Return ONLY a JSON object with the following structure:
{
  "technical": ["skill1", "skill2"],
  "soft": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "frameworks": ["framework1", "framework2"],
  "languages": ["language1", "language2"],
  "databases": ["database1", "database2"],
  "methodologies": ["methodology1", "methodology2"],
  "platforms": ["platform1", "platform2"],
  "other": ["other1", "other2"]
}

CRITICAL JSON FORMATTING INSTRUCTIONS:
1. Use double quotes for all strings and property names
2. Do not include trailing commas after the last item in arrays or objects
3. Ensure each array element is properly separated by a comma
4. Do not include extra commas between array elements
5. If a category has no skills, use an empty array []
6. Do not include any explanatory text before or after the JSON object
7. Ensure the response is valid JSON that can be parsed with JSON.parse()

SKILL EXTRACTION GUIDELINES:
1. Be specific and extract actual skills, not general requirements
2. Include both explicitly stated skills and implied skills
3. Normalize similar skills (e.g., "React.js" and "ReactJS" should be normalized to "React")
4. Do not include duplicate skills within a category
5. For experience requirements (e.g., "5+ years"), do not include the years as a skill
6. Extract specific technologies, not generic descriptions
7. Categorize skills appropriately based on the following guidelines:

CATEGORIZATION GUIDELINES:
- technical: Core technical abilities and knowledge areas
- soft: Interpersonal and non-technical professional skills
- tools: Software applications, platforms, and utilities
- frameworks: Programming frameworks and libraries
- languages: Programming and markup languages
- databases: Database technologies and data storage systems
- methodologies: Work approaches, processes, and methodologies
- platforms: Operating systems, cloud platforms, and infrastructure
- other: Skills that don't fit into the above categories

Now, extract the skills from this job description chunk and return ONLY the JSON object.
`,
}

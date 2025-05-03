import { z } from "zod"

export const SkillsSchema = z.object({
  technical: z.array(z.string()).default([]),
  soft: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  other: z.array(z.string()).default([]),
})

export type ExtractedSkills = z.infer<typeof SkillsSchema>

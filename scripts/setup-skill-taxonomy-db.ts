import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for migrations
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log("Setting up skill taxonomy database...")

  // Create skills table
  const { error: skillsError } = await supabase.rpc("create_skills_table")
  if (skillsError) {
    console.error("Error creating skills table:", skillsError)
    return
  }

  // Create skill relationships table
  const { error: relError } = await supabase.rpc("create_skill_relationships_table")
  if (relError) {
    console.error("Error creating skill relationships table:", relError)
    return
  }

  // Create skill equivalents table
  const { error: eqError } = await supabase.rpc("create_skill_equivalents_table")
  if (eqError) {
    console.error("Error creating skill equivalents table:", eqError)
    return
  }

  // Create skill categories table
  const { error: catError } = await supabase.rpc("create_skill_categories_table")
  if (catError) {
    console.error("Error creating skill categories table:", catError)
    return
  }

  console.log("Database setup complete!")
}

// Seed initial data
async function seedInitialData() {
  console.log("Seeding initial data...")

  // Seed categories
  const categories = [
    { name: "Programming Languages", description: "Programming and scripting languages" },
    { name: "Frameworks", description: "Software frameworks and libraries" },
    { name: "Databases", description: "Database systems and technologies" },
    { name: "Cloud Platforms", description: "Cloud computing platforms" },
    { name: "Tools", description: "Development and productivity tools" },
    { name: "Methodologies", description: "Development methodologies and practices" },
  ]

  const { error: catError } = await supabase.from("skill_categories").insert(categories)

  if (catError) {
    console.error("Error seeding categories:", catError)
    return
  }

  // Seed some initial skills
  const skills = [
    { name: "Python", normalized_name: "python", category: "Programming Languages" },
    { name: "JavaScript", normalized_name: "javascript", category: "Programming Languages" },
    { name: "React", normalized_name: "react", category: "Frameworks" },
    { name: "AWS", normalized_name: "aws", category: "Cloud Platforms" },
    { name: "PostgreSQL", normalized_name: "postgresql", category: "Databases" },
  ]

  const { error: skillError, data: skillData } = await supabase.from("skills").insert(skills).select()

  if (skillError) {
    console.error("Error seeding skills:", skillError)
    return
  }

  // Find the AWS skill to create equivalents
  const awsSkill = skillData.find((s) => s.normalized_name === "aws")

  if (awsSkill) {
    // Seed some equivalents
    const equivalents = [
      { skill_id: awsSkill.id, equivalent_term: "Amazon Web Services", normalized_term: "amazon web services" },
      { skill_id: awsSkill.id, equivalent_term: "Amazon Cloud", normalized_term: "amazon cloud" },
    ]

    const { error: eqError } = await supabase.from("skill_equivalents").insert(equivalents)

    if (eqError) {
      console.error("Error seeding equivalents:", eqError)
    }
  }

  console.log("Initial data seeded!")
}

async function run() {
  await setupDatabase()
  await seedInitialData()
  console.log("Setup complete!")
}

run()

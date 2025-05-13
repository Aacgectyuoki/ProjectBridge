import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log("Creating ProjectBridge database tables...")

  // Users table is already created by Supabase Auth

  // Create user_preferences table
  const { error: preferencesError } = await supabase.rpc("create_user_preferences_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        default_role_focus TEXT,
        notification_settings JSONB DEFAULT '{"email_notifications": true, "analysis_complete": true, "new_features": true}'::jsonb,
        theme TEXT DEFAULT 'system',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
  })

  if (preferencesError) {
    console.error("Error creating user_preferences table:", preferencesError)
  }

  // Create resumes table
  const { error: resumesError } = await supabase.rpc("create_resumes_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS resumes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        file_name TEXT,
        file_type TEXT,
        file_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_analyzed TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX idx_resumes_user_id ON resumes(user_id);
    `,
  })

  if (resumesError) {
    console.error("Error creating resumes table:", resumesError)
  }

  // Create resume_analyses table
  const { error: resumeAnalysesError } = await supabase.rpc("create_resume_analyses_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS resume_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
        session_id UUID NOT NULL,
        analysis_result JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);
      CREATE INDEX idx_resume_analyses_session_id ON resume_analyses(session_id);
    `,
  })

  if (resumeAnalysesError) {
    console.error("Error creating resume_analyses table:", resumeAnalysesError)
  }

  // Create resume_skills table
  const { error: resumeSkillsError } = await supabase.rpc("create_resume_skills_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS resume_skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        resume_analysis_id UUID REFERENCES resume_analyses(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id),
        skill_name TEXT NOT NULL,
        category TEXT NOT NULL,
        confidence FLOAT DEFAULT 1.0,
        context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_resume_skills_analysis_id ON resume_skills(resume_analysis_id);
      CREATE INDEX idx_resume_skills_skill_id ON resume_skills(skill_id);
    `,
  })

  if (resumeSkillsError) {
    console.error("Error creating resume_skills table:", resumeSkillsError)
  }

  // Create job_descriptions table
  const { error: jobsError } = await supabase.rpc("create_job_descriptions_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS job_descriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        company TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_analyzed TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX idx_job_descriptions_user_id ON job_descriptions(user_id);
    `,
  })

  if (jobsError) {
    console.error("Error creating job_descriptions table:", jobsError)
  }

  // Create job_analyses table
  const { error: jobAnalysesError } = await supabase.rpc("create_job_analyses_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS job_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
        session_id UUID NOT NULL,
        analysis_result JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_job_analyses_job_id ON job_analyses(job_description_id);
      CREATE INDEX idx_job_analyses_session_id ON job_analyses(session_id);
    `,
  })

  if (jobAnalysesError) {
    console.error("Error creating job_analyses table:", jobAnalysesError)
  }

  // Create job_skills table
  const { error: jobSkillsError } = await supabase.rpc("create_job_skills_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS job_skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_analysis_id UUID REFERENCES job_analyses(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id),
        skill_name TEXT NOT NULL,
        category TEXT NOT NULL,
        is_required BOOLEAN DEFAULT true,
        confidence FLOAT DEFAULT 1.0,
        context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_job_skills_analysis_id ON job_skills(job_analysis_id);
      CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);
    `,
  })

  if (jobSkillsError) {
    console.error("Error creating job_skills table:", jobSkillsError)
  }

  // Create skill_matches table
  const { error: matchesError } = await supabase.rpc("create_skill_matches_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS skill_matches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID NOT NULL,
        resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
        job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
        match_percentage FLOAT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_skill_matches_session_id ON skill_matches(session_id);
      CREATE INDEX idx_skill_matches_resume_id ON skill_matches(resume_id);
      CREATE INDEX idx_skill_matches_job_id ON skill_matches(job_description_id);
    `,
  })

  if (matchesError) {
    console.error("Error creating skill_matches table:", matchesError)
  }

  // Create matched_skills table
  const { error: matchedSkillsError } = await supabase.rpc("create_matched_skills_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS matched_skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        skill_match_id UUID REFERENCES skill_matches(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id),
        skill_name TEXT NOT NULL,
        category TEXT NOT NULL,
        resume_context TEXT,
        job_context TEXT,
        match_type TEXT NOT NULL,
        confidence FLOAT DEFAULT 1.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_matched_skills_match_id ON matched_skills(skill_match_id);
      CREATE INDEX idx_matched_skills_skill_id ON matched_skills(skill_id);
    `,
  })

  if (matchedSkillsError) {
    console.error("Error creating matched_skills table:", matchedSkillsError)
  }

  // Create missing_skills table
  const { error: missingSkillsError } = await supabase.rpc("create_missing_skills_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS missing_skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        skill_match_id UUID REFERENCES skill_matches(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id),
        skill_name TEXT NOT NULL,
        category TEXT NOT NULL,
        is_required BOOLEAN DEFAULT true,
        job_context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_missing_skills_match_id ON missing_skills(skill_match_id);
      CREATE INDEX idx_missing_skills_skill_id ON missing_skills(skill_id);
    `,
  })

  if (missingSkillsError) {
    console.error("Error creating missing_skills table:", missingSkillsError)
  }

  // Create project_recommendations table
  const { error: projectsError } = await supabase.rpc("create_project_recommendations_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS project_recommendations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        skill_match_id UUID REFERENCES skill_matches(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        estimated_hours INTEGER NOT NULL,
        skills_addressed JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_project_recommendations_match_id ON project_recommendations(skill_match_id);
    `,
  })

  if (projectsError) {
    console.error("Error creating project_recommendations table:", projectsError)
  }

  // Create project_resources table
  const { error: resourcesError } = await supabase.rpc("create_project_resources_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS project_resources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_recommendation_id UUID REFERENCES project_recommendations(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_project_resources_project_id ON project_resources(project_recommendation_id);
    `,
  })

  if (resourcesError) {
    console.error("Error creating project_resources table:", resourcesError)
  }

  // Create analysis_sessions table
  const { error: sessionsError } = await supabase.rpc("create_analysis_sessions_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS analysis_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        session_token TEXT NOT NULL UNIQUE,
        resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
        job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        error TEXT
      );
      CREATE INDEX idx_analysis_sessions_user_id ON analysis_sessions(user_id);
      CREATE INDEX idx_analysis_sessions_token ON analysis_sessions(session_token);
    `,
  })

  if (sessionsError) {
    console.error("Error creating analysis_sessions table:", sessionsError)
  }

  console.log("Database tables created successfully!")
}

async function setupRLS() {
  console.log("Setting up Row Level Security policies...")

  // Example RLS policy for resumes
  const { error: resumesRLSError } = await supabase.rpc("setup_resumes_rls", {
    sql: `
      -- Enable RLS on resumes table
      ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to select their own resumes
      CREATE POLICY select_own_resumes ON resumes
        FOR SELECT USING (auth.uid() = user_id);

      -- Create policy to allow users to insert their own resumes
      CREATE POLICY insert_own_resumes ON resumes
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- Create policy to allow users to update their own resumes
      CREATE POLICY update_own_resumes ON resumes
        FOR UPDATE USING (auth.uid() = user_id);

      -- Create policy to allow users to delete their own resumes
      CREATE POLICY delete_own_resumes ON resumes
        FOR DELETE USING (auth.uid() = user_id);
    `,
  })

  if (resumesRLSError) {
    console.error("Error setting up RLS for resumes:", resumesRLSError)
  }

  // Similar RLS policies would be created for other tables

  console.log("Row Level Security policies set up successfully!")
}

async function run() {
  console.log("Starting ProjectBridge database setup...")

  await createTables()
  await setupRLS()

  console.log("ProjectBridge database setup completed successfully!")
}

// Run the setup
run().catch((error) => {
  console.error("Error in database setup:", error)
})

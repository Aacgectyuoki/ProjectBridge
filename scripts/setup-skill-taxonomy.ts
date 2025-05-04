import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log("Creating tables...")

  // Check if skills table exists
  const { data: skillsExists } = await supabase.from("skills").select("id").limit(1).maybeSingle()

  if (skillsExists === null) {
    // Create skills table
    const { error: skillsError } = await supabase.rpc("create_skills_table", {
      sql: `
        CREATE TABLE IF NOT EXISTS skills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          popularity INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE UNIQUE INDEX idx_skills_normalized_name ON skills(normalized_name);
        CREATE INDEX idx_skills_category ON skills(category);
      `,
    })

    if (skillsError) {
      console.error("Error creating skills table:", skillsError)
      return false
    }
  }

  // Check if skill_relationships table exists
  const { data: relationshipsExists } = await supabase.from("skill_relationships").select("id").limit(1).maybeSingle()

  if (relationshipsExists === null) {
    // Create skill_relationships table
    const { error: relError } = await supabase.rpc("create_skill_relationships_table", {
      sql: `
        CREATE TABLE IF NOT EXISTS skill_relationships (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          parent_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
          child_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
          relationship_type TEXT NOT NULL,
          strength FLOAT DEFAULT 1.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_skill_relationships_parent ON skill_relationships(parent_skill_id);
        CREATE INDEX idx_skill_relationships_child ON skill_relationships(child_skill_id);
        CREATE UNIQUE INDEX idx_skill_relationships_unique ON skill_relationships(parent_skill_id, child_skill_id);
      `,
    })

    if (relError) {
      console.error("Error creating skill_relationships table:", relError)
      return false
    }
  }

  // Check if skill_equivalents table exists
  const { data: equivalentsExists } = await supabase.from("skill_equivalents").select("id").limit(1).maybeSingle()

  if (equivalentsExists === null) {
    // Create skill_equivalents table
    const { error: eqError } = await supabase.rpc("create_skill_equivalents_table", {
      sql: `
        CREATE TABLE IF NOT EXISTS skill_equivalents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
          equivalent_term TEXT NOT NULL,
          normalized_term TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_skill_equivalents_skill ON skill_equivalents(skill_id);
        CREATE UNIQUE INDEX idx_skill_equivalents_unique ON skill_equivalents(skill_id, normalized_term);
      `,
    })

    if (eqError) {
      console.error("Error creating skill_equivalents table:", eqError)
      return false
    }
  }

  // Check if skill_categories table exists
  const { data: categoriesExists } = await supabase.from("skill_categories").select("id").limit(1).maybeSingle()

  if (categoriesExists === null) {
    // Create skill_categories table
    const { error: catError } = await supabase.rpc("create_skill_categories_table", {
      sql: `
        CREATE TABLE IF NOT EXISTS skill_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          parent_category_id UUID REFERENCES skill_categories(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE UNIQUE INDEX idx_skill_categories_name ON skill_categories(name);
      `,
    })

    if (catError) {
      console.error("Error creating skill_categories table:", catError)
      return false
    }
  }

  console.log("Tables created successfully!")
  return true
}

async function seedCategories() {
  console.log("Seeding skill categories...")

  const categories = [
    { name: "Programming Languages", description: "Programming and scripting languages" },
    { name: "Frameworks", description: "Software frameworks and libraries" },
    { name: "Databases", description: "Database systems and technologies" },
    { name: "Cloud Platforms", description: "Cloud computing platforms and services" },
    { name: "DevOps", description: "Development operations tools and practices" },
    { name: "Machine Learning", description: "Machine learning and AI technologies" },
    { name: "Data Engineering", description: "Data processing and engineering tools" },
    { name: "Web Technologies", description: "Web development technologies" },
    { name: "Mobile Development", description: "Mobile app development technologies" },
    { name: "Security", description: "Cybersecurity tools and practices" },
    { name: "Soft Skills", description: "Non-technical professional skills" },
    { name: "Tools", description: "Development and productivity tools" },
    { name: "Methodologies", description: "Development methodologies and practices" },
  ]

  for (const category of categories) {
    // Check if category exists
    const { data: existingCategory } = await supabase
      .from("skill_categories")
      .select("id")
      .eq("name", category.name)
      .maybeSingle()

    if (!existingCategory) {
      const { error } = await supabase.from("skill_categories").insert(category)

      if (error) {
        console.error(`Error seeding category ${category.name}:`, error)
      }
    }
  }

  console.log("Categories seeded successfully!")
}

async function seedSkills() {
  console.log("Seeding skills...")

  // Programming Languages
  const programmingSkills = [
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "C#",
    "C++",
    "Go",
    "Rust",
    "PHP",
    "Ruby",
    "Swift",
    "Kotlin",
    "Scala",
    "R",
    "MATLAB",
    "Perl",
    "Shell",
    "Bash",
    "PowerShell",
    "SQL",
    "HTML",
    "CSS",
    "Dart",
  ]

  // Frameworks
  const frameworkSkills = [
    "React",
    "Angular",
    "Vue.js",
    "Next.js",
    "Express.js",
    "Django",
    "Flask",
    "Spring Boot",
    "ASP.NET Core",
    "Ruby on Rails",
    "Laravel",
    "Symfony",
    "TensorFlow",
    "PyTorch",
    "Keras",
    "scikit-learn",
    "pandas",
    "NumPy",
    "Node.js",
    "Deno",
    "Flutter",
    "React Native",
    "Xamarin",
    "SwiftUI",
  ]

  // Databases
  const databaseSkills = [
    "PostgreSQL",
    "MySQL",
    "SQLite",
    "Oracle",
    "SQL Server",
    "MongoDB",
    "Redis",
    "Cassandra",
    "DynamoDB",
    "Elasticsearch",
    "Neo4j",
    "Firebase",
    "Supabase",
    "Firestore",
    "CouchDB",
    "MariaDB",
    "Snowflake",
    "BigQuery",
  ]

  // Cloud Platforms
  const cloudSkills = [
    "AWS",
    "Azure",
    "Google Cloud",
    "Heroku",
    "DigitalOcean",
    "Vercel",
    "Netlify",
    "AWS Lambda",
    "AWS EC2",
    "AWS S3",
    "AWS RDS",
    "AWS DynamoDB",
    "Azure Functions",
    "Azure VM",
    "Google Cloud Functions",
    "Firebase",
    "AWS SageMaker",
    "Azure ML",
    "Google AI Platform",
  ]

  // DevOps
  const devopsSkills = [
    "Docker",
    "Kubernetes",
    "Jenkins",
    "GitHub Actions",
    "CircleCI",
    "Travis CI",
    "Terraform",
    "Ansible",
    "Puppet",
    "Chef",
    "Prometheus",
    "Grafana",
    "ELK Stack",
    "Nginx",
    "Apache",
    "Istio",
    "ArgoCD",
    "Helm",
  ]

  // Machine Learning
  const mlSkills = [
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Reinforcement Learning",
    "Neural Networks",
    "Transformers",
    "BERT",
    "GPT",
    "Feature Engineering",
    "Data Mining",
    "A/B Testing",
    "Statistical Analysis",
    "Regression",
    "Classification",
    "Clustering",
    "Dimensionality Reduction",
  ]

  // Data Engineering
  const dataEngSkills = [
    "ETL",
    "Data Pipelines",
    "Apache Spark",
    "Apache Kafka",
    "Apache Airflow",
    "Hadoop",
    "Data Warehousing",
    "Data Modeling",
    "Data Lakes",
    "Talend",
    "dbt",
    "Databricks",
    "Redshift",
    "Snowflake",
    "Big Data",
    "Data Quality",
    "Data Governance",
    "Data Catalog",
  ]

  // Web Technologies
  const webSkills = [
    "REST API",
    "GraphQL",
    "WebSockets",
    "OAuth",
    "JWT",
    "SOAP",
    "Microservices",
    "Serverless",
    "Progressive Web Apps",
    "SPA",
    "SSR",
    "SSG",
    "Web Components",
    "WebAssembly",
    "Service Workers",
  ]

  // Mobile Development
  const mobileSkills = [
    "iOS",
    "Android",
    "Swift",
    "Kotlin",
    "Objective-C",
    "Java",
    "React Native",
    "Flutter",
    "Xamarin",
    "Ionic",
    "Cordova",
    "Mobile UI/UX",
    "App Store Optimization",
    "Push Notifications",
  ]

  // Security
  const securitySkills = [
    "Cybersecurity",
    "Penetration Testing",
    "Security Auditing",
    "Encryption",
    "Authentication",
    "Authorization",
    "OAuth",
    "SAML",
    "OWASP",
    "Firewall",
    "VPN",
    "Intrusion Detection",
    "Security Compliance",
    "Ethical Hacking",
  ]

  // Soft Skills
  const softSkills = [
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Critical Thinking",
    "Time Management",
    "Leadership",
    "Adaptability",
    "Creativity",
    "Emotional Intelligence",
    "Conflict Resolution",
    "Presentation Skills",
  ]

  // Tools
  const toolSkills = [
    "Git",
    "GitHub",
    "GitLab",
    "Bitbucket",
    "JIRA",
    "Confluence",
    "Trello",
    "Slack",
    "VS Code",
    "IntelliJ IDEA",
    "PyCharm",
    "Eclipse",
    "Postman",
    "Swagger",
    "Figma",
    "Sketch",
    "Adobe XD",
    "Tableau",
    "Power BI",
  ]

  // Methodologies
  const methodologySkills = [
    "Agile",
    "Scrum",
    "Kanban",
    "Waterfall",
    "DevOps",
    "CI/CD",
    "TDD",
    "BDD",
    "DDD",
    "Microservices Architecture",
    "Serverless Architecture",
    "Event-Driven Architecture",
    "Design Patterns",
    "SOLID Principles",
  ]

  const skillCategories = [
    { category: "Programming Languages", skills: programmingSkills },
    { category: "Frameworks", skills: frameworkSkills },
    { category: "Databases", skills: databaseSkills },
    { category: "Cloud Platforms", skills: cloudSkills },
    { category: "DevOps", skills: devopsSkills },
    { category: "Machine Learning", skills: mlSkills },
    { category: "Data Engineering", skills: dataEngSkills },
    { category: "Web Technologies", skills: webSkills },
    { category: "Mobile Development", skills: mobileSkills },
    { category: "Security", skills: securitySkills },
    { category: "Soft Skills", skills: softSkills },
    { category: "Tools", skills: toolSkills },
    { category: "Methodologies", skills: methodologySkills },
  ]

  // Insert skills by category
  for (const { category, skills } of skillCategories) {
    for (const skill of skills) {
      // Check if skill exists
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id")
        .eq("normalized_name", skill.toLowerCase())
        .maybeSingle()

      if (!existingSkill) {
        const { error } = await supabase.from("skills").insert({
          name: skill,
          normalized_name: skill.toLowerCase(),
          category: category,
          popularity: Math.floor(Math.random() * 100), // Random popularity for now
        })

        if (error) {
          console.error(`Error seeding skill ${skill}:`, error)
        }
      }
    }
  }

  console.log("Skills seeded successfully!")
}

async function seedEquivalents() {
  console.log("Seeding skill equivalents...")

  const equivalents = [
    { skill: "aws", equivalents: ["amazon web services", "amazon cloud"] },
    { skill: "azure", equivalents: ["microsoft azure", "microsoft cloud"] },
    { skill: "google cloud", equivalents: ["gcp", "google cloud platform"] },
    { skill: "javascript", equivalents: ["js", "ecmascript"] },
    { skill: "typescript", equivalents: ["ts"] },
    { skill: "python", equivalents: ["py"] },
    { skill: "java", equivalents: ["jvm"] },
    { skill: "c#", equivalents: ["csharp", "c sharp"] },
    { skill: "c++", equivalents: ["cpp", "cplusplus", "c plus plus"] },
    { skill: "postgresql", equivalents: ["postgres"] },
    { skill: "mysql", equivalents: ["my sql"] },
    { skill: "mongodb", equivalents: ["mongo"] },
    { skill: "react", equivalents: ["reactjs", "react.js"] },
    { skill: "angular", equivalents: ["angularjs", "angular.js"] },
    { skill: "vue.js", equivalents: ["vuejs", "vue"] },
    { skill: "node.js", equivalents: ["nodejs", "node"] },
    { skill: "machine learning", equivalents: ["ml"] },
    { skill: "artificial intelligence", equivalents: ["ai"] },
    { skill: "natural language processing", equivalents: ["nlp"] },
    { skill: "computer vision", equivalents: ["cv"] },
    { skill: "tensorflow", equivalents: ["tf"] },
    { skill: "kubernetes", equivalents: ["k8s"] },
    { skill: "docker", equivalents: ["containerization"] },
    { skill: "continuous integration", equivalents: ["ci"] },
    { skill: "continuous deployment", equivalents: ["cd"] },
    { skill: "ci/cd", equivalents: ["continuous integration/continuous deployment"] },
    { skill: "version control", equivalents: ["source control"] },
    { skill: "git", equivalents: ["version control"] },
    { skill: "amazon s3", equivalents: ["s3", "simple storage service"] },
    { skill: "amazon ec2", equivalents: ["ec2", "elastic compute cloud"] },
    { skill: "amazon rds", equivalents: ["rds", "relational database service"] },
    { skill: "amazon dynamodb", equivalents: ["dynamodb"] },
    { skill: "aws lambda", equivalents: ["lambda"] },
    { skill: "aws sagemaker", equivalents: ["sagemaker"] },
    { skill: "microsoft azure", equivalents: ["azure"] },
    { skill: "azure functions", equivalents: ["functions"] },
    { skill: "azure ml", equivalents: ["azure machine learning"] },
    { skill: "google cloud platform", equivalents: ["gcp", "google cloud"] },
    { skill: "google cloud functions", equivalents: ["cloud functions"] },
    { skill: "google ai platform", equivalents: ["ai platform"] },
    { skill: "big data", equivalents: ["large datasets", "large data"] },
    { skill: "data science", equivalents: ["data analytics", "analytics"] },
    { skill: "data engineering", equivalents: ["data infrastructure"] },
    { skill: "etl", equivalents: ["extract transform load", "data pipelines"] },
    { skill: "data warehousing", equivalents: ["data warehouse", "dwh"] },
    { skill: "data modeling", equivalents: ["database modeling"] },
    { skill: "data lakes", equivalents: ["data lake"] },
    { skill: "data quality", equivalents: ["data validation", "data cleaning"] },
    { skill: "data governance", equivalents: ["data management"] },
    { skill: "data catalog", equivalents: ["data dictionary"] },
    { skill: "apache spark", equivalents: ["spark"] },
    { skill: "apache kafka", equivalents: ["kafka"] },
    { skill: "apache airflow", equivalents: ["airflow"] },
    { skill: "apache hadoop", equivalents: ["hadoop"] },
    { skill: "snowflake", equivalents: ["snowflake data warehouse"] },
    { skill: "redshift", equivalents: ["amazon redshift"] },
    { skill: "databricks", equivalents: ["databricks platform"] },
    { skill: "dbt", equivalents: ["data build tool"] },
    { skill: "talend", equivalents: ["talend data integration"] },
    { skill: "rest api", equivalents: ["restful api", "rest"] },
    { skill: "graphql", equivalents: ["graph ql"] },
    { skill: "websockets", equivalents: ["web sockets"] },
    { skill: "oauth", equivalents: ["open authentication"] },
    { skill: "jwt", equivalents: ["json web token"] },
    { skill: "soap", equivalents: ["simple object access protocol"] },
    { skill: "microservices", equivalents: ["microservice architecture"] },
    { skill: "serverless", equivalents: ["serverless architecture", "faas"] },
    { skill: "progressive web apps", equivalents: ["pwa"] },
    { skill: "single page application", equivalents: ["spa"] },
    { skill: "server-side rendering", equivalents: ["ssr"] },
    { skill: "static site generation", equivalents: ["ssg"] },
    { skill: "web components", equivalents: ["custom elements"] },
    { skill: "webassembly", equivalents: ["wasm"] },
    { skill: "service workers", equivalents: ["sw"] },
    { skill: "ios", equivalents: ["iphone os", "apple mobile"] },
    { skill: "android", equivalents: ["android os", "google mobile"] },
    { skill: "react native", equivalents: ["rn"] },
    { skill: "flutter", equivalents: ["flutter sdk"] },
    { skill: "xamarin", equivalents: ["xamarin forms"] },
    { skill: "ionic", equivalents: ["ionic framework"] },
    { skill: "cordova", equivalents: ["apache cordova"] },
    { skill: "mobile ui/ux", equivalents: ["mobile user interface", "mobile user experience"] },
    { skill: "app store optimization", equivalents: ["aso"] },
    { skill: "push notifications", equivalents: ["mobile notifications"] },
    { skill: "cybersecurity", equivalents: ["information security", "infosec"] },
    { skill: "penetration testing", equivalents: ["pen testing", "ethical hacking"] },
    { skill: "security auditing", equivalents: ["security assessment"] },
    { skill: "encryption", equivalents: ["cryptography"] },
    { skill: "authentication", equivalents: ["auth"] },
    { skill: "authorization", equivalents: ["access control"] },
    { skill: "saml", equivalents: ["security assertion markup language"] },
    { skill: "owasp", equivalents: ["open web application security project"] },
    { skill: "firewall", equivalents: ["network security"] },
    { skill: "vpn", equivalents: ["virtual private network"] },
    { skill: "intrusion detection", equivalents: ["ids", "intrusion detection system"] },
    { skill: "security compliance", equivalents: ["compliance"] },
    { skill: "ethical hacking", equivalents: ["white hat hacking"] },
    { skill: "communication", equivalents: ["interpersonal communication"] },
    { skill: "teamwork", equivalents: ["collaboration"] },
    { skill: "problem solving", equivalents: ["analytical thinking"] },
    { skill: "critical thinking", equivalents: ["analytical reasoning"] },
    { skill: "time management", equivalents: ["prioritization"] },
    { skill: "leadership", equivalents: ["team leadership"] },
    { skill: "adaptability", equivalents: ["flexibility"] },
    { skill: "creativity", equivalents: ["innovation"] },
    { skill: "emotional intelligence", equivalents: ["eq"] },
    { skill: "conflict resolution", equivalents: ["dispute resolution"] },
    { skill: "presentation skills", equivalents: ["public speaking"] },
    { skill: "git", equivalents: ["git version control"] },
    { skill: "github", equivalents: ["github platform"] },
    { skill: "gitlab", equivalents: ["gitlab platform"] },
    { skill: "bitbucket", equivalents: ["bitbucket platform"] },
    { skill: "jira", equivalents: ["jira software"] },
    { skill: "confluence", equivalents: ["confluence wiki"] },
    { skill: "trello", equivalents: ["trello board"] },
    { skill: "slack", equivalents: ["slack messaging"] },
    { skill: "vs code", equivalents: ["visual studio code"] },
    { skill: "intellij idea", equivalents: ["intellij"] },
    { skill: "pycharm", equivalents: ["pycharm ide"] },
    { skill: "eclipse", equivalents: ["eclipse ide"] },
    { skill: "postman", equivalents: ["postman api"] },
    { skill: "swagger", equivalents: ["openapi"] },
    { skill: "figma", equivalents: ["figma design"] },
    { skill: "sketch", equivalents: ["sketch app"] },
    { skill: "adobe xd", equivalents: ["xd"] },
    { skill: "tableau", equivalents: ["tableau desktop"] },
    { skill: "power bi", equivalents: ["microsoft power bi"] },
    { skill: "agile", equivalents: ["agile methodology"] },
    { skill: "scrum", equivalents: ["scrum methodology"] },
    { skill: "kanban", equivalents: ["kanban methodology"] },
    { skill: "waterfall", equivalents: ["waterfall methodology"] },
    { skill: "devops", equivalents: ["development operations"] },
    { skill: "ci/cd", equivalents: ["continuous integration/continuous deployment"] },
    { skill: "tdd", equivalents: ["test driven development"] },
    { skill: "bdd", equivalents: ["behavior driven development"] },
    { skill: "ddd", equivalents: ["domain driven design"] },
    { skill: "microservices architecture", equivalents: ["microservices"] },
    { skill: "serverless architecture", equivalents: ["serverless"] },
    { skill: "event-driven architecture", equivalents: ["event sourcing"] },
    { skill: "design patterns", equivalents: ["software patterns"] },
    { skill: "solid principles", equivalents: ["solid"] },
  ]

  for (const { skill, equivalents: terms } of equivalents) {
    // Find the skill
    const { data: skillData } = await supabase
      .from("skills")
      .select("id")
      .eq("normalized_name", skill.toLowerCase())
      .maybeSingle()

    if (skillData) {
      for (const term of terms) {
        // Check if equivalent exists
        const { data: existingEquivalent } = await supabase
          .from("skill_equivalents")
          .select("id")
          .eq("skill_id", skillData.id)
          .eq("normalized_term", term.toLowerCase())
          .maybeSingle()

        if (!existingEquivalent) {
          const { error } = await supabase.from("skill_equivalents").insert({
            skill_id: skillData.id,
            equivalent_term: term,
            normalized_term: term.toLowerCase(),
          })

          if (error) {
            console.error(`Error seeding equivalent ${term} for ${skill}:`, error)
          }
        }
      }
    }
  }

  console.log("Skill equivalents seeded successfully!")
}

async function seedRelationships() {
  console.log("Seeding skill relationships...")

  const relationships = [
    // AWS relationships
    { parent: "aws", child: "aws lambda", type: "parent-child" },
    { parent: "aws", child: "aws ec2", type: "parent-child" },
    { parent: "aws", child: "aws s3", type: "parent-child" },
    { parent: "aws", child: "aws rds", type: "parent-child" },
    { parent: "aws", child: "aws dynamodb", type: "parent-child" },
    { parent: "aws", child: "aws sagemaker", type: "parent-child" },

    // Azure relationships
    { parent: "azure", child: "azure functions", type: "parent-child" },
    { parent: "azure", child: "azure ml", type: "parent-child" },

    // Google Cloud relationships
    { parent: "google cloud", child: "google cloud functions", type: "parent-child" },
    { parent: "google cloud", child: "google ai platform", type: "parent-child" },

    // Programming language relationships
    { parent: "python", child: "django", type: "used-with" },
    { parent: "python", child: "flask", type: "used-with" },
    { parent: "python", child: "pandas", type: "used-with" },
    { parent: "python", child: "numpy", type: "used-with" },
    { parent: "python", child: "tensorflow", type: "used-with" },
    { parent: "python", child: "pytorch", type: "used-with" },

    { parent: "javascript", child: "react", type: "used-with" },
    { parent: "javascript", child: "angular", type: "used-with" },
    { parent: "javascript", child: "vue.js", type: "used-with" },
    { parent: "javascript", child: "node.js", type: "used-with" },

    { parent: "typescript", child: "react", type: "used-with" },
    { parent: "typescript", child: "angular", type: "used-with" },
    { parent: "typescript", child: "vue.js", type: "used-with" },
    { parent: "typescript", child: "node.js", type: "used-with" },

    // Database relationships
    { parent: "sql", child: "postgresql", type: "used-with" },
    { parent: "sql", child: "mysql", type: "used-with" },
    { parent: "sql", child: "sql server", type: "used-with" },
    { parent: "sql", child: "oracle", type: "used-with" },

    // Machine Learning relationships
    { parent: "machine learning", child: "deep learning", type: "parent-child" },
    { parent: "machine learning", child: "natural language processing", type: "parent-child" },
    { parent: "machine learning", child: "computer vision", type: "parent-child" },
    { parent: "machine learning", child: "reinforcement learning", type: "parent-child" },

    { parent: "deep learning", child: "neural networks", type: "parent-child" },
    { parent: "deep learning", child: "tensorflow", type: "used-with" },
    { parent: "deep learning", child: "pytorch", type: "used-with" },

    { parent: "natural language processing", child: "transformers", type: "used-with" },
    { parent: "natural language processing", child: "bert", type: "used-with" },
    { parent: "natural language processing", child: "gpt", type: "used-with" },

    // Data Engineering relationships
    { parent: "data engineering", child: "etl", type: "parent-child" },
    { parent: "data engineering", child: "data pipelines", type: "parent-child" },
    { parent: "data engineering", child: "data warehousing", type: "parent-child" },
    { parent: "data engineering", child: "data modeling", type: "parent-child" },
    { parent: "data engineering", child: "data lakes", type: "parent-child" },

    { parent: "etl", child: "apache airflow", type: "used-with" },
    { parent: "etl", child: "talend", type: "used-with" },
    { parent: "etl", child: "apache spark", type: "used-with" },

    { parent: "data pipelines", child: "apache airflow", type: "used-with" },
    { parent: "data pipelines", child: "apache kafka", type: "used-with" },

    { parent: "data warehousing", child: "snowflake", type: "used-with" },
    { parent: "data warehousing", child: "redshift", type: "used-with" },

    // Big Data relationships
    { parent: "big data", child: "apache spark", type: "used-with" },
    { parent: "big data", child: "apache hadoop", type: "used-with" },
    { parent: "big data", child: "apache kafka", type: "used-with" },

    // Web Development relationships
    { parent: "web technologies", child: "rest api", type: "parent-child" },
    { parent: "web technologies", child: "graphql", type: "parent-child" },
    { parent: "web technologies", child: "websockets", type: "parent-child" },

    // DevOps relationships
    { parent: "devops", child: "docker", type: "used-with" },
    { parent: "devops", child: "kubernetes", type: "used-with" },
    { parent: "devops", child: "ci/cd", type: "parent-child" },

    { parent: "ci/cd", child: "jenkins", type: "used-with" },
    { parent: "ci/cd", child: "github actions", type: "used-with" },
    { parent: "ci/cd", child: "circleci", type: "used-with" },

    // Mobile Development relationships
    { parent: "mobile development", child: "ios", type: "parent-child" },
    { parent: "mobile development", child: "android", type: "parent-child" },
    { parent: "mobile development", child: "react native", type: "used-with" },
    { parent: "mobile development", child: "flutter", type: "used-with" },

    // Security relationships
    { parent: "security", child: "cybersecurity", type: "parent-child" },
    { parent: "security", child: "penetration testing", type: "parent-child" },
    { parent: "security", child: "encryption", type: "parent-child" },
    { parent: "security", child: "authentication", type: "parent-child" },
    { parent: "security", child: "authorization", type: "parent-child" },
  ]

  for (const { parent, child, type } of relationships) {
    // Find parent skill
    const { data: parentSkill } = await supabase
      .from("skills")
      .select("id")
      .eq("normalized_name", parent.toLowerCase())
      .maybeSingle()

    // Find child skill
    const { data: childSkill } = await supabase
      .from("skills")
      .select("id")
      .eq("normalized_name", child.toLowerCase())
      .maybeSingle()

    if (parentSkill && childSkill) {
      // Check if relationship exists
      const { data: existingRelationship } = await supabase
        .from("skill_relationships")
        .select("id")
        .eq("parent_skill_id", parentSkill.id)
        .eq("child_skill_id", childSkill.id)
        .maybeSingle()

      if (!existingRelationship) {
        const { error } = await supabase.from("skill_relationships").insert({
          parent_skill_id: parentSkill.id,
          child_skill_id: childSkill.id,
          relationship_type: type,
          strength: 1.0,
        })

        if (error) {
          console.error(`Error seeding relationship ${parent} -> ${child}:`, error)
        }
      }
    }
  }

  console.log("Skill relationships seeded successfully!")
}

async function run() {
  console.log("Starting skill taxonomy database setup...")

  const tablesCreated = await createTables()
  if (!tablesCreated) {
    console.error("Failed to create tables. Exiting.")
    return
  }

  await seedCategories()
  await seedSkills()
  await seedEquivalents()
  await seedRelationships()

  console.log("Skill taxonomy database setup completed successfully!")
}

// Run the setup
run().catch((error) => {
  console.error("Error in setup:", error)
})

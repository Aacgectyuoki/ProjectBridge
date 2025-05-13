import { exec } from "child_process"
import path from "path"

// Path to the setup script
const setupScriptPath = path.join(__dirname, "setup-skill-taxonomy.ts")

// Run the setup script using ts-node
const command = `npx ts-node ${setupScriptPath}`

console.log("Running skill taxonomy database setup...")

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`)
    return
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`)
    return
  }

  console.log(stdout)
  console.log("Skill taxonomy database setup completed.")
})

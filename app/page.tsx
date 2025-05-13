import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, Code, FileText } from "lucide-react"
import { ResponsiveContainer } from "@/components/responsive-container"

export default function Home() {
  return (
    <ResponsiveContainer>
      <div className="flex flex-col space-y-8">
        {/* Removed the "Bridge Your Skills Gap" section */}
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            <section className="w-full py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px:6">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                        Bridge the gap between your skills and dream jobs
                      </h1>
                      <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Upload your resume, paste a job description, and get personalized project ideas that showcase
                        the skills employers are looking for.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-[400px]:flex-row">
                      <Link href="/dashboard">
                        <Button size="lg" className="gap-1.5">
                          Get Started
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-[500px] aspect-video rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 p-6 shadow-lg">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="space-y-4 w-full max-w-[400px]">
                          <div className="h-24 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center">
                            <FileText className="h-10 w-10 text-indigo-500" />
                          </div>
                          <div className="flex gap-4">
                            <div className="h-32 w-1/2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center">
                              <Briefcase className="h-10 w-10 text-indigo-500" />
                            </div>
                            <div className="h-32 w-1/2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center">
                              <Code className="h-10 w-10 text-indigo-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
              <div className="container px-4 md:px:6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                    <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Everything you need to bridge the gap between your current skills and your dream job
                    </p>
                  </div>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-12">
                  <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                    <div className="rounded-full bg-indigo-100 p-3">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold">Gap Analysis</h3>
                    <p className="text-center text-gray-500">
                      Identify the skills and experience gaps between your resume and job requirements
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                    <div className="rounded-full bg-indigo-100 p-3">
                      <Code className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold">Project Generator</h3>
                    <p className="text-center text-gray-500">
                      Get personalized project ideas that demonstrate the skills employers are looking for
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                    <div className="rounded-full bg-indigo-100 p-3">
                      <Briefcase className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold">Interview Prep</h3>
                    <p className="text-center text-gray-500">
                      Build projects you can confidently discuss in interviews to showcase your abilities
                    </p>
                  </div>
                </div>
              </div>
            </section>
            <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px:6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
                    <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Four simple steps to bridge the gap between your skills and dream job
                    </p>
                  </div>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12 mt-12">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                      1
                    </div>
                    <h3 className="text-xl font-bold">Upload Resume</h3>
                    <p className="text-center text-gray-500">Upload your resume or paste your LinkedIn profile</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                      2
                    </div>
                    <h3 className="text-xl font-bold">Add Job Description</h3>
                    <p className="text-center text-gray-500">Paste the job description you're interested in</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                      3
                    </div>
                    <h3 className="text-xl font-bold">Analyze Gaps</h3>
                    <p className="text-center text-gray-500">We identify the skills and experience gaps</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                      4
                    </div>
                    <h3 className="text-xl font-bold">Get Projects</h3>
                    <p className="text-center text-gray-500">Browse personalized project ideas to build your skills</p>
                  </div>
                </div>
              </div>
            </section>
          </main>
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <p className="text-sm text-gray-500">© 2025 ProjectBridge. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="#" className="text-sm text-gray-500 hover:underline underline-offset-4">
                  Terms
                </Link>
                <Link href="#" className="text-sm text-gray-500 hover:underline underline-offset-4">
                  Privacy
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ResponsiveContainer>
  )
}

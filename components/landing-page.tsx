import Link from "next/link"

export default function LandingPage() {
  return (
    <div>
      <main className="relative overflow-hidden">
        <div className="relative isolate pt-14 lg:pt-20">
          {/* Hero section */}
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl py-16 lg:py-24">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  ProjectBridge: Connect, Collaborate, and Conquer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Streamline your project workflow with our intuitive platform. Connect with collaborators, manage
                  tasks, and achieve your goals efficiently.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    href="/sign-up"
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Get started
                  </Link>
                  <a href="#how-it-works" className="text-sm font-semibold leading-6 text-gray-900">
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Features section */}
          <div id="features" className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:text-center">
                <h2 className="text-base font-semibold leading-7 text-indigo-600">Effortless Collaboration</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Everything you need to build amazing projects
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Our platform provides a suite of tools designed to enhance collaboration and streamline your project
                  management process.
                </p>
              </div>
              <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                  <div className="flex flex-col">
                    <dt className="text-base font-semibold leading-7 text-gray-900">Real-time Communication</dt>
                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      Stay connected with your team through instant messaging and video conferencing.
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-base font-semibold leading-7 text-gray-900">Task Management</dt>
                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      Assign tasks, set deadlines, and track progress with ease.
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-base font-semibold leading-7 text-gray-900">File Sharing</dt>
                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      Securely share files and documents with your team members.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* How it works section */}
          <div id="how-it-works" className="bg-gray-100 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:text-center">
                <h2 className="text-base font-semibold leading-7 text-indigo-600">Simple and Intuitive</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Get started in minutes
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Our platform is designed to be user-friendly and easy to navigate, so you can focus on what matters
                  most: your projects.
                </p>
              </div>
              <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                <ol className="divide-y divide-gray-900/5">
                  <li className="py-4">
                    <div className="group relative flex gap-x-6">
                      <div className="mt-1 flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-indigo-500 group-hover:bg-indigo-600">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 21a9.004 9.004 0 008.716-4.037m-7.328 1.234a5.972 5.972 0 01-1.972-2.93m6.328 1.234a2.992 2.992 0 00-1.972-2.93"
                          />
                        </svg>
                      </div>
                      <div className="flex-auto">
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Create an account</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          Sign up for a free account and start exploring our platform.
                        </p>
                      </div>
                    </div>
                  </li>
                  <li className="py-4">
                    <div className="group relative flex gap-x-6">
                      <div className="mt-1 flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-indigo-500 group-hover:bg-indigo-600">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a3 3 0 00-3-3H7.5a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5m-3-3L6 6m12 12L6 6"
                          />
                        </svg>
                      </div>
                      <div className="flex-auto">
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Create a project</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          Set up your project and invite your team members to collaborate.
                        </p>
                      </div>
                    </div>
                  </li>
                  <li className="py-4">
                    <div className="group relative flex gap-x-6">
                      <div className="mt-1 flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-indigo-500 group-hover:bg-indigo-600">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 6h9.75M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                          />
                        </svg>
                      </div>
                      <div className="flex-auto">
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Start collaborating</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          Start managing tasks, sharing files, and communicating with your team.
                        </p>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

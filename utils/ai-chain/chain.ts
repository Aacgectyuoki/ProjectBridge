/**
 * Represents a step in a processing chain
 */
export type ChainStep<T> = (input: T) => Promise<T>

/**
 * Orchestrates a sequence of processing steps
 */
export class Chain<T = any> {
  private steps: Array<{
    step: ChainStep<T>
    name: string
  }>
  private name: string

  /**
   * Creates a new processing chain
   * @param name Optional name for logging purposes
   */
  constructor(name = "unnamed-chain") {
    this.steps = []
    this.name = name
  }

  /**
   * Adds a step to the chain
   * @param step Function that processes the input and returns a promise
   * @param name Optional name for the step (for logging)
   * @returns This chain for method chaining
   */
  addStep(step: ChainStep<T>, name = `step-${this.steps.length + 1}`): Chain<T> {
    this.steps.push({ step, name })
    console.log(`Chain: Added step "${name}" to chain "${this.name}"`)
    return this
  }

  /**
   * Runs the chain with the given input
   * @param initialInput Initial input to the chain
   * @returns Final output after all steps have been processed
   */
  async run(initialInput: T): Promise<T> {
    console.log(`Chain: Starting chain "${this.name}" with input:`, initialInput)

    let currentInput = initialInput
    const startTime = performance.now()

    for (const { step, name } of this.steps) {
      console.log(`Chain: Running step "${name}" in chain "${this.name}"`)
      const stepStartTime = performance.now()

      try {
        currentInput = await step(currentInput)
        const stepDuration = performance.now() - stepStartTime
        console.log(`Chain: Completed step "${name}" in ${stepDuration.toFixed(2)}ms`)
      } catch (error) {
        const stepDuration = performance.now() - stepStartTime
        console.error(`Chain: Step "${name}" failed after ${stepDuration.toFixed(2)}ms:`, error)
        throw new Error(`Chain step "${name}" failed: ${error.message}`)
      }
    }

    const totalDuration = performance.now() - startTime
    console.log(`Chain: Completed chain "${this.name}" in ${totalDuration.toFixed(2)}ms`)

    return currentInput
  }

  /**
   * Gets the name of this chain
   */
  getName(): string {
    return this.name
  }
}

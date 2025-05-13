/**
 * Manages conversation history for stateful interactions
 */
export class ConversationMemory {
  private history: Array<{ role: string; content: string }> = []
  private name: string

  /**
   * Creates a new conversation memory
   * @param name Optional name for logging purposes
   */
  constructor(name = "unnamed-memory") {
    this.name = name
    console.log(`ConversationMemory: Created new memory "${name}"`)
  }

  /**
   * Adds a message to the conversation history
   * @param role Role of the message sender (system, user, assistant)
   * @param content Content of the message
   */
  addMessage(role: "system" | "user" | "assistant", content: string): void {
    this.history.push({ role, content })
    console.log(`ConversationMemory: Added ${role} message to memory "${this.name}"`)
  }

  /**
   * Gets all messages in the conversation history
   * @returns Array of messages
   */
  getMessages(): Array<{ role: string; content: string }> {
    return [...this.history]
  }

  /**
   * Clears the conversation history
   */
  clear(): void {
    this.history = []
    console.log(`ConversationMemory: Cleared memory "${this.name}"`)
  }

  /**
   * Gets the name of this memory
   */
  getName(): string {
    return this.name
  }
}

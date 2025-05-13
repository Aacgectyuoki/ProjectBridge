export interface Document {
  text: string
  metadata: Record<string, any>
}

export class DocumentProcessor {
  /**
   * Loads text and splits it into chunks
   * @param text The text to chunk
   * @param chunkSize The maximum size of each chunk
   * @param overlap The number of characters to overlap between chunks
   * @returns An array of document chunks
   */
  static async loadAndChunk(text: string, chunkSize = 2000, overlap = 200): Promise<Document[]> {
    console.log(
      `DocumentProcessor: Chunking text of length ${text.length} into chunks of size ${chunkSize} with overlap ${overlap}`,
    )

    if (text.length <= chunkSize) {
      return [
        {
          text,
          metadata: {
            chunkIndex: 0,
            totalChunks: 1,
            isFirstChunk: true,
            isLastChunk: true,
          },
        },
      ]
    }

    const chunks: Document[] = []
    let startIndex = 0

    while (startIndex < text.length) {
      let endIndex = startIndex + chunkSize

      // Adjust end index to avoid cutting words
      if (endIndex < text.length) {
        // Find the next space after the chunk size
        const nextSpace = text.indexOf(" ", endIndex)
        if (nextSpace !== -1 && nextSpace - endIndex < 100) {
          endIndex = nextSpace
        }
      }

      chunks.push({
        text: text.substring(startIndex, Math.min(endIndex, text.length)),
        metadata: {
          chunkIndex: chunks.length,
          totalChunks: Math.ceil(text.length / (chunkSize - overlap)),
          isFirstChunk: startIndex === 0,
          isLastChunk: endIndex >= text.length,
        },
      })

      // Move to the next chunk, accounting for overlap
      startIndex = endIndex - overlap
    }

    // Update total chunks now that we know the actual count
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length
    })

    console.log(`DocumentProcessor: Created ${chunks.length} chunks`)
    return chunks
  }
}

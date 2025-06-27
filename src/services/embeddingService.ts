import { getOpenAIService } from './openaiService';

export interface TextChunk {
  content: string;
  metadata?: Record<string, any>;
}

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

export class EmbeddingService {
  private static readonly CHUNK_SIZE = 1000;
  private static readonly CHUNK_OVERLAP = 200;

  /**
   * Split text into chunks with overlap
   */
  static chunkText(text: string, chunkSize: number = this.CHUNK_SIZE, overlap: number = this.CHUNK_OVERLAP): TextChunk[] {
    const chunks: TextChunk[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentSize = 0;
    
    for (const sentence of sentences) {
      const sentenceWithPunctuation = sentence.trim() + '.';
      const sentenceSize = sentenceWithPunctuation.length;
      
      // If adding this sentence would exceed chunk size, save current chunk
      if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunkIndex: chunks.length,
            wordCount: currentChunk.split(/\s+/).length,
          }
        });
        
        // Start new chunk with overlap from previous chunk
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.floor(overlap / 6)); // Approximate overlap
        currentChunk = overlapWords.join(' ') + ' ' + sentenceWithPunctuation;
        currentSize = currentChunk.length;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
        currentSize += sentenceSize;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkIndex: chunks.length,
          wordCount: currentChunk.split(/\s+/).length,
        }
      });
    }
    
    return chunks;
  }

  /**
   * Generate embeddings for text chunks
   */
  static async generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
    const openaiService = getOpenAIService();
    const embeddedChunks: EmbeddedChunk[] = [];
    
    // Process chunks in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (chunk) => {
        try {
          const embedding = await openaiService.generateEmbedding(chunk.content);
          
          // Validate embedding dimensions
          if (!this.validateEmbeddingDimensions(embedding, 1536)) {
            throw new Error(`Invalid embedding dimensions: expected 1536, got ${embedding.length}`);
          }
          
          return {
            ...chunk,
            embedding,
          };
        } catch (error) {
          console.error(`Failed to generate embedding for chunk ${chunk.metadata?.chunkIndex}:`, error);
          throw error;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      embeddedChunks.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return embeddedChunks;
  }

  /**
   * Process text file content into chunks and embeddings
   */
  static async processTextContent(content: string, metadata: Record<string, any> = {}): Promise<EmbeddedChunk[]> {
    // Clean and normalize the text
    const cleanedContent = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (cleanedContent.length === 0) {
      throw new Error('No text content found to process');
    }
    
    // Split into chunks
    const chunks = this.chunkText(cleanedContent);
    
    // Add file metadata to each chunk
    const chunksWithMetadata = chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        ...metadata,
      }
    }));
    
    // Generate embeddings
    const embeddedChunks = await this.generateEmbeddings(chunksWithMetadata);
    
    return embeddedChunks;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      console.warn(`Vector dimension mismatch: query=${a.length}, stored=${b.length}. Skipping similarity calculation.`);
      return 0; // Return 0 similarity for mismatched dimensions
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Validate embedding dimensions
   */
  static validateEmbeddingDimensions(embedding: number[], expectedDimension: number = 1536): boolean {
    return embedding && embedding.length === expectedDimension;
  }
}
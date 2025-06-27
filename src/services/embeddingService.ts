import { getOpenAIService } from './openaiService';

export interface TextChunk {
  content: string;
  metadata?: Record<string, unknown>;
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
    console.log(`EmbeddingService: Starting to generate embeddings for ${chunks.length} chunks`);
    const openaiService = getOpenAIService();
    const embeddedChunks: EmbeddedChunk[] = [];
    
    // Process chunks in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`EmbeddingService: Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} with ${batch.length} chunks`);
      
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        try {
          console.log(`EmbeddingService: Generating embedding for chunk ${i + batchIndex + 1}/${chunks.length} (${chunk.content.length} chars)`);
          
          const embedding = await openaiService.generateEmbedding(chunk.content);
          
          console.log(`EmbeddingService: Received embedding with ${embedding.length} dimensions for chunk ${i + batchIndex + 1}`);
          
          // Validate embedding dimensions and quality
          if (!this.validateEmbeddingQuality(embedding)) {
            console.error(`EmbeddingService: Invalid embedding quality for chunk ${i + batchIndex + 1}: expected 1536 dimensions, got ${embedding.length}`);
            throw new Error(`Invalid embedding quality: expected 1536 dimensions, got ${embedding.length}`);
          }
          
          console.log(`EmbeddingService: Successfully validated embedding for chunk ${i + batchIndex + 1}`);
          
          return {
            ...chunk,
            embedding,
          };
        } catch (error) {
          console.error(`EmbeddingService: Failed to generate embedding for chunk ${i + batchIndex + 1}:`, error);
          throw error;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      embeddedChunks.push(...batchResults);
      
      console.log(`EmbeddingService: Completed batch ${Math.floor(i / batchSize) + 1}, total processed: ${embeddedChunks.length}`);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`EmbeddingService: Successfully generated embeddings for all ${embeddedChunks.length} chunks`);
    return embeddedChunks;
  }

  /**
   * Validate embedding quality (dimensions and data integrity)
   */
  static validateEmbeddingQuality(embedding: number[]): boolean {
    // Check if embedding exists and is an array
    if (!embedding || !Array.isArray(embedding)) {
      return false;
    }

    // Check if dimensions are correct (1536 for text-embedding-3-large)
    if (embedding.length !== 1536) {
      return false;
    }

    // Check if all values are numbers and within reasonable range
    // Embeddings should be floating point numbers, typically between -1 and 1
    for (const value of embedding) {
      if (typeof value !== 'number' || !isFinite(value)) {
        return false;
      }
      
      // Check for unreasonably large values that might indicate corruption
      if (Math.abs(value) > 10) {
        return false;
      }
    }

    return true;
  }

  /**
   * Process text file content into chunks and embeddings
   */
  static async processTextContent(content: string, metadata: Record<string, unknown> = {}): Promise<EmbeddedChunk[]> {
    console.log(`EmbeddingService: Starting to process text content (${content.length} characters)`);
    
    // Clean and normalize the text
    const cleanedContent = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    console.log(`EmbeddingService: Cleaned content length: ${cleanedContent.length} characters`);
    
    if (cleanedContent.length === 0) {
      throw new Error('No text content found to process');
    }
    
    // Split into chunks
    const chunks = this.chunkText(cleanedContent);
    console.log(`EmbeddingService: Split content into ${chunks.length} chunks`);
    
    // Log chunk details
    chunks.forEach((chunk, index) => {
      console.log(`EmbeddingService: Chunk ${index + 1}: ${chunk.content.length} chars, ${chunk.content.split(/\s+/).length} words`);
    });
    
    // Add file metadata to each chunk
    const chunksWithMetadata = chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        ...metadata,
      }
    }));
    
    console.log(`EmbeddingService: Added metadata to chunks, starting embedding generation...`);
    
    // Generate embeddings
    const embeddedChunks = await this.generateEmbeddings(chunksWithMetadata);
    
    console.log(`EmbeddingService: Successfully processed text content into ${embeddedChunks.length} embedded chunks`);
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
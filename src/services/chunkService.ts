import { supabase } from '../lib/supabase';
import { EmbeddingService } from './embeddingService';
import type { EmbeddedChunk } from './embeddingService';

export interface DatabaseChunk {
  id: string;
  content: string;
  embedding: number[];
  file_id?: string;
  site_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChunkSearchResult {
  chunk: DatabaseChunk;
  similarity: number;
}

export class ChunkService {
  /**
   * Clean up chunks with invalid embedding dimensions
   */
  static async cleanupInvalidChunks(contextId: string): Promise<number> {
    console.log('ChunkService: Starting cleanup of invalid chunks for context:', contextId);
    
    try {
      // Get all chunks for this context
      const { data: fileChunks, error: fileError } = await supabase
        .from('chunks')
        .select(`
          id,
          embedding,
          files!inner(context_id)
        `)
        .eq('files.context_id', contextId)
        .not('file_id', 'is', null);

      const { data: siteChunks, error: siteError } = await supabase
        .from('chunks')
        .select(`
          id,
          embedding,
          sites!inner(context_id)
        `)
        .eq('sites.context_id', contextId)
        .not('site_id', 'is', null);

      if (fileError && siteError) {
        throw new Error(`Failed to fetch chunks: ${fileError?.message || siteError?.message}`);
      }

      const allChunks = [...(fileChunks || []), ...(siteChunks || [])];
      
      // Find chunks with invalid dimensions or corrupted embeddings
      const invalidChunkIds = allChunks
        .filter(chunk => !this.isValidEmbedding(chunk.embedding))
        .map(chunk => chunk.id);

      if (invalidChunkIds.length === 0) {
        console.log('ChunkService: No invalid chunks found');
        return 0;
      }

      console.log(`ChunkService: Found ${invalidChunkIds.length} chunks with invalid embeddings, deleting...`);

      // Delete invalid chunks
      const { error: deleteError } = await supabase
        .from('chunks')
        .delete()
        .in('id', invalidChunkIds);

      if (deleteError) {
        throw new Error(`Failed to delete invalid chunks: ${deleteError.message}`);
      }

      console.log(`ChunkService: Successfully deleted ${invalidChunkIds.length} invalid chunks`);
      return invalidChunkIds.length;
    } catch (error) {
      console.error('ChunkService: Failed to cleanup invalid chunks:', error);
      throw error;
    }
  }

  /**
   * Validate if an embedding is valid (correct dimensions and not corrupted)
   */
  private static isValidEmbedding(embedding: unknown): boolean {
    // Parse the embedding first (handles both arrays and strings)
    const parsedEmbedding = this.parseEmbedding(embedding);
    
    // Check if parsing was successful
    if (parsedEmbedding.length === 0) {
      return false;
    }

    // Check if dimensions are correct (1536 for text-embedding-3-large)
    if (parsedEmbedding.length !== 1536) {
      return false;
    }

    // Check if all values are numbers and within reasonable range
    // Embeddings should be floating point numbers, typically between -1 and 1
    for (const value of parsedEmbedding) {
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
   * Save chunks to database
   */
  static async saveChunks(
    chunks: EmbeddedChunk[], 
    fileId?: string, 
    siteId?: string
  ): Promise<DatabaseChunk[]> {
    console.log(`ChunkService: Starting to save ${chunks.length} chunks to database`);
    console.log(`ChunkService: File ID: ${fileId}, Site ID: ${siteId}`);
    
    // Validate all embeddings before saving
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`ChunkService: Validating chunk ${i + 1}/${chunks.length} with embedding length: ${chunk.embedding?.length || 'undefined'}`);
      
      if (!this.isValidEmbedding(chunk.embedding)) {
        console.error(`ChunkService: Invalid embedding for chunk ${i + 1}: expected 1536 dimensions, got ${chunk.embedding?.length || 'undefined'}`);
        throw new Error(`Invalid embedding: expected 1536 dimensions, got ${chunk.embedding?.length || 'undefined'}`);
      }
      
      console.log(`ChunkService: Chunk ${i + 1} validation passed`);
    }
    
    console.log(`ChunkService: All chunks validated, preparing for database insertion`);
    
    const chunksToInsert = chunks.map(chunk => ({
      content: chunk.content,
      embedding: chunk.embedding,
      file_id: fileId || null,
      site_id: siteId || null,
      metadata: chunk.metadata || {},
    }));

    console.log(`ChunkService: Inserting ${chunksToInsert.length} chunks into database...`);
    
    // Debug: Log embedding details before insertion
    chunksToInsert.forEach((chunk, index) => {
      console.log(`ChunkService: Before insertion - Chunk ${index + 1}:`, {
        contentLength: chunk.content.length,
        embeddingLength: chunk.embedding.length,
        embeddingFirstFew: chunk.embedding.slice(0, 5),
        embeddingLastFew: chunk.embedding.slice(-5)
      });
    });

    const { data, error } = await supabase
      .from('chunks')
      .insert(chunksToInsert)
      .select();

    if (error) {
      console.error(`ChunkService: Failed to save chunks:`, error);
      throw new Error(`Failed to save chunks: ${error.message}`);
    }

    console.log(`ChunkService: Successfully saved ${data?.length || 0} chunks to database`);
    
    // Debug: Log embedding details after retrieval
    if (data && data.length > 0) {
      data.forEach((chunk, index) => {
        console.log(`ChunkService: After retrieval - Chunk ${index + 1}:`, {
          id: chunk.id,
          contentLength: chunk.content.length,
          embeddingLength: chunk.embedding.length,
          embeddingFirstFew: chunk.embedding.slice(0, 5),
          embeddingLastFew: chunk.embedding.slice(-5)
        });
      });
    }
    
    return data || [];
  }

  /**
   * Delete chunks by file ID
   */
  static async deleteChunksByFileId(fileId: string): Promise<void> {
    const { error } = await supabase
      .from('chunks')
      .delete()
      .eq('file_id', fileId);

    if (error) {
      throw new Error(`Failed to delete chunks: ${error.message}`);
    }
  }

  /**
   * Delete chunks by site ID
   */
  static async deleteChunksBySiteId(siteId: string): Promise<void> {
    const { error } = await supabase
      .from('chunks')
      .delete()
      .eq('site_id', siteId);

    if (error) {
      throw new Error(`Failed to delete chunks: ${error.message}`);
    }
  }

  /**
   * Search for similar chunks using vector similarity (for chat workflow)
   * This method skips validation to avoid issues with existing chunks
   */
  static async searchSimilarChunksForChat(
    contextId: string,
    queryEmbedding: number[],
    limit: number = 5
  ): Promise<ChunkSearchResult[]> {
    console.log('ChunkService: Searching for chunks in context:', contextId);
    console.log('ChunkService: Query embedding dimensions:', queryEmbedding.length);
    
    // Get all chunks for files and sites in this context
    const { data: fileChunks, error: fileError } = await supabase
      .from('chunks')
      .select(`
        *,
        files!inner(context_id)
      `)
      .eq('files.context_id', contextId)
      .not('file_id', 'is', null);

    const { data: siteChunks, error: siteError } = await supabase
      .from('chunks')
      .select(`
        *,
        sites!inner(context_id)
      `)
      .eq('sites.context_id', contextId)
      .not('site_id', 'is', null);

    console.log('ChunkService: File chunks found:', fileChunks?.length || 0);
    console.log('ChunkService: Site chunks found:', siteChunks?.length || 0);

    if (fileError && siteError) {
      throw new Error(`Failed to search chunks: ${fileError.message || siteError.message}`);
    }

    const chunks = [...(fileChunks || []), ...(siteChunks || [])];

    if (!chunks || chunks.length === 0) {
      console.log('ChunkService: No chunks found for context');
      return [];
    }

    console.log('ChunkService: Total chunks retrieved:', chunks.length);
    
    // Debug: Log details of each chunk
    chunks.forEach((chunk, index) => {
      const parsedEmbedding = this.parseEmbedding(chunk.embedding);
      console.log(`ChunkService: Chunk ${index + 1}:`, {
        id: chunk.id,
        contentLength: chunk.content?.length || 0,
        embeddingLength: parsedEmbedding.length,
        embeddingType: typeof chunk.embedding,
        fileId: chunk.file_id,
        siteId: chunk.site_id
      });
    });

    // Calculate similarity scores for chunks with matching dimensions
    const validResults: ChunkSearchResult[] = [];
    
    for (const chunk of chunks) {
      console.log(`ChunkService: Processing chunk ${chunk.id} for similarity calculation`);
      
      // Parse the embedding (handles both arrays and strings)
      const parsedEmbedding = this.parseEmbedding(chunk.embedding);
      
      if (parsedEmbedding.length === 0) {
        console.warn(`ChunkService: Skipping chunk ${chunk.id} - failed to parse embedding`);
        continue;
      }
      
      // Only check if dimensions match, don't validate quality
      if (parsedEmbedding.length !== queryEmbedding.length) {
        console.warn(`ChunkService: Skipping chunk ${chunk.id} due to dimension mismatch: expected ${queryEmbedding.length}, got ${parsedEmbedding.length}`);
        continue;
      }
      
      try {
        console.log(`ChunkService: Calculating similarity for chunk ${chunk.id}`);
        const similarity = EmbeddingService.cosineSimilarity(
          queryEmbedding,
          parsedEmbedding
        );
        
        console.log(`ChunkService: Similarity score for chunk ${chunk.id}: ${similarity}`);
        
        validResults.push({
          chunk: {
            id: chunk.id,
            content: chunk.content,
            embedding: parsedEmbedding, // Use the parsed embedding
            file_id: chunk.file_id,
            site_id: chunk.site_id,
            metadata: chunk.metadata,
            created_at: chunk.created_at,
          },
          similarity,
        });
      } catch (error) {
        console.warn(`ChunkService: Error calculating similarity for chunk ${chunk.id}:`, error);
        continue;
      }
    }

    console.log('ChunkService: Valid results found:', validResults.length);
    
    // Sort by similarity (highest first) and return top results
    const topResults = validResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
      
    console.log('ChunkService: Returning top', topResults.length, 'results');
    if (topResults.length > 0) {
      console.log('ChunkService: Best similarity score:', (topResults[0].similarity * 100).toFixed(1) + '%');
    }
    
    return topResults;
  }

  /**
   * Get chunks by file ID
   */
  static async getChunksByFileId(fileId: string): Promise<DatabaseChunk[]> {
    const { data, error } = await supabase
      .from('chunks')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get chunks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get total chunk count for a context
   */
  static async getContextChunkCount(contextId: string): Promise<number> {
    const { count, error } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true })
      .eq('files.context_id', contextId);

    if (error) {
      console.error('Failed to get chunk count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Clean up all invalid chunks across all contexts
   * This is useful for fixing corrupted embeddings in the database
   */
  static async cleanupAllInvalidChunks(): Promise<number> {
    console.log('ChunkService: Starting cleanup of all invalid chunks...');
    
    try {
      // Get all chunks
      const { data: allChunks, error } = await supabase
        .from('chunks')
        .select('id, embedding');

      if (error) {
        throw new Error(`Failed to fetch chunks: ${error.message}`);
      }

      if (!allChunks || allChunks.length === 0) {
        console.log('ChunkService: No chunks found');
        return 0;
      }

      // Find chunks with invalid embeddings
      const invalidChunkIds = allChunks
        .filter(chunk => !this.isValidEmbedding(chunk.embedding))
        .map(chunk => chunk.id);

      if (invalidChunkIds.length === 0) {
        console.log('ChunkService: No invalid chunks found');
        return 0;
      }

      console.log(`ChunkService: Found ${invalidChunkIds.length} invalid chunks out of ${allChunks.length} total chunks`);

      // Delete invalid chunks
      const { error: deleteError } = await supabase
        .from('chunks')
        .delete()
        .in('id', invalidChunkIds);

      if (deleteError) {
        throw new Error(`Failed to delete invalid chunks: ${deleteError.message}`);
      }

      console.log(`ChunkService: Successfully deleted ${invalidChunkIds.length} invalid chunks`);
      return invalidChunkIds.length;
    } catch (error) {
      console.error('ChunkService: Failed to cleanup all invalid chunks:', error);
      throw error;
    }
  }

  /**
   * Parse embedding string back to number array
   * This fixes the issue where embeddings are stored as strings instead of vectors
   */
  private static parseEmbedding(embedding: unknown): number[] {
    // If it's already an array, return it
    if (Array.isArray(embedding)) {
      return embedding;
    }
    
    // If it's a string, parse it
    if (typeof embedding === 'string') {
      try {
        // Remove brackets and split by commas
        const cleanString = embedding.replace(/[[\]]/g, '');
        const values = cleanString.split(',').map(val => parseFloat(val.trim()));
        
        // Filter out any NaN values
        const validValues = values.filter(val => !isNaN(val));
        
        console.log(`ChunkService: Parsed embedding string with ${validValues.length} values`);
        return validValues;
      } catch (error) {
        console.error('ChunkService: Failed to parse embedding string:', error);
        return [];
      }
    }
    
    // If it's neither array nor string, return empty array
    console.warn('ChunkService: Unknown embedding type:', typeof embedding);
    return [];
  }
}
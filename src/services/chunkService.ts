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
   * Save chunks to database
   */
  static async saveChunks(
    chunks: EmbeddedChunk[], 
    fileId?: string, 
    siteId?: string
  ): Promise<DatabaseChunk[]> {
    const chunksToInsert = chunks.map(chunk => ({
      content: chunk.content,
      embedding: chunk.embedding,
      file_id: fileId || null,
      site_id: siteId || null,
      metadata: chunk.metadata || {},
    }));

    const { data, error } = await supabase
      .from('chunks')
      .insert(chunksToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to save chunks: ${error.message}`);
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

    if (fileError && siteError) {
      console.error('ChunkService: Both file and site queries failed:', { fileError, siteError });
      throw new Error(`Failed to search chunks: ${fileError.message || siteError.message}`);
    }

    console.log('ChunkService: Found file chunks:', fileChunks?.length || 0);
    console.log('ChunkService: Found site chunks:', siteChunks?.length || 0);

    const chunks = [...(fileChunks || []), ...(siteChunks || [])];

    if (!chunks || chunks.length === 0) {
      console.log('ChunkService: No chunks found for context');
      return [];
    }

    console.log('ChunkService: Total chunks to process:', chunks.length);

    // Calculate similarity scores for chunks with matching dimensions
    const validResults: ChunkSearchResult[] = [];
    
    for (const chunk of chunks) {
      // Parse the embedding (handles both arrays and strings)
      const parsedEmbedding = this.parseEmbedding(chunk.embedding);
      
      if (parsedEmbedding.length === 0) {
        console.log('ChunkService: Skipping chunk with empty embedding:', chunk.id);
        continue;
      }
      
      // Only check if dimensions match, don't validate quality
      if (parsedEmbedding.length !== queryEmbedding.length) {
        console.log('ChunkService: Skipping chunk with dimension mismatch:', chunk.id, 'expected:', queryEmbedding.length, 'got:', parsedEmbedding.length);
        continue;
      }
      
      try {
        const similarity = EmbeddingService.cosineSimilarity(
          queryEmbedding,
          parsedEmbedding
        );
        
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
        console.log('ChunkService: Error calculating similarity for chunk:', chunk.id, error);
        continue;
      }
    }

    console.log('ChunkService: Valid results with similarity scores:', validResults.length);

    // Sort by similarity (highest first) and return top results
    const topResults = validResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
      
    console.log('ChunkService: Returning top results:', topResults.length);
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
        
        return validValues;
      } catch {
        return [];
      }
    }
    
    // If it's neither array nor string, return empty array
    return [];
  }
}
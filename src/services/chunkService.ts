import { supabase } from '../lib/supabase';
import { EmbeddingService } from './embeddingService';
import type { EmbeddedChunk } from './embeddingService';

export interface DatabaseChunk {
  id: string;
  content: string;
  embedding: number[];
  file_id?: string;
  site_id?: string;
  metadata?: Record<string, any>;
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
      
      // Find chunks with invalid dimensions
      const invalidChunkIds = allChunks
        .filter(chunk => !EmbeddingService.validateEmbeddingDimensions(chunk.embedding, 1536))
        .map(chunk => chunk.id);

      if (invalidChunkIds.length === 0) {
        console.log('ChunkService: No invalid chunks found');
        return 0;
      }

      console.log(`ChunkService: Found ${invalidChunkIds.length} chunks with invalid dimensions, deleting...`);

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
   * Save chunks to database
   */
  static async saveChunks(
    chunks: EmbeddedChunk[], 
    fileId?: string, 
    siteId?: string
  ): Promise<DatabaseChunk[]> {
    // Validate all embeddings before saving
    for (const chunk of chunks) {
      if (!EmbeddingService.validateEmbeddingDimensions(chunk.embedding, 1536)) {
        throw new Error(`Invalid embedding dimensions: expected 1536, got ${chunk.embedding.length}`);
      }
    }
    
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
   * Search for similar chunks using vector similarity
   */
  static async searchSimilarChunks(
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

    // Filter out chunks with invalid embeddings and calculate similarity scores
    const validResults: ChunkSearchResult[] = [];
    
    for (const chunk of chunks) {
      // Validate embedding dimensions
      if (!EmbeddingService.validateEmbeddingDimensions(chunk.embedding, queryEmbedding.length)) {
        console.warn(`ChunkService: Skipping chunk ${chunk.id} due to dimension mismatch: expected ${queryEmbedding.length}, got ${chunk.embedding?.length || 'undefined'}`);
        continue;
      }
      
      try {
        const similarity = EmbeddingService.cosineSimilarity(
          queryEmbedding,
          chunk.embedding
        );
        
        validResults.push({
          chunk: {
            id: chunk.id,
            content: chunk.content,
            embedding: chunk.embedding,
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
}
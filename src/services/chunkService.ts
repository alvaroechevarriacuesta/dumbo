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
   * Search for similar chunks using vector similarity
   */
  static async searchSimilarChunks(
    contextId: string,
    queryEmbedding: number[],
    limit: number = 5
  ): Promise<ChunkSearchResult[]> {
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
      throw new Error(`Failed to search chunks: ${fileError.message || siteError.message}`);
    }

    const chunks = [...(fileChunks || []), ...(siteChunks || [])];

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const results: ChunkSearchResult[] = chunks.map(chunk => {
      const similarity = EmbeddingService.cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      );
      
      return {
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
      };
    });

    // Sort by similarity (highest first) and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
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
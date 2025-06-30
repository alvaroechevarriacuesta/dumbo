import { ChunkService } from './chunkService';
import { EmbeddingService } from './embeddingService';
import { extensionSupabase as supabase } from '../lib/extension-supabase';

export interface ProcessedContent {
  siteId: string;
  chunkIds: string[];
  totalChunks: number;
}

export class ContentProcessor {
  /**
   * Process DOM text from the current tab: chunk, embed, and save
   */
  static async processCurrentTabContent(domText: string, url: string, contextIds: string[], pageTitle?: string): Promise<ProcessedContent[]> {
    try {
      console.log('Processing content for URL:', url, 'with', domText.length, 'characters');
      
      if (!domText || domText.trim().length === 0) {
        throw new Error('No content to process');
      }

      // Clean and prepare the text
      const cleanedText = this.cleanDOMText(domText);
      console.log('Cleaned text length:', cleanedText.length);

      // Generate chunks using the existing chunk service
      const chunks = EmbeddingService.chunkText(cleanedText);
      
      if (chunks.length === 0) {
        throw new Error('No content could be extracted from the page');
      }

      console.log(`Generated ${chunks.length} chunks for URL: ${url}`);

      // Generate embeddings for all chunks
      const embeddedChunks = await EmbeddingService.generateEmbeddings(chunks);

      if (embeddedChunks.length !== chunks.length) {
        throw new Error('Mismatch between number of chunks and embeddings');
      }

      // Process for each context
      const results: ProcessedContent[] = [];

      for (const contextId of contextIds) {
        try {
          console.log(`Processing content for context: ${contextId}`);

          // Create or get site record
          const siteId = await this.createSite(url, contextId, pageTitle);

          // Delete existing chunks for this site to avoid duplicates
          await this.deleteExistingChunks(siteId);

          // Save chunks to database
          const chunkIds = await this.saveChunksToDatabase(embeddedChunks, siteId);

          results.push({
            siteId,
            chunkIds,
            totalChunks: chunks.length
          });

          console.log(`Saved ${chunkIds.length} chunks for context ${contextId}`);
        } catch (contextError) {
          console.error(`Error processing context ${contextId}:`, contextError);
          throw contextError;
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing current tab content:', error);
      throw error;
    }
  }

  /**
   * Clean DOM text for processing
   */
  private static cleanDOMText(domText: string): string {
    return domText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  }

  /**
   * Create or get existing site record
   */
  private static async createSite(url: string, contextId: string, pageTitle?: string): Promise<string> {
    try {
      console.log('Creating/finding site for:', { url, contextId });
      
      // First, try to find existing site
      const { data: existingSite, error: findError } = await supabase
        .from('sites')
        .select('id')
        .eq('url', url)
        .eq('context_id', contextId)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error finding existing site:', findError);
        throw findError;
      }

      if (existingSite) {
        console.log('Found existing site:', existingSite.id);
        return existingSite.id;
      }

      console.log('Creating new site with data:', {
        url,
        context_id: contextId
      });

      // Create new site - only include columns that exist in the database
      const { data: newSite, error: createError } = await supabase
        .from('sites')
        .insert([{
          url,
          context_id: contextId,
          title: pageTitle || url
        }])
        .select('id')
        .single();

      if (createError) {
        console.error('Database error creating site:', createError);
        console.error('Error details:', {
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint
        });
        throw createError;
      }

      if (!newSite) {
        throw new Error('No site data returned from database');
      }

      console.log('Created new site:', newSite.id);
      return newSite.id;
    } catch (error) {
      console.error('Error creating/getting site:', error);
      throw new Error(`Failed to create site record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete existing chunks for a site to avoid duplicates
   */
  private static async deleteExistingChunks(siteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chunks')
        .delete()
        .eq('site_id', siteId);

      if (error) {
        console.error('Error deleting existing chunks:', error);
        // Don't throw here, as this is cleanup - we can continue without it
      } else {
        console.log('Deleted existing chunks for site:', siteId);
      }
    } catch (error) {
      console.error('Error deleting existing chunks:', error);
      // Don't throw here, as this is cleanup - we can continue without it
    }
  }

  /**
   * Save chunks with embeddings to the database
   */
  private static async saveChunksToDatabase(embeddedChunks: Array<{
    content: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
  }>, siteId: string): Promise<string[]> {
    try {
      const chunkData = embeddedChunks.map(chunk => ({
        content: chunk.content,
        embedding: chunk.embedding,
        site_id: siteId,
        metadata: chunk.metadata || {}
      }));

      const { data, error } = await supabase
        .from('chunks')
        .insert(chunkData)
        .select('id');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No chunks were saved to the database');
      }

      console.log(`Successfully saved ${data.length} chunks to database`);
      return data.map(chunk => chunk.id);
    } catch (error) {
      console.error('Error saving chunks to database:', error);
      throw new Error(`Failed to save chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
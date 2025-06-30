import { ChunkService } from './chunkService';
import { EmbeddingService } from './embeddingService';
import { supabase } from '../lib/supabase';
import { extensionSupabase } from '../lib/extension-supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProcessedContent {
  siteId: string;
  chunkIds: string[];
  totalChunks: number;
}

export class ContentProcessor {
  private static getSupabaseClient(isExtension: boolean = false): SupabaseClient {
    return isExtension ? extensionSupabase : supabase;
  }

  static async processCurrentTabContent(
    domText: string,
    url: string,
    contextIds: string[],
    pageTitle: string,
    isExtension: boolean = false
  ): Promise<ProcessedContent[]> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    
    if (!domText || !url || contextIds.length === 0) {
      throw new Error('Missing required parameters for content processing');
    }

    const results: ProcessedContent[] = [];

    for (const contextId of contextIds) {
      try {
        // Create site record
        const { data: site, error: siteError } = await supabaseClient
          .from('sites')
          .insert([{
            url,
            title: pageTitle || url,
            context_id: contextId,
          }])
          .select()
          .single();

        if (siteError) {
          console.error('Failed to create site record:', siteError);
          continue;
        }

        // Process text content into chunks
        const chunks = EmbeddingService.chunkText(domText, 1000, 200);
        
        // Add metadata to chunks
        const chunksWithMetadata = chunks.map(chunk => ({
          ...chunk,
          metadata: {
            ...chunk.metadata,
            url,
            title: pageTitle || url,
            siteId: site.id,
            contextId,
            processedAt: new Date().toISOString(),
          }
        }));

        // Generate embeddings
        const embeddedChunks = await EmbeddingService.generateEmbeddings(chunksWithMetadata);

        // Save chunks to database
        const savedChunks = await ChunkService.saveChunks(embeddedChunks, undefined, site.id, isExtension);

        results.push({
          siteId: site.id,
          chunkIds: savedChunks.map(chunk => chunk.id),
          totalChunks: savedChunks.length,
        });

        console.log(`Successfully processed content for context ${contextId}: ${savedChunks.length} chunks`);

      } catch (error) {
        console.error(`Failed to process content for context ${contextId}:`, error);
        // Continue with other contexts even if one fails
      }
    }

    return results;
  }

  static async processFileContent(
    file: File,
    contextId: string,
    isExtension: boolean = false
  ): Promise<ProcessedContent> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    
    if (!file || !contextId) {
      throw new Error('Missing required parameters for file processing');
    }

    try {
      // Create file record
      const { data: fileRecord, error: fileError } = await supabaseClient
        .from('files')
        .insert([{
          name: file.name,
          context_id: contextId,
          size: file.size,
          type: file.type,
        }])
        .select()
        .single();

      if (fileError) {
        throw new Error(`Failed to create file record: ${fileError.message}`);
      }

      // Extract text content based on file type
      let textContent: string;
      
      if (file.type === 'application/pdf') {
        const { PDFService } = await import('./pdfService');
        textContent = await PDFService.extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        textContent = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }

      // Process text content into chunks
      const chunks = EmbeddingService.chunkText(textContent, 1000, 200);
      
      // Add metadata to chunks
      const chunksWithMetadata = chunks.map(chunk => ({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileId: fileRecord.id,
          contextId,
          processedAt: new Date().toISOString(),
        }
      }));

      // Generate embeddings
      const embeddedChunks = await EmbeddingService.generateEmbeddings(chunksWithMetadata);

      // Save chunks to database
      const savedChunks = await ChunkService.saveChunks(embeddedChunks, fileRecord.id, undefined, isExtension);

      return {
        siteId: fileRecord.id,
        chunkIds: savedChunks.map(chunk => chunk.id),
        totalChunks: savedChunks.length,
      };

    } catch (error) {
      console.error('Failed to process file content:', error);
      throw error;
    }
  }
} 
import { extensionSupabase } from '../../lib/extension-supabase';
import { PDFService } from '../../services/pdfService';
import { EmbeddingService } from '../../services/embeddingService';
import { ChunkService } from '../../services/chunkService';
import type { DatabaseContext, CreateContextData, DatabaseFile, DatabaseSite, CreateFileData } from '../../types/database';

export class ExtensionContextService {
  static async getUserContexts(userId: string): Promise<DatabaseContext[]> {
    const { data, error } = await extensionSupabase
      .from('contexts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contexts: ${error.message}`);
    }

    return data || [];
  }

  static async createContext(contextData: CreateContextData): Promise<DatabaseContext> {
    const { data, error } = await extensionSupabase
      .from('contexts')
      .insert([{
        name: contextData.name,
        // Note: user_id will be set automatically by the database default
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create context: ${error.message}`);
    }

    return data;
  }

  static async deleteContext(contextId: string): Promise<void> {
    try {
      // First, get all files associated with this context
      const { data: files, error: filesError } = await extensionSupabase
        .from('files')
        .select('path')
        .eq('context_id', contextId);

      if (filesError) {
        console.error('Failed to fetch files for context deletion:', filesError);
        // Continue with context deletion even if we can't fetch files
      }

      // Delete files from storage if any exist
      if (files && files.length > 0) {
        const filePaths = files
          .filter(file => file.path) // Only include files that have a storage path
          .map(file => file.path!);

        if (filePaths.length > 0) {
          const { error: storageError } = await extensionSupabase.storage
            .from('files')
            .remove(filePaths);

          if (storageError) {
            console.error('Failed to delete files from storage:', storageError);
            // Continue with context deletion even if storage cleanup fails
          }
        }
      }

      // Delete the context (this will cascade delete files, sites, etc. from database)
      const { error: deleteError } = await extensionSupabase
        .from('contexts')
        .delete()
        .eq('id', contextId);

      if (deleteError) {
        throw new Error(`Failed to delete context: ${deleteError.message}`);
      }
    } catch (error) {
      console.error('Error deleting context:', error);
      throw error;
    }
  }

  static async getContextFiles(contextId: string): Promise<DatabaseFile[]> {
    try {
      const { data, error } = await extensionSupabase
        .from('files')
        .select('*')
        .eq('context_id', contextId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch files: ${error.message}`);
      }

      // Enhance files with public URLs if they have paths
      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          if (file.path) {
            try {
              const publicUrl = await this.getFileUrl(file.path);
              return { ...file, publicUrl };
            } catch (urlError) {
              console.warn(`Failed to get URL for file ${file.id}:`, urlError);
              return file;
            }
          }
          return file;
        })
      );

      return filesWithUrls;
    } catch (error) {
      console.error('Error fetching context files:', error);
      throw error;
    }
  }

  static async getContextSites(contextId: string): Promise<DatabaseSite[]> {
    const { data, error } = await extensionSupabase
      .from('sites')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sites: ${error.message}`);
    }

    return data || [];
  }

  static async createFile(fileData: CreateFileData): Promise<DatabaseFile> {
    const { data, error } = await extensionSupabase
      .from('files')
      .insert([fileData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }

    return data;
  }

  static async deleteFile(fileId: string): Promise<void> {
    try {
      // First, delete associated chunks
      await ChunkService.deleteChunksByFileId(fileId);

      // First, get the file details to access the storage path
      const { data: fileData, error: fetchError } = await extensionSupabase
        .from('files')
        .select('path')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch file details: ${fetchError.message}`);
      }

      // Delete from storage if path exists
      if (fileData?.path) {
        const { error: storageError } = await extensionSupabase.storage
          .from('files')
          .remove([fileData.path]);

        if (storageError) {
          console.warn(`Failed to delete file from storage: ${storageError.message}`);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error: deleteError } = await extensionSupabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (deleteError) {
        throw new Error(`Failed to delete file from database: ${deleteError.message}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  static async uploadFile(file: File, contextId: string): Promise<string> {
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.txt'];
    
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      throw new Error('Only PDF and TXT files are supported');
    }

    try {
      const { data: user } = await extensionSupabase.auth.getUser();
      const userId = user.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Generate file path without timestamp - will fail if file exists
      const filePath = `${userId}/contexts/${contextId}/${file.name}`;

      // Upload to Supabase Storage
      const { error } = await extensionSupabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      return filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  static async getFileUrl(path: string): Promise<string> {
    const { data } = extensionSupabase.storage
      .from('files')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async processFileContent(file: File, fileId: string): Promise<void> {
    try {
      // Update file status to processing
      const { error: updateError } = await extensionSupabase
        .from('files')
        .update({ processing_status: 'processing' })
        .eq('id', fileId);

      if (updateError) {
        throw new Error(`Failed to update file status: ${updateError.message}`);
      }

      let content = '';
      let chunks: string[] = [];

      // Extract content based on file type
      if (file.type === 'application/pdf') {
        content = await PDFService.extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        content = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }

      // Create chunks from content (simple implementation)
      chunks = this.createSimpleChunks(content, 1000, 200);

      // Create embeddings for chunks
      const textChunks = chunks.map(chunk => ({ content: chunk, metadata: {} }));
      const embeddings = await EmbeddingService.generateEmbeddings(textChunks);

      // Store chunks and embeddings
      await ChunkService.saveChunks(embeddings, fileId);

      // Update file with content and completed status
      const { error: finalUpdateError } = await extensionSupabase
        .from('files')
        .update({ 
          content,
          processing_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (finalUpdateError) {
        throw new Error(`Failed to update file with content: ${finalUpdateError.message}`);
      }

    } catch (error) {
      // Update file status to failed
      await extensionSupabase
        .from('files')
        .update({ 
          processing_status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      console.error('Error processing file content:', error);
      throw error;
    }
  }

  // Simple text chunking function
  private static createSimpleChunks(text: string, maxChunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + maxChunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to break at a sentence boundary
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + maxChunkSize * 0.7) {
          chunk = text.slice(start, start + breakPoint + 1);
          start = start + breakPoint + 1 - overlap;
        } else {
          start = end - overlap;
        }
      } else {
        start = end;
      }

      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }
} 
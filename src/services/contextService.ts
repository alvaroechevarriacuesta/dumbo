import { supabase } from '../lib/supabase';
import { extensionSupabase } from '../lib/extension-supabase';
import { PDFService } from './pdfService';
import { EmbeddingService } from './embeddingService';
import { ChunkService } from './chunkService';
import type { DatabaseContext, CreateContextData, DatabaseFile, DatabaseSite, CreateFileData } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export class ContextService {
  private static getSupabaseClient(isExtension: boolean = false): SupabaseClient {
    return isExtension ? extensionSupabase : supabase;
  }

  static async getUserContexts(userId: string, isExtension: boolean = false): Promise<DatabaseContext[]> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { data, error } = await supabaseClient
      .from('contexts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contexts: ${error.message}`);
    }

    return data || [];
  }

  static async createContext(contextData: CreateContextData, isExtension: boolean = false): Promise<DatabaseContext> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { data, error } = await supabaseClient
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

  static async deleteContext(contextId: string, isExtension: boolean = false): Promise<void> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    try {
      // First, get all files associated with this context
      const { data: files, error: filesError } = await supabaseClient
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
          const { error: storageError } = await supabaseClient.storage
            .from('files')
            .remove(filePaths);

          if (storageError) {
            console.error('Failed to delete files from storage:', storageError);
            // Continue with context deletion even if storage cleanup fails
          }
        }
      }

      // Delete the context (this will cascade delete files, sites, etc. from database)
      const { error: deleteError } = await supabaseClient
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

  static async getContextFiles(contextId: string, isExtension: boolean = false): Promise<DatabaseFile[]> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    try {
      const { data, error } = await supabaseClient
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
              const publicUrl = await this.getFileUrl(file.path, isExtension);
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

  static async getContextSites(contextId: string, isExtension: boolean = false): Promise<DatabaseSite[]> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { data, error } = await supabaseClient
      .from('sites')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sites: ${error.message}`);
    }

    return data || [];
  }

  static async createFile(fileData: CreateFileData, isExtension: boolean = false): Promise<DatabaseFile> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { data, error } = await supabaseClient
      .from('files')
      .insert([fileData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }

    return data;
  }

  static async deleteFile(fileId: string, isExtension: boolean = false): Promise<void> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    try {
      // First, delete associated chunks
      await ChunkService.deleteChunksByFileId(fileId);

      // First, get the file details to access the storage path
      const { data: fileData, error: fetchError } = await supabaseClient
        .from('files')
        .select('path')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch file details: ${fetchError.message}`);
      }

      // Delete from storage if path exists
      if (fileData?.path) {
        const { error: storageError } = await supabaseClient.storage
          .from('files')
          .remove([fileData.path]);

        if (storageError) {
          console.warn(`Failed to delete file from storage: ${storageError.message}`);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error: deleteError } = await supabaseClient
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

  static async uploadFile(file: File, contextId: string, isExtension: boolean = false): Promise<string> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.txt'];
    
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      throw new Error('Only PDF and TXT files are supported');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${contextId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabaseClient.storage
      .from('files')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Create file record in database
    const fileData: CreateFileData = {
      name: file.name,
      path: filePath,
      context_id: contextId,
      size: file.size,
      type: file.type,
    };

    const { data: dbFile, error: dbError } = await supabaseClient
      .from('files')
      .insert([fileData])
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabaseClient.storage.from('files').remove([filePath]);
      throw new Error(`Failed to create file record: ${dbError.message}`);
    }

    return dbFile.id;
  }

  static async getFileUrl(path: string, isExtension: boolean = false): Promise<string> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { data } = supabaseClient.storage
      .from('files')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async processFileContent(file: File, fileId: string): Promise<void> {
    try {
      let textContent: string;

      if (file.type === 'application/pdf') {
        textContent = await PDFService.extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        textContent = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }

      // Create embeddings and chunks
      const chunks = EmbeddingService.chunkText(textContent);
      const embeddedChunks = await EmbeddingService.generateEmbeddings(chunks);
      await ChunkService.saveChunks(embeddedChunks, fileId);

      console.log(`Successfully processed file ${file.name} with ${embeddedChunks.length} chunks`);
    } catch (error) {
      console.error('Error processing file content:', error);
      throw error;
    }
  }
}
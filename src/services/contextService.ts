import { supabase } from '../lib/supabase';
import { FileProcessingService } from './fileProcessingService';
import type { DatabaseContext, CreateContextData, DatabaseFile, DatabaseSite, CreateFileData } from '../types/database';

export class ContextService {
  static async getUserContexts(userId: string): Promise<DatabaseContext[]> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
      .from('contexts')
      .delete()
      .eq('id', contextId);

    if (error) {
      throw new Error(`Failed to delete context: ${error.message}`);
    }
  }

  static async getContextFiles(contextId: string): Promise<DatabaseFile[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    return data || [];
  }

  static async getContextSites(contextId: string): Promise<DatabaseSite[]> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  static async uploadFile(file: File, contextId: string): Promise<string> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Use the new file processing service
    const fileRecord = await FileProcessingService.processFileUpload(file, contextId, user.id);
    return fileRecord.path || '';
  }

  static async getFileUrl(path: string): Promise<string> {
    return FileProcessingService.getFileUrl(path);
  }
}
import { supabase } from '../lib/supabase';
import type { DatabaseContext, CreateContextData } from '../types/database';

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
}
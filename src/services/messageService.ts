import { supabase } from '../lib/supabase';
import { extensionSupabase } from '../lib/extension-supabase';
import type { Message } from '../types/chat';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseMessage {
  id: string;
  context_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export class MessageService {
  private static getSupabaseClient(isExtension: boolean = false): SupabaseClient {
    return isExtension ? extensionSupabase : supabase;
  }

  static async getContextMessages(
    contextId: string,
    limit: number = 50,
    offset: number = 0,
    isExtension: boolean = false
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    
    // Get total count for pagination
    const { count, error: countError } = await supabaseClient
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('context_id', contextId);

    if (countError) {
      throw new Error(`Failed to get message count: ${countError.message}`);
    }

    // Get messages with pagination
    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    const messages = (data || []).map(this.convertToMessage);
    const hasMore = (count || 0) > offset + limit;

    return { messages, hasMore };
  }

  static async getLatestMessages(
    contextId: string,
    limit: number = 10,
    isExtension: boolean = false
  ): Promise<{ messages: Message[]; totalCount: number }> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    
    // Get total count
    const { count, error: countError } = await supabaseClient
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('context_id', contextId);

    if (countError) {
      throw new Error(`Failed to get message count: ${countError.message}`);
    }

    const totalCount = count || 0;

    // Get the latest messages
    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get latest messages: ${error.message}`);
    }

    // Reverse the order to get chronological order
    const messages = (data || []).reverse().map(this.convertToMessage);

    return { messages, totalCount };
  }

  static async createMessage(
    contextId: string,
    role: 'user' | 'assistant',
    content: string,
    isExtension: boolean = false
  ): Promise<Message> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { data, error } = await supabaseClient
      .from('messages')
      .insert([{
        context_id: contextId,
        role,
        content,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return this.convertToMessage(data);
  }

  static async updateMessage(
    messageId: string,
    content: string,
    isExtension: boolean = false
  ): Promise<Message> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { data, error } = await supabaseClient
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return this.convertToMessage(data);
  }

  static async deleteMessage(messageId: string, isExtension: boolean = false): Promise<void> {
    const supabaseClient = this.getSupabaseClient(isExtension);
    const { error } = await supabaseClient
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  private static convertToMessage(dbMessage: DatabaseMessage): Message {
    return {
      id: dbMessage.id,
      sender: dbMessage.role,
      content: dbMessage.content,
      timestamp: new Date(dbMessage.created_at),
    };
  }
}
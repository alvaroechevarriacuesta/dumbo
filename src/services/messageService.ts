import { supabase } from '../lib/supabase';
import type { Message } from '../types/chat';

export interface DatabaseMessage {
  id: string;
  context_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export class MessageService {
  static async getContextMessages(
    contextId: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    // First, get total count to determine if there are more messages
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('context_id', contextId);

    const totalMessages = count || 0;
    const hasMore = offset + limit < totalMessages;

    // Get messages in ascending order (oldest first) with offset from the beginning
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    const messages = (data || []).map(this.convertToMessage);
    
    return {
      messages,
      hasMore
    };
  }

  static async getLatestMessages(contextId: string, limit: number = 10): Promise<{ messages: Message[]; totalCount: number }> {
    // Get total count first
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('context_id', contextId);

    const totalCount = count || 0;
    
    // Calculate offset to get the last N messages
    const offset = Math.max(0, totalCount - limit);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch latest messages: ${error.message}`);
    }

    return {
      messages: (data || []).map(this.convertToMessage),
      totalCount
    };
  }

  static async createMessage(
    contextId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message> {
    const { data, error } = await supabase
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

  static async updateMessage(messageId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
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

  static async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
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
      content: dbMessage.content,
      timestamp: new Date(dbMessage.created_at),
      sender: dbMessage.role,
      context: dbMessage.context_id,
    };
  }
}
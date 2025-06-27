import { extensionSupabase } from '../../lib/extension-supabase';
import type { Message } from '../../types/chat';

export class ExtensionMessageService {
  static async getMessages(
    contextId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ messages: Message[]; hasMore: boolean; total: number }> {
    const { data, error, count } = await extensionSupabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('context_id', contextId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    const messages = (data || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      sender: msg.role as 'user' | 'assistant',
      context: msg.context_id,
    }));

    return {
      messages,
      hasMore: (count || 0) > offset + limit,
      total: count || 0,
    };
  }

  static async createMessage(
    contextId: string, 
    role: 'user' | 'assistant', 
    content: string
  ): Promise<Message> {
    const { data, error } = await extensionSupabase
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

    return {
      id: data.id,
      content: data.content,
      timestamp: new Date(data.created_at),
      sender: data.role as 'user' | 'assistant',
      context: data.context_id,
    };
  }

  static async updateMessage(messageId: string, content: string): Promise<Message> {
    const { data, error } = await extensionSupabase
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return {
      id: data.id,
      content: data.content,
      timestamp: new Date(data.created_at),
      sender: data.role as 'user' | 'assistant',
      context: data.context_id,
    };
  }

  static async deleteMessage(messageId: string): Promise<void> {
    const { error } = await extensionSupabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  static async getLatestMessages(contextId: string, limit: number = 10): Promise<{ messages: Message[]; totalCount: number }> {
    // Get total count first
    const { count } = await extensionSupabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('context_id', contextId);

    const totalCount = count || 0;
    
    // Calculate offset to get the last N messages
    const offset = Math.max(0, totalCount - limit);

    const { data, error } = await extensionSupabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch latest messages: ${error.message}`);
    }

    const messages = (data || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      sender: msg.role as 'user' | 'assistant',
      context: msg.context_id,
    }));

    return {
      messages,
      totalCount
    };
  }

  static async getContextMessages(
    contextId: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    // First, get total count to determine if there are more messages
    const { count } = await extensionSupabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('context_id', contextId);

    const totalMessages = count || 0;
    const hasMore = offset + limit < totalMessages;

    // Get messages in ascending order (oldest first) with offset from the beginning
    const { data, error } = await extensionSupabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    const messages = (data || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      sender: msg.role as 'user' | 'assistant',
      context: msg.context_id,
    }));
    
    return {
      messages,
      hasMore
    };
  }
} 
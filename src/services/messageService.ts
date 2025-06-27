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
    // Get one extra message to check if there are more
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    const messages = (data || []).map(this.convertToMessage);
    
    // Check if there are more messages by trying to fetch one more
    const { data: nextData } = await supabase
      .from('messages')
      .select('id')
      .eq('context_id', contextId)
      .order('created_at', { ascending: false })
      .range(offset + limit, offset + limit);
    
    const hasMore = (nextData && nextData.length > 0) || false;
    
    // Reverse to show oldest first (chronological order)
    return {
      messages: messages.reverse(),
      hasMore
    };
  }

  static async getLatestMessages(contextId: string, limit: number = 10): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch latest messages: ${error.message}`);
    }

    // Reverse to show oldest first (chronological order)
    return (data || []).map(this.convertToMessage).reverse();
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
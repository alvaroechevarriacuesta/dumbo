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
  static async getContextMessages(contextId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data || []).map(this.convertToMessage);
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
export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'assistant';
  context?: string;
}

export interface ChatContext {
  id: string;
  name: string;
  description: string;
  icon: string;
}
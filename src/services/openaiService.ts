import OpenAI from 'openai';

interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, API calls should go through your backend
    });
    this.model = config.model || 'gpt-3.5-turbo';
  }

  async *streamChatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  async getChatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }
}

// Singleton instance
let openaiService: OpenAIService | null = null;

export const getOpenAIService = (): OpenAIService => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
  }

  if (!openaiService) {
    openaiService = new OpenAIService({ apiKey });
  }

  return openaiService;
};
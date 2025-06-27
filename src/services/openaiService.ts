import OpenAI from 'openai';
import { ChunkService } from './chunkService';
import type { ChunkSearchResult } from './chunkService';

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

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-large',
        input: text,
        dimensions: 1536, // Explicitly set to 1536 dimensions
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async *streamChatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    contextId?: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      let systemPrompt = {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. Go into as much detail as possible. Provide comprehensive, thorough responses with examples, explanations, and actionable insights. Use markdown formatting to structure your responses clearly with headers, lists, code blocks, and other formatting as appropriate.'
      };

      // If we have a context, perform RAG
      if (contextId && messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user') {
          try {
            // Generate embedding for the user's query
            const queryEmbedding = await this.generateEmbedding(lastUserMessage.content);
            
            // Search for relevant chunks
            const relevantChunks = await ChunkService.searchSimilarChunks(
              contextId,
              queryEmbedding,
              5
            );

            // Filter chunks by similarity threshold (70% relevance)
            const highQualityChunks = relevantChunks.filter(
              chunk => chunk.similarity >= 0.7
            );

            if (highQualityChunks.length > 0) {
              const contextInfo = highQualityChunks
                .map((result, index) => {
                  const relevancePercentage = (result.similarity * 100).toFixed(1);
                  const source = result.chunk.metadata?.fileName || 'Unknown source';
                  
                  return `**[Source ${index + 1}: ${source}]** (Relevance: ${relevancePercentage}%)
${result.chunk.content}`;
                })
                .join('\n\n---\n\n');

              systemPrompt = {
                role: 'system' as const,
                content: `You are a helpful AI assistant. Use the provided context information to answer the user's question. If the context is relevant, base your answer primarily on the provided information and cite the sources. If the context doesn't contain relevant information, you can provide a general answer but mention that you don't have specific context about this topic.

Go into as much detail as possible. Provide comprehensive, thorough responses with examples, explanations, and actionable insights. Use markdown formatting to structure your responses clearly with headers, lists, code blocks, and other formatting as appropriate.

**CONTEXT INFORMATION:**
${contextInfo}

Please answer based on the above context when relevant and cite your sources appropriately.`
              };

              console.log(`RAG: Found ${highQualityChunks.length} relevant chunks for query`);
            } else {
              console.log('RAG: No relevant chunks found above threshold');
            }
          } catch (error) {
            console.error('RAG search failed, proceeding without context:', error);
          }
        }
      }

      const messagesWithSystem = [systemPrompt, ...messages];

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messagesWithSystem,
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
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    contextId?: string
  ): Promise<string> {
    try {
      let systemPrompt = {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. Go into as much detail as possible. Provide comprehensive, thorough responses with examples, explanations, and actionable insights. Use markdown formatting to structure your responses clearly with headers, lists, code blocks, and other formatting as appropriate.'
      };

      // If we have a context, perform RAG
      if (contextId && messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user') {
          try {
            // Generate embedding for the user's query
            const queryEmbedding = await this.generateEmbedding(lastUserMessage.content);
            
            // Search for relevant chunks
            const relevantChunks = await ChunkService.searchSimilarChunks(
              contextId,
              queryEmbedding,
              5
            );

            // Filter chunks by similarity threshold (70% relevance)
            const highQualityChunks = relevantChunks.filter(
              chunk => chunk.similarity >= 0.7
            );

            if (highQualityChunks.length > 0) {
              const contextInfo = highQualityChunks
                .map((result, index) => {
                  const relevancePercentage = (result.similarity * 100).toFixed(1);
                  const source = result.chunk.metadata?.fileName || 'Unknown source';
                  
                  return `**[Source ${index + 1}: ${source}]** (Relevance: ${relevancePercentage}%)
${result.chunk.content}`;
                })
                .join('\n\n---\n\n');

              systemPrompt = {
                role: 'system' as const,
                content: `You are a helpful AI assistant. Use the provided context information to answer the user's question. If the context is relevant, base your answer primarily on the provided information and cite the sources. If the context doesn't contain relevant information, you can provide a general answer but mention that you don't have specific context about this topic.

Go into as much detail as possible. Provide comprehensive, thorough responses with examples, explanations, and actionable insights. Use markdown formatting to structure your responses clearly with headers, lists, code blocks, and other formatting as appropriate.

**CONTEXT INFORMATION:**
${contextInfo}

Please answer based on the above context when relevant and cite your sources appropriately.`
              };

              console.log(`RAG: Found ${highQualityChunks.length} relevant chunks for query`);
            } else {
              console.log('RAG: No relevant chunks found above threshold');
            }
          } catch (error) {
            console.error('RAG search failed, proceeding without context:', error);
          }
        }
      }

      const messagesWithSystem = [systemPrompt, ...messages];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messagesWithSystem,
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

export const getOpenAIService = (): OpenAI => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
  }

  if (!openaiService) {
    openaiService = new OpenAIService({ apiKey });
  }

  return openaiService;
};
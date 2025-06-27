import { getOpenAIService } from './openaiService';
import { ChunkService } from './chunkService';
import type { ChunkSearchResult } from './chunkService';

export interface RAGContext {
  chunks: ChunkSearchResult[];
  totalRelevantChunks: number;
  averageSimilarity: number;
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  hasRelevantContext: boolean;
}

export class RAGService {
  private static readonly SIMILARITY_THRESHOLD = 0.7; // Minimum similarity score to consider relevant
  private static readonly MAX_CONTEXT_CHUNKS = 5;
  private static readonly MAX_CONTEXT_LENGTH = 4000; // Maximum characters for context

  /**
   * Generate a response using RAG
   */
  static async generateRAGResponse(
    query: string,
    contextId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
  ): Promise<RAGResponse> {
    try {
      const openaiService = getOpenAIService();
      
      // Generate embedding for the query
      const queryEmbedding = await openaiService.generateEmbedding(query);
      
      // Validate query embedding
      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('Failed to generate valid query embedding');
      }
      
      // Search for relevant chunks
      const relevantChunks = await ChunkService.searchSimilarChunks(
        contextId,
        queryEmbedding,
        this.MAX_CONTEXT_CHUNKS * 2 // Get more chunks to filter by relevance
      );

      // Filter chunks by similarity threshold
      const highQualityChunks = relevantChunks.filter(
        chunk => chunk.similarity >= this.SIMILARITY_THRESHOLD
      );

      // Take the top chunks within context length limit
      const selectedChunks = this.selectOptimalChunks(
        highQualityChunks.slice(0, this.MAX_CONTEXT_CHUNKS)
      );

      const hasRelevantContext = selectedChunks.length > 0;
      
      // Build context information
      const ragContext: RAGContext = {
        chunks: selectedChunks,
        totalRelevantChunks: highQualityChunks.length,
        averageSimilarity: selectedChunks.length > 0 
          ? selectedChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / selectedChunks.length
          : 0,
      };

      // Generate response with context
      const answer = await this.generateContextualResponse(
        query,
        selectedChunks,
        conversationHistory,
        hasRelevantContext
      );

      return {
        answer,
        context: ragContext,
        hasRelevantContext,
      };
    } catch (error) {
      console.error('RAG generation failed:', error);
      
      // Fallback to regular response without context
      const openaiService = getOpenAIService();
      const fallbackMessages = [
        ...conversationHistory,
        { role: 'user' as const, content: query }
      ];
      
      const answer = await openaiService.getChatCompletion(fallbackMessages);
      
      return {
        answer,
        context: {
          chunks: [],
          totalRelevantChunks: 0,
          averageSimilarity: 0,
        },
        hasRelevantContext: false,
      };
    }
  }

  /**
   * Stream a response using RAG
   */
  static async *streamRAGResponse(
    query: string,
    contextId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
  ): AsyncGenerator<{ chunk: string; context?: RAGContext }, void, unknown> {
    try {
      const openaiService = getOpenAIService();
      
      // Generate embedding for the query
      const queryEmbedding = await openaiService.generateEmbedding(query);
      
      // Validate query embedding
      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('Failed to generate valid query embedding');
      }
      
      // Search for relevant chunks
      const relevantChunks = await ChunkService.searchSimilarChunks(
        contextId,
        queryEmbedding,
        this.MAX_CONTEXT_CHUNKS * 2
      );

      // Filter and select optimal chunks
      const highQualityChunks = relevantChunks.filter(
        chunk => chunk.similarity >= this.SIMILARITY_THRESHOLD
      );
      
      const selectedChunks = this.selectOptimalChunks(
        highQualityChunks.slice(0, this.MAX_CONTEXT_CHUNKS)
      );

      const hasRelevantContext = selectedChunks.length > 0;
      
      // Build context information
      const ragContext: RAGContext = {
        chunks: selectedChunks,
        totalRelevantChunks: highQualityChunks.length,
        averageSimilarity: selectedChunks.length > 0 
          ? selectedChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / selectedChunks.length
          : 0,
      };

      // Stream response with context
      const stream = this.streamContextualResponse(
        query,
        selectedChunks,
        conversationHistory,
        hasRelevantContext
      );

      let isFirstChunk = true;
      for await (const chunk of stream) {
        if (isFirstChunk) {
          yield { chunk, context: ragContext };
          isFirstChunk = false;
        } else {
          yield { chunk };
        }
      }
    } catch (error) {
      console.error('RAG streaming failed:', error);
      
      // Fallback to regular streaming without context
      const openaiService = getOpenAIService();
      const fallbackMessages = [
        ...conversationHistory,
        { role: 'user' as const, content: query }
      ];
      
      const stream = openaiService.streamChatCompletion(fallbackMessages);
      
      let isFirstChunk = true;
      for await (const chunk of stream) {
        if (isFirstChunk) {
          yield { 
            chunk, 
            context: {
              chunks: [],
              totalRelevantChunks: 0,
              averageSimilarity: 0,
            }
          };
          isFirstChunk = false;
        } else {
          yield { chunk };
        }
      }
    }
  }

  /**
   * Select optimal chunks within context length limit
   */
  private static selectOptimalChunks(chunks: ChunkSearchResult[]): ChunkSearchResult[] {
    const selected: ChunkSearchResult[] = [];
    let totalLength = 0;

    // Sort by similarity (highest first)
    const sortedChunks = chunks.sort((a, b) => b.similarity - a.similarity);

    for (const chunk of sortedChunks) {
      const chunkLength = chunk.chunk.content.length;
      
      if (totalLength + chunkLength <= this.MAX_CONTEXT_LENGTH) {
        selected.push(chunk);
        totalLength += chunkLength;
      } else {
        // Try to fit a truncated version if there's space
        const remainingSpace = this.MAX_CONTEXT_LENGTH - totalLength;
        if (remainingSpace > 200) { // Only if we have meaningful space left
          const truncatedContent = chunk.chunk.content.substring(0, remainingSpace - 3) + '...';
          selected.push({
            ...chunk,
            chunk: {
              ...chunk.chunk,
              content: truncatedContent,
            }
          });
        }
        break;
      }
    }

    return selected;
  }

  /**
   * Generate contextual response
   */
  private static async generateContextualResponse(
    query: string,
    chunks: ChunkSearchResult[],
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    hasRelevantContext: boolean
  ): Promise<string> {
    const openaiService = getOpenAIService();
    
    const systemPrompt = this.buildSystemPrompt(chunks, hasRelevantContext);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: query }
    ];

    return await openaiService.getChatCompletion(messages);
  }

  /**
   * Stream contextual response
   */
  private static async *streamContextualResponse(
    query: string,
    chunks: ChunkSearchResult[],
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    hasRelevantContext: boolean
  ): AsyncGenerator<string, void, unknown> {
    const openaiService = getOpenAIService();
    
    const systemPrompt = this.buildSystemPrompt(chunks, hasRelevantContext);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: query }
    ];

    for await (const chunk of openaiService.streamChatCompletion(messages)) {
      yield chunk;
    }
  }

  /**
   * Build system prompt with context
   */
  private static buildSystemPrompt(chunks: ChunkSearchResult[], hasRelevantContext: boolean): string {
    let systemPrompt = `You are a helpful AI assistant. Provide comprehensive, detailed responses with examples, explanations, and actionable insights. Use markdown formatting to structure your responses clearly with headers, lists, code blocks, and other formatting as appropriate.`;

    if (hasRelevantContext && chunks.length > 0) {
      const contextInfo = chunks
        .map((result, index) => {
          const relevancePercentage = (result.similarity * 100).toFixed(1);
          const source = result.chunk.metadata?.fileName || 'Unknown source';
          
          return `**[Source ${index + 1}: ${source}]** (Relevance: ${relevancePercentage}%)
${result.chunk.content}`;
        })
        .join('\n\n---\n\n');

      systemPrompt += `

**IMPORTANT**: Use the provided context information to answer the user's question. Base your answer primarily on the provided information when it's relevant. If the context contains relevant information, cite the sources and reference specific details from the context.

If the context doesn't contain information relevant to the user's question, you can provide a general answer but mention that you don't have specific context about this topic in the uploaded documents.

**CONTEXT INFORMATION:**
${contextInfo}

Please answer based on the above context when relevant, and cite your sources appropriately.`;
    } else {
      systemPrompt += `

Note: No relevant context was found in the uploaded documents for this query. Providing a general response based on my training knowledge.`;
    }

    return systemPrompt;
  }

  /**
   * Get context summary for a given query
   */
  static async getContextSummary(query: string, contextId: string): Promise<{
    totalChunks: number;
    relevantChunks: number;
    sources: string[];
    averageSimilarity: number;
  }> {
    try {
      const openaiService = getOpenAIService();
      const queryEmbedding = await openaiService.generateEmbedding(query);
      
      const relevantChunks = await ChunkService.searchSimilarChunks(
        contextId,
        queryEmbedding,
        10
      );

      const highQualityChunks = relevantChunks.filter(
        chunk => chunk.similarity >= this.SIMILARITY_THRESHOLD
      );

      const sources = Array.from(new Set(
        highQualityChunks
          .map(chunk => chunk.chunk.metadata?.fileName)
          .filter(Boolean)
      )) as string[];

      return {
        totalChunks: relevantChunks.length,
        relevantChunks: highQualityChunks.length,
        sources,
        averageSimilarity: highQualityChunks.length > 0
          ? highQualityChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / highQualityChunks.length
          : 0,
      };
    } catch (error) {
      console.error('Failed to get context summary:', error);
      return {
        totalChunks: 0,
        relevantChunks: 0,
        sources: [],
        averageSimilarity: 0,
      };
    }
  }
}
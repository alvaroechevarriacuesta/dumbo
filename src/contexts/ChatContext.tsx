import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ContextService } from '../services/contextService';
import { MessageService } from '../services/messageService';
import { getOpenAIService } from '../services/openaiService';
import toast from 'react-hot-toast';
import type { Message, ChatContext as ChatContextType } from '../types/chat';
import type { DatabaseContext } from '../types/database';

interface ChatState {
  messages: Record<string, Message[]>; // contextId -> messages
  messagesPagination: Record<string, { hasMore: boolean; offset: number }>; // contextId -> pagination info
  contexts: ChatContextType[];
  activeContextId: string | null;
  isStreaming: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  streamingMessageId: string | null;
}

interface ChatContextValue extends ChatState {
  selectContext: (contextId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  addContext: (context: { name: string; description?: string }) => Promise<string>;
  deleteContext: (contextId: string) => Promise<void>;
  getCurrentMessages: () => Message[];
  refreshContexts: () => Promise<void>;
  loadMessages: (contextId: string) => Promise<void>;
  loadMoreMessages: (contextId: string) => Promise<void>;
  isExtension: boolean;
}

interface ChatProviderProps {
  children: ReactNode;
  isExtension?: boolean;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

type ChatAction =
  | { type: 'SELECT_CONTEXT'; payload: string }
  | { type: 'SET_MESSAGES'; payload: { contextId: string; messages: Message[] } }
  | { type: 'PREPEND_MESSAGES'; payload: { contextId: string; messages: Message[] } }
  | { type: 'SET_PAGINATION'; payload: { contextId: string; hasMore: boolean; offset: number } }
  | { type: 'ADD_MESSAGE'; payload: { contextId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { contextId: string; messageId: string; content: string } }
  | { type: 'SET_CONTEXTS'; payload: ChatContextType[] }
  | { type: 'ADD_CONTEXT'; payload: ChatContextType }
  | { type: 'REMOVE_CONTEXT'; payload: string }
  | { type: 'START_STREAMING'; payload: string }
  | { type: 'STOP_STREAMING' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SELECT_CONTEXT':
      return {
        ...state,
        activeContextId: action.payload,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.contextId]: action.payload.messages,
        },
      };
    case 'PREPEND_MESSAGES': {
      const existingMsgs = state.messages[action.payload.contextId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.contextId]: [...action.payload.messages, ...existingMsgs],
        },
      };
    }
    case 'SET_PAGINATION':
      return {
        ...state,
        messagesPagination: {
          ...state.messagesPagination,
          [action.payload.contextId]: {
            hasMore: action.payload.hasMore,
            offset: action.payload.offset,
          },
        },
      };
    case 'ADD_MESSAGE': {
      const { contextId, message } = action.payload;
      const existingMessages = state.messages[contextId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [contextId]: [...existingMessages, message],
        },
      };
    }
    case 'UPDATE_MESSAGE': {
      const { messageId, content } = action.payload;
      const contextMessages = state.messages[action.payload.contextId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.contextId]: contextMessages.map(msg =>
            msg.id === messageId ? { ...msg, content } : msg
          ),
        },
      };
    }
    case 'SET_CONTEXTS':
      return {
        ...state,
        contexts: action.payload,
      };
    case 'ADD_CONTEXT':
      return {
        ...state,
        contexts: [...state.contexts, action.payload],
      };
    case 'REMOVE_CONTEXT': {
      const filteredContexts = state.contexts.filter(ctx => ctx.id !== action.payload);
      const newActiveId = state.activeContextId === action.payload ? null : state.activeContextId;
      const { [action.payload]: _removedMessages, ...remainingMessages } = state.messages;
      return {
        ...state,
        contexts: filteredContexts,
        activeContextId: newActiveId,
        messages: remainingMessages,
      };
    }
    case 'START_STREAMING':
      return { ...state, isStreaming: true, streamingMessageId: action.payload };
    case 'STOP_STREAMING':
      return { ...state, isStreaming: false, streamingMessageId: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOADING_MORE':
      return { ...state, isLoadingMore: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const initialState: ChatState = {
  messages: {},
  messagesPagination: {},
  contexts: [],
  activeContextId: null,
  isStreaming: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  streamingMessageId: null,
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, isExtension = false }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Convert database context to chat context
  const convertToContext = (dbContext: DatabaseContext): ChatContextType => ({
    id: dbContext.id,
    name: dbContext.name,
    description: `Created ${new Date(dbContext.created_at).toLocaleDateString()}`,
    icon: 'Brain',
  });

  // Load contexts from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshContexts();
    }
  }, [isAuthenticated, user]);

  // Load messages when context is selected
  useEffect(() => {
    if (state.activeContextId && !state.messages[state.activeContextId]) {
      loadMessages(state.activeContextId);
    }
  }, [state.activeContextId]);

  const refreshContexts = async (): Promise<void> => {
    if (!user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const dbContexts = await ContextService.getUserContexts(user.id, isExtension);
      const contexts = dbContexts.map(convertToContext);
      dispatch({ type: 'SET_CONTEXTS', payload: contexts });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load contexts';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Failed to refresh contexts:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const selectContext = (contextId: string) => {
    dispatch({ type: 'SELECT_CONTEXT', payload: contextId });
  };

  const loadMessages = async (contextId: string): Promise<void> => {
    try {
      // Load the latest 10 messages for initial view
      const { messages, totalCount } = await MessageService.getLatestMessages(contextId, 10, isExtension);
      const hasMore = totalCount > 10;
      const offset = Math.max(0, totalCount - 10);
      
      dispatch({ type: 'SET_MESSAGES', payload: { contextId, messages } });
      dispatch({ type: 'SET_PAGINATION', payload: { contextId, hasMore, offset } });
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load chat history');
    }
  };

  const loadMoreMessages = async (contextId: string): Promise<void> => {
    const pagination = state.messagesPagination[contextId];
    if (!pagination || !pagination.hasMore || state.isLoadingMore) return;

    dispatch({ type: 'SET_LOADING_MORE', payload: true });

    try {
      // Load older messages (before the current offset)
      const newOffset = Math.max(0, pagination.offset - 10);
      const limit = pagination.offset - newOffset;
      
      const { messages, hasMore } = await MessageService.getContextMessages(
        contextId, 
        limit,
        newOffset,
        isExtension
      );
      
      dispatch({ type: 'PREPEND_MESSAGES', payload: { contextId, messages } });
      dispatch({ 
        type: 'SET_PAGINATION', 
        payload: { 
          contextId, 
          hasMore: newOffset > 0,
          offset: newOffset
        } 
      });
    } catch (error) {
      console.error('Failed to load more messages:', error);
      toast.error('Failed to load more messages');
    } finally {
      dispatch({ type: 'SET_LOADING_MORE', payload: false });
    }
  };
  const sendMessage = async (content: string): Promise<void> => {
    if (!state.activeContextId) {
      toast.error('Please select a context first');
      return;
    }

    let assistantMessage: Message | undefined;

    try {
      // Save user message to database
      const userMessage = await MessageService.createMessage(
        state.activeContextId,
        'user',
        content,
        isExtension
      );

      dispatch({
        type: 'ADD_MESSAGE',
        payload: { contextId: state.activeContextId, message: userMessage },
      });

      // Create initial assistant message
      assistantMessage = await MessageService.createMessage(
        state.activeContextId,
        'assistant',
        '',
        isExtension
      );

      dispatch({
        type: 'ADD_MESSAGE',
        payload: { contextId: state.activeContextId, message: assistantMessage },
      });

      // Start streaming
      dispatch({ type: 'START_STREAMING', payload: assistantMessage.id });

      // Get conversation history for OpenAI
      const contextMessages = state.messages[state.activeContextId] || [];
      const conversationHistory = [
        ...contextMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        })),
        { role: 'user' as const, content },
      ];

      // Stream response from OpenAI with RAG context
      const openaiService = getOpenAIService();
      let fullResponse = '';
      let chunkBuffer = '';
      const CHUNK_DELAY = 50; // Delay between character chunks for smooth streaming

      for await (const chunk of openaiService.streamChatCompletion(conversationHistory, state.activeContextId, isExtension)) {
        chunkBuffer += chunk;
        
        // Process characters one by one with a small delay for smooth streaming
        while (chunkBuffer.length > 0) {
          // Take 1-3 characters at a time for natural streaming feel
          const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, chunkBuffer.length);
          const nextChars = chunkBuffer.slice(0, charsToAdd);
          chunkBuffer = chunkBuffer.slice(charsToAdd);
          
          fullResponse += nextChars;
          
          // Update the message in real-time with delay
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              contextId: state.activeContextId,
              messageId: assistantMessage.id,
              content: fullResponse,
            },
          });
          
          // Add delay between character chunks for smooth streaming
          if (chunkBuffer.length > 0) {
            await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY));
          }
        }
      }

      // Save the final response to the database
      await MessageService.updateMessage(assistantMessage.id, fullResponse, isExtension);

    } catch (error) {
      toast.error('Failed to send message');
      
      // If there was an error, remove the incomplete assistant message
      if (assistantMessage) {
        try {
          await MessageService.deleteMessage(assistantMessage.id, isExtension);
        } catch (deleteError) {
          // Silently fail if we can't delete the incomplete message
        }
      }
    } finally {
      dispatch({ type: 'STOP_STREAMING' });
    }
  };

  const addContext = async (contextData: { name: string; description?: string }): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const dbContext = await ContextService.createContext(contextData, isExtension);
      const newContext = convertToContext(dbContext);
      dispatch({ type: 'ADD_CONTEXT', payload: newContext });
      
      // Auto-select the newly created context
      dispatch({ type: 'SELECT_CONTEXT', payload: newContext.id });
      
      return newContext.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create context';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteContext = async (contextId: string): Promise<void> => {
    try {
      await ContextService.deleteContext(contextId, isExtension);
      dispatch({ type: 'REMOVE_CONTEXT', payload: contextId });
      toast.success('Context deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete context';
      toast.error(errorMessage);
      throw error;
    }
  };

  const getCurrentMessages = (): Message[] => {
    if (!state.activeContextId) return [];
    return state.messages[state.activeContextId] || [];
  };

  return (
    <ChatContext.Provider
      value={{
        ...state,
        selectContext,
        sendMessage,
        addContext,
        deleteContext,
        getCurrentMessages,
        refreshContexts,
        loadMessages,
        loadMoreMessages,
        isExtension,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
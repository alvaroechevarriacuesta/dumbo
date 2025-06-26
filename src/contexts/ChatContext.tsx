import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ContextService } from '../services/contextService';
import type { Message, ChatContext as ChatContextType } from '../types/chat';
import type { DatabaseContext } from '../types/database';

interface ChatSession {
  id: string;
  contextId: string;
  messages: Message[];
  lastActivity: Date;
}

interface ChatState {
  sessions: Record<string, ChatSession>;
  contexts: ChatContextType[];
  activeContextId: string | null;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ChatContextValue extends ChatState {
  selectContext: (contextId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  addContext: (context: { name: string; description?: string }) => Promise<void>;
  deleteContext: (contextId: string) => Promise<void>;
  getCurrentMessages: () => Message[];
  refreshContexts: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

type ChatAction =
  | { type: 'SELECT_CONTEXT'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { contextId: string; message: Message } }
  | { type: 'SET_CONTEXTS'; payload: ChatContextType[] }
  | { type: 'ADD_CONTEXT'; payload: ChatContextType }
  | { type: 'REMOVE_CONTEXT'; payload: string }
  | { type: 'START_STREAMING' }
  | { type: 'STOP_STREAMING' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_SESSIONS'; payload: Record<string, ChatSession> };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SELECT_CONTEXT':
      return {
        ...state,
        activeContextId: action.payload,
      };
    case 'ADD_MESSAGE':
      const { contextId, message } = action.payload;
      const sessionId = contextId;
      const existingSession = state.sessions[sessionId];
      
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            id: sessionId,
            contextId,
            messages: existingSession ? [...existingSession.messages, message] : [message],
            lastActivity: new Date(),
          },
        },
      };
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
    case 'REMOVE_CONTEXT':
      const filteredContexts = state.contexts.filter(ctx => ctx.id !== action.payload);
      const newActiveId = state.activeContextId === action.payload ? null : state.activeContextId;
      return {
        ...state,
        contexts: filteredContexts,
        activeContextId: newActiveId,
      };
    case 'START_STREAMING':
      return { ...state, isStreaming: true };
    case 'STOP_STREAMING':
      return { ...state, isStreaming: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOAD_SESSIONS':
      return { ...state, sessions: action.payload };
    default:
      return state;
  }
};

const initialState: ChatState = {
  sessions: {},
  contexts: [],
  activeContextId: null,
  isStreaming: false,
  isLoading: false,
  error: null,
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('chatSessions');
    
    if (stored) {
      try {
        const sessions = JSON.parse(stored);
        // Convert date strings back to Date objects
        Object.values(sessions).forEach((session: any) => {
          session.lastActivity = new Date(session.lastActivity);
          session.messages.forEach((message: any) => {
            message.timestamp = new Date(message.timestamp);
          });
        });
        dispatch({ type: 'LOAD_SESSIONS', payload: sessions });
      } catch (error) {
        console.error('Failed to load chat sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(state.sessions));
  }, [state.sessions]);

  const refreshContexts = async (): Promise<void> => {
    if (!user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const dbContexts = await ContextService.getUserContexts(user.id);
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

  const sendMessage = async (content: string): Promise<void> => {
    if (!state.activeContextId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: 'user',
      context: state.activeContextId,
    };

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { contextId: state.activeContextId, message: userMessage },
    });

    // Simulate AI response with streaming
    dispatch({ type: 'START_STREAMING' });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const responseContent = `I'm ready to help you with this context. How can I assist you today?`;

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: responseContent,
      timestamp: new Date(),
      sender: 'assistant',
      context: state.activeContextId,
    };

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { contextId: state.activeContextId, message: assistantMessage },
    });

    dispatch({ type: 'STOP_STREAMING' });
  };

  const addContext = async (contextData: { name: string; description?: string }): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const dbContext = await ContextService.createContext(contextData);
      const newContext = convertToContext(dbContext);
      dispatch({ type: 'ADD_CONTEXT', payload: newContext });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create context';
      throw new Error(errorMessage);
    }
  };

  const deleteContext = async (contextId: string): Promise<void> => {
    try {
      await ContextService.deleteContext(contextId);
      dispatch({ type: 'REMOVE_CONTEXT', payload: contextId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete context';
      throw new Error(errorMessage);
    }
  };

  const getCurrentMessages = (): Message[] => {
    if (!state.activeContextId) return [];
    const session = state.sessions[state.activeContextId];
    return session ? session.messages : [];
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
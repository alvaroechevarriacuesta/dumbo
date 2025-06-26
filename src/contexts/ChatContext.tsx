import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Message, ChatContext as ChatContextType } from '../types/chat';

const defaultContexts: ChatContextType[] = [
  {
    id: 'general',
    name: 'General Chat',
    description: 'General purpose conversation',
    icon: 'Brain',
  },
  {
    id: 'coding',
    name: 'Code Assistant',
    description: 'Programming help and code review',
    icon: 'Code',
  },
  {
    id: 'learning',
    name: 'Learning Tutor',
    description: 'Educational support and explanations',
    icon: 'BookOpen',
  },
  {
    id: 'creative',
    name: 'Creative Writing',
    description: 'Creative writing and brainstorming',
    icon: 'Lightbulb',
  },
  {
    id: 'productivity',
    name: 'Productivity Coach',
    description: 'Task management and productivity tips',
    icon: 'Zap',
  },
];

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
}

interface ChatContextValue extends ChatState {
  selectContext: (contextId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  addContext: (context: Omit<ChatContextType, 'id'>) => Promise<void>;
  getCurrentMessages: () => Message[];
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

type ChatAction =
  | { type: 'SELECT_CONTEXT'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { contextId: string; message: Message } }
  | { type: 'ADD_CONTEXT'; payload: ChatContextType }
  | { type: 'START_STREAMING' }
  | { type: 'STOP_STREAMING' }
  | { type: 'LOAD_SESSIONS'; payload: Record<string, ChatSession> }
  | { type: 'LOAD_CONTEXTS'; payload: ChatContextType[] };

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
    case 'ADD_CONTEXT':
      return {
        ...state,
        contexts: [...state.contexts, action.payload],
      };
    case 'START_STREAMING':
      return { ...state, isStreaming: true };
    case 'STOP_STREAMING':
      return { ...state, isStreaming: false };
    case 'LOAD_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'LOAD_CONTEXTS':
      return { ...state, contexts: action.payload };
    default:
      return state;
  }
};

const initialState: ChatState = {
  sessions: {},
  contexts: defaultContexts,
  activeContextId: null,
  isStreaming: false,
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load sessions from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('chatSessions');
    const storedContexts = localStorage.getItem('chatContexts');
    
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
    
    if (storedContexts) {
      try {
        const contexts = JSON.parse(storedContexts);
        dispatch({ type: 'LOAD_CONTEXTS', payload: contexts });
      } catch (error) {
        console.error('Failed to load chat contexts:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(state.sessions));
  }, [state.sessions]);

  // Save contexts to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('chatContexts', JSON.stringify(state.contexts));
  }, [state.contexts]);

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

    const responses = {
      general: `I'm here to help with any questions or tasks you have. I can assist with:

- **General conversation** and answering questions
- **Problem solving** and brainstorming
- **Information** on a wide variety of topics
- **Analysis** and explanations

What would you like to discuss?`,
      coding: `I can help you with programming questions, code review, debugging, and best practices. Here are some ways I can assist:

## Programming Support
- **Code review** and optimization
- **Debugging** help and troubleshooting
- **Best practices** and design patterns
- **Language-specific** guidance

\`\`\`javascript
// Example: I can help with code like this
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

What coding challenge are you working on?`,
      learning: `I'm ready to help you learn! I can explain concepts, provide examples, and guide you through complex topics.

### Learning Support
1. **Concept explanations** with examples
2. **Step-by-step breakdowns** of complex topics
3. **Practice problems** and exercises
4. **Study strategies** and tips

> *"Learning is a treasure that will follow its owner everywhere."* - Chinese Proverb

What would you like to explore?`,
      creative: `Let's unleash your creativity! I can help with writing, brainstorming, storytelling, and creative projects.

## Creative Areas
- **Writing** - stories, poems, scripts
- **Brainstorming** - ideas and concepts
- **Character development** and world-building
- **Creative problem solving**

*Ready to bring your ideas to life?* What's your creative vision?`,
      productivity: `I'm here to help you optimize your workflow and boost productivity. 

### Productivity Areas
- [ ] **Task management** and organization
- [ ] **Time management** strategies
- [ ] **Workflow optimization**
- [ ] **Goal setting** and tracking

**Pro tip:** Start with small, manageable tasks to build momentum!

What tasks or goals would you like to tackle more efficiently?`,
    };

    const responseContent = responses[state.activeContextId as keyof typeof responses] || 
      "I'm ready to assist you with this context. How can I help?";

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

  const addContext = async (contextData: Omit<ChatContextType, 'id'>): Promise<void> => {
    const newContext: ChatContextType = {
      ...contextData,
      id: `custom-${Date.now()}`,
    };
    
    dispatch({ type: 'ADD_CONTEXT', payload: newContext });
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
        getCurrentMessages,
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
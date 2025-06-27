import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { extensionSupabase as supabase } from '../../lib/extension-supabase';
import type { User, LoginCredentials, SignupCredentials, AuthState } from '../../types/auth';

interface ExtensionAuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const ExtensionAuthContext = createContext<ExtensionAuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const ExtensionAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing session in Chrome storage
    const checkSession = async () => {
      try {
        dispatch({ type: 'AUTH_START' });
        
        // First check Chrome storage for cached session
        const result = await chrome.storage.local.get(['supabase_session']);
        const cachedSession = result.supabase_session;
        
        if (cachedSession) {
          // Validate cached session with Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user && !error) {
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              username: session.user.user_metadata?.username || session.user.email!.split('@')[0],
              avatar: session.user.user_metadata?.avatar_url,
              createdAt: new Date(session.user.created_at),
            };
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
            return;
          }
        }
        
        // No valid session found
        dispatch({ type: 'AUTH_ERROR', payload: 'No active session' });
      } catch (error) {
        console.error('Session check error:', error);
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to check authentication status' });
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Store session in Chrome storage
          await chrome.storage.local.set({
            supabase_session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
              user: session.user
            }
          });
          
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.username || session.user.email!.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            createdAt: new Date(session.user.created_at),
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else if (event === 'SIGNED_OUT') {
          // Clear session from Chrome storage
          await chrome.storage.local.remove(['supabase_session']);
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        // Store session in Chrome storage
        await chrome.storage.local.set({
          supabase_session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: data.user
          }
        });

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          username: data.user.user_metadata?.username || data.user.email!.split('@')[0],
          avatar: data.user.user_metadata?.avatar_url,
          createdAt: new Date(data.user.created_at),
        };
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Login failed' });
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        if (data.session) {
          // Store session in Chrome storage
          await chrome.storage.local.set({
            supabase_session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              user: data.user
            }
          });

          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            username: credentials.username,
            avatar: data.user.user_metadata?.avatar_url,
            createdAt: new Date(data.user.created_at),
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Signup failed' });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      
      // Clear session from Chrome storage
      await chrome.storage.local.remove(['supabase_session']);
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      await chrome.storage.local.remove(['supabase_session']);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  return (
    <ExtensionAuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </ExtensionAuthContext.Provider>
  );
};

export const useExtensionAuth = (): ExtensionAuthContextType => {
  const context = useContext(ExtensionAuthContext);
  if (context === undefined) {
    throw new Error('useExtensionAuth must be used within an ExtensionAuthProvider');
  }
  return context;
};
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { chromeStorage } from '../lib/chrome-storage';
import type { User, LoginCredentials, SignupCredentials, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  isLoading: true, // Start with loading true to check session
  error: null,
};

export const ExtensionAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing session from Chrome storage first, then Supabase
    const checkSession = async () => {
      try {
        dispatch({ type: 'AUTH_START' });
        
        // First try to get auth data from Chrome storage
        const storedUser = await chromeStorage.get('user');
        const storedAuthToken = await chromeStorage.get('authToken');
        
        if (storedUser && storedAuthToken) {
          // Set the session in Supabase with stored token
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: storedAuthToken as string,
            refresh_token: (await chromeStorage.get('refreshToken')) as string || '',
          });
          
          if (error) {
            console.error('Error setting session from storage:', error);
            // Clear invalid stored data
            await chromeStorage.clear();
            dispatch({ type: 'AUTH_ERROR', payload: 'Invalid stored session' });
            return;
          }

          if (session?.user) {
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

        // Fallback to regular Supabase session check
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          dispatch({ type: 'AUTH_ERROR', payload: error.message });
          return;
        }

        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.username || session.user.email!.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            createdAt: new Date(session.user.created_at),
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
          
          // Save to Chrome storage
          await chromeStorage.set('user', user);
          await chromeStorage.set('authToken', session.access_token);
          await chromeStorage.set('refreshToken', session.refresh_token);
        } else {
          dispatch({ type: 'AUTH_ERROR', payload: 'No active session' });
        }
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
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.username || session.user.email!.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            createdAt: new Date(session.user.created_at),
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
          
          // Save to Chrome storage
          await chromeStorage.set('user', user);
          await chromeStorage.set('authToken', session.access_token);
          await chromeStorage.set('refreshToken', session.refresh_token);
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'AUTH_LOGOUT' });
          // Clear Chrome storage
          await chromeStorage.clear();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update stored tokens
          await chromeStorage.set('authToken', session.access_token);
          await chromeStorage.set('refreshToken', session.refresh_token);
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
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          username: data.user.user_metadata?.username || data.user.email!.split('@')[0],
          avatar: data.user.user_metadata?.avatar_url,
          createdAt: new Date(data.user.created_at),
        };
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        
        // Save to Chrome storage
        await chromeStorage.set('user', user);
        await chromeStorage.set('authToken', data.session.access_token);
        await chromeStorage.set('refreshToken', data.session.refresh_token);
      }
    } catch (error: unknown) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
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
        // If email confirmation is disabled, user will be automatically signed in
        if (data.session) {
          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            username: credentials.username,
            avatar: data.user.user_metadata?.avatar_url,
            createdAt: new Date(data.user.created_at),
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
          
          // Save to Chrome storage
          await chromeStorage.set('user', user);
          await chromeStorage.set('authToken', data.session.access_token);
          await chromeStorage.set('refreshToken', data.session.refresh_token);
        } else {
          // Email confirmation required
          dispatch({ type: 'AUTH_LOGOUT' });
          // You might want to show a message about email confirmation
        }
      }
    } catch (error: unknown) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'Signup failed' });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      dispatch({ type: 'AUTH_LOGOUT' });
      // Clear Chrome storage
      await chromeStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
      await chromeStorage.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useExtensionAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useExtensionAuth must be used within an ExtensionAuthProvider');
  }
  return context;
}; 
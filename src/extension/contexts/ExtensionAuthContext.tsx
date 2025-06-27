import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
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
        isLoading: false,
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
    // Check for existing session
    const checkSession = async () => {
      try {
        console.log('ExtensionAuthContext - Starting session check');
        dispatch({ type: 'AUTH_START' });
        
        // Get current session from Supabase (which uses Chrome storage)
        console.log('ExtensionAuthContext - Getting session from Supabase');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('ExtensionAuthContext - Session result:', { session: !!session, error: !!error });
        
        if (session?.user && !error) {
          console.log('ExtensionAuthContext - Valid session found, user:', session.user.email);
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
        
        // No valid session found - this is normal, not an error
        console.log('ExtensionAuthContext - No valid session found, setting to logged out');
        dispatch({ type: 'AUTH_LOGOUT' });
      } catch (error) {
        console.error('ExtensionAuthContext - Session check error:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    checkSession();

    // Listen for auth changes
    console.log('ExtensionAuthContext - Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('ExtensionAuthContext - Auth state change:', event, 'session:', !!session);
        if (event === 'SIGNED_IN' && session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.username || session.user.email!.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            createdAt: new Date(session.user.created_at),
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else if (event === 'SIGNED_OUT') {
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
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          username: data.user.user_metadata?.username || data.user.email!.split('@')[0],
          avatar: data.user.user_metadata?.avatar_url,
          createdAt: new Date(data.user.created_at),
        };
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
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
    } catch (error) {
      console.error('Logout error:', error);
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
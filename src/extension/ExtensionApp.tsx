import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { extensionSupabase } from '../lib/extension-supabase';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ExtensionChatProvider } from './contexts/ExtensionChatContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ExtensionAuthPage from './pages/ExtensionAuthPage';
import ExtensionChatPage from './pages/ExtensionChatPage';

function ExtensionApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('ExtensionApp - Starting session check');
    
    // Check current session
    extensionSupabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('ExtensionApp - getSession response:', { session: !!session, error: !!error });
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = extensionSupabase.auth.onAuthStateChange((event, session) => {
      console.log('ExtensionApp - Auth state changed:', { event, session: !!session });
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      console.log('ExtensionApp - Cleaning up auth listeners');
      subscription.unsubscribe();
    };
  }, []);

  console.log('ExtensionApp - RENDER - isLoading:', isLoading, 'session:', !!session);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <div className="h-full flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-secondary-600 dark:text-secondary-400">
                Checking authentication...
              </p>
            </div>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (!session) {
    console.log('ExtensionApp - No session found, showing login page');
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <ExtensionAuthPage />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  console.log('ExtensionApp - Session found, rendering chat page with user:', session.user.email);
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ExtensionChatProvider>
          <SidebarProvider>
            <ExtensionChatPage />
          </SidebarProvider>
        </ExtensionChatProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default ExtensionApp;
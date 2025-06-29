import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { extensionSupabase } from '../lib/extension-supabase';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ExtensionChatProvider } from './contexts/ExtensionChatContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ExtensionAuthPage from './pages/ExtensionAuthPage';
import ExtensionPopup from './components/ExtensionPopup';

function PopupApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [domText, setDomText] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    console.log('PopupApp - Starting session check');
    
    // Check current session
    extensionSupabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('PopupApp - getSession response:', { session: !!session, error: !!error });
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = extensionSupabase.auth.onAuthStateChange((event, session) => {
      console.log('PopupApp - Auth state changed:', { event, session: !!session });
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      console.log('PopupApp - Cleaning up auth listeners');
      subscription.unsubscribe();
    };
  }, []);

  // Listen for messages from content script and check for stored data
  useEffect(() => {
    const handleMessage = (message: { type: string; domText?: string }) => {
      if (message.type === 'SHOW_POPUP') {
        console.log('PopupApp - Received SHOW_POPUP message:', message);
        setDomText(message.domText || '');
      }
    };

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener(handleMessage);

    // Check for stored popup data
    chrome.storage.local.get(['popupData'], (result) => {
      if (result.popupData) {
        console.log('PopupApp - Found stored popup data:', result.popupData);
        const { domText, originalUrl, originalTitle } = result.popupData;
        if (domText) setDomText(domText);
        if (originalUrl) setOriginalUrl(originalUrl);
        if (originalTitle) setPageTitle(originalTitle);
        // Clear the stored data
        chrome.storage.local.remove(['popupData']);
      }
    });

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  console.log('PopupApp - RENDER - isLoading:', isLoading, 'session:', !!session);

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
    console.log('PopupApp - No session found, showing login page');
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <ExtensionAuthPage />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  console.log('PopupApp - Session found, rendering popup with user:', session.user.email);
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ExtensionChatProvider>
          <ExtensionPopup
            isOpen={true}
            onClose={() => window.close()}
            domText={domText}
            originalUrl={originalUrl}
            pageTitle={pageTitle}
          />
        </ExtensionChatProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default PopupApp; 
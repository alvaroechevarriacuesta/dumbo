import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { extensionSupabase } from '../../lib/extension-supabase';

const ExtensionDebug: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current session
    extensionSupabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = extensionSupabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">Extension Debug</h3>
      <div className="space-y-1 text-sm">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {session ? 'Yes' : 'No'}</div>
        {session && <div>User: {session.user.email}</div>}
      </div>
    </div>
  );
};

export default ExtensionDebug; 
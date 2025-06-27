import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExtensionAuthProvider } from './contexts/ExtensionAuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ChatProvider } from '../contexts/ChatContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ExtensionProtectedRoute from './components/ExtensionProtectedRoute';
import ExtensionAuthPage from './pages/ExtensionAuthPage';
import ExtensionChatPage from './pages/ExtensionChatPage';

function ExtensionApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ExtensionAuthProvider>
          <ChatProvider>
            <SidebarProvider>
              <Router>
                <div className="ExtensionApp h-full">
                  <Routes>
                    <Route path="/auth" element={<ExtensionAuthPage />} />
                    <Route
                      path="/"
                      element={
                        <ExtensionProtectedRoute>
                          <ExtensionChatPage />
                        </ExtensionProtectedRoute>
                      }
                    />
                  </Routes>
                </div>
              </Router>
            </SidebarProvider>
          </ChatProvider>
        </ExtensionAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default ExtensionApp;
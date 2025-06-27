import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExtensionAuthProvider } from '../contexts/ExtensionAuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ChatProvider } from '../contexts/ChatContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AuthPage from '../pages/AuthPage';
import ChatPage from '../pages/ChatPage';

function ExtensionApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ExtensionAuthProvider>
          <ChatProvider>
            <SidebarProvider>
              <Router>
                <div className="App">
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <ChatPage />
                        </ProtectedRoute>
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
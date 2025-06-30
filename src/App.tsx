import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ChatProvider } from './contexts/ChatContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider isExtension={false}>
          <ChatProvider isExtension={false}>
            <SidebarProvider>
              <Router>
                <div className="App">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                      path="/chat"
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
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
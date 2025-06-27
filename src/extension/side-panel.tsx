import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import '../index.css';
import ExtensionApp from './ExtensionApp';

const root = document.getElementById('extension-root');
if (!root) {
  throw new Error('Extension root element not found');
}

createRoot(root).render(
  <StrictMode>
    <ExtensionApp />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-background)',
          color: 'var(--color-foreground)',
          border: '1px solid var(--color-border)',
        },
      }}
    />
  </StrictMode>,
);
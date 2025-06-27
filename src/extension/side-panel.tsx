import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import '../index.css';
import ExtensionApp from './ExtensionApp';

console.log('Side panel entry point - Starting');

const root = document.getElementById('extension-root');
if (!root) {
  console.error('Extension root element not found');
  throw new Error('Extension root element not found');
}

console.log('Side panel entry point - Root element found, rendering ExtensionApp');

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

console.log('Side panel entry point - ExtensionApp rendered');
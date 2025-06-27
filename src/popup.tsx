import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import PopupApp from './extension/PopupApp';

console.log('Popup entry point - Starting');

const root = document.getElementById('popup-root');
if (!root) {
  console.error('Popup root element not found');
  throw new Error('Popup root element not found');
}

console.log('Popup entry point - Root element found, rendering PopupApp');

createRoot(root).render(
  <StrictMode>
    <PopupApp />
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

console.log('Popup entry point - PopupApp rendered'); 
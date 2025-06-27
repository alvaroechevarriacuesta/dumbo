import { useContext } from 'react';
import { ExtensionChatContext } from '../contexts/ExtensionChatContext';
import type { ChatContextValue } from '../contexts/ExtensionChatContext';

export const useExtensionChat = (): ChatContextValue => {
  const context = useContext(ExtensionChatContext);
  if (context === undefined) {
    throw new Error('useExtensionChat must be used within an ExtensionChatProvider');
  }
  return context;
}; 
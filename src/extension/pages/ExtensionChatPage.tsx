import React from 'react';
import ExtensionLayout from '../components/ExtensionLayout';
import ChatInterface from '../../components/chat/ChatInterface';

const ExtensionChatPage: React.FC = () => {
  return (
    <ExtensionLayout>
      <ChatInterface />
    </ExtensionLayout>
  );
};

export default ExtensionChatPage;
import React from 'react';
import ExtensionLayout from '../components/ExtensionLayout';
import ExtensionChatInterface from '../components/ExtensionChatInterface';

const ExtensionChatPage: React.FC = () => {
  return (
    <ExtensionLayout>
      <ExtensionChatInterface />
    </ExtensionLayout>
  );
};

export default ExtensionChatPage;
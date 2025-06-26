import React from 'react';
import Layout from '../components/layout/Layout';
import ChatInterface from '../components/chat/ChatInterface';

const ChatPage: React.FC = () => {
  return (
    <Layout>
      <ChatInterface />
    </Layout>
  );
};

export default ChatPage;
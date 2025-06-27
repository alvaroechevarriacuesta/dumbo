import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useChat } from '../../contexts/ChatContext';
import Button from '../ui/Button';
import WelcomeScreen from './WelcomeScreen';
import RAGIndicator from './RAGIndicator';
import 'highlight.js/styles/github-dark.css';

const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const { 
    activeContextId, 
    getCurrentMessages, 
    sendMessage, 
    isStreaming, 
    loadMoreMessages,
    isLoadingMore,
    messagesPagination
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = getCurrentMessages();
  const hasMessages = messages.length > 0;
  const pagination = activeContextId ? messagesPagination[activeContextId] : null;
  const hasMoreMessages = pagination?.hasMore || false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when context changes or messages are first loaded
  useEffect(() => {
    if (activeContextId && hasMessages) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [activeContextId, hasMessages]);

  // Auto-scroll when streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [isStreaming, messages.length]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isStreaming || !activeContextId) return;
    
    await sendMessage(message);
    setMessage('');
  };

  const handleLoadMore = async () => {
    if (!activeContextId || isLoadingMore) return;
    
    // Store current scroll position
    const container = messagesContainerRef.current;
    const scrollHeight = container?.scrollHeight || 0;
    
    await loadMoreMessages(activeContextId);
    
    // Restore scroll position after new messages are loaded
    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - scrollHeight;
        container.scrollTop = scrollDiff;
      }
    }, 100);
  };

  if (!activeContextId) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-full flex flex-col relative bg-white dark:bg-secondary-900">
      {/* Chat Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto pb-32">
        {hasMessages ? (
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Load More Button */}
            {hasMoreMessages && (
              <div className="flex justify-center mb-8">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingMore}
                  className="flex items-center space-x-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Load more messages</span>
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <div className="space-y-12">
              {messages.map((msg, index) => (
                <div key={msg.id} className="group">
                  {/* Message Content */}
                  <div className={`${msg.sender === 'user' ? 'flex justify-end' : 'mr-auto max-w-none'}`}>
                    {msg.sender === 'user' ? (
                      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-3xl px-6 py-4 border border-primary-100 dark:border-primary-800 max-w-2xl inline-block">
                        <p className="text-secondary-900 dark:text-secondary-100 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-secondary-900 dark:prose-headings:text-secondary-100 prose-p:text-secondary-800 dark:prose-p:text-secondary-200 prose-p:leading-relaxed prose-p:mb-6 prose-strong:text-secondary-900 dark:prose-strong:text-secondary-100 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-pre:bg-secondary-100 dark:prose-pre:bg-secondary-800 prose-pre:border prose-pre:border-secondary-200 dark:prose-pre:border-secondary-700 prose-ul:mb-6 prose-ol:mb-6 prose-li:mb-2 prose-h1:mb-6 prose-h2:mb-6 prose-h3:mb-4 prose-h4:mb-4 prose-blockquote:mb-6">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            code: ({ className, children, ...props }) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const language = match ? match[1] : '';
                              return (
                                <div className="relative">
                                  {language && (
                                    <div className="absolute top-0 right-0 px-3 py-1 text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900 border-b border-l border-secondary-200 dark:border-secondary-700 rounded-bl-md font-mono">
                                      {language}
                                    </div>
                                  )}
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </div>
                              );
                            },
                            pre: ({ children, ...props }) => (
                              <pre
                                className="bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 overflow-x-auto mb-6 relative"
                                {...props}
                              >
                                {children}
                              </pre>
                            ),
                            p: ({ children, ...props }) => (
                              <p className="mb-6 leading-relaxed" {...props}>
                                {children}
                              </p>
                            ),
                            ul: ({ children, ...props }) => (
                              <ul className="mb-6 space-y-2 list-disc list-inside" {...props}>
                                {children}
                              </ul>
                            ),
                            ol: ({ children, ...props }) => (
                              <ol className="mb-6 space-y-2 list-decimal list-inside" {...props}>
                                {children}
                              </ol>
                            ),
                            li: ({ children, ...props }) => (
                              <li className="mb-2 leading-relaxed" {...props}>
                                {children}
                              </li>
                            ),
                            h1: ({ children, ...props }) => (
                              <h1 className="mb-6 mt-8 first:mt-0 text-3xl font-bold text-secondary-900 dark:text-white border-b border-secondary-200 dark:border-secondary-700 pb-2" {...props}>
                                {children}
                              </h1>
                            ),
                            h2: ({ children, ...props }) => (
                              <h2 className="mb-6 mt-8 first:mt-0 text-2xl font-semibold text-secondary-900 dark:text-white" {...props}>
                                {children}
                              </h2>
                            ),
                            h3: ({ children, ...props }) => (
                              <h3 className="mb-4 mt-6 first:mt-0 text-xl font-semibold text-secondary-900 dark:text-white" {...props}>
                                {children}
                              </h3>
                            ),
                            h4: ({ children, ...props }) => (
                              <h4 className="mb-3 mt-4 first:mt-0 text-lg font-medium text-secondary-900 dark:text-white" {...props}>
                                {children}
                              </h4>
                            ),
                            h5: ({ children, ...props }) => (
                              <h5 className="mb-3 mt-4 first:mt-0 text-base font-medium text-secondary-900 dark:text-white" {...props}>
                                {children}
                              </h5>
                            ),
                            h6: ({ children, ...props }) => (
                              <h6 className="mb-3 mt-4 first:mt-0 text-sm font-medium text-secondary-900 dark:text-white" {...props}>
                                {children}
                              </h6>
                            ),
                            blockquote: ({ children, ...props }) => (
                              <blockquote className="mb-6 border-l-4 border-primary-300 dark:border-primary-600 pl-6 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-r-lg italic text-secondary-700 dark:text-secondary-300" {...props}>
                                {children}
                              </blockquote>
                            ),
                            table: ({ children, ...props }) => (
                              <div className="mb-6 overflow-x-auto">
                                <table className="min-w-full border border-secondary-200 dark:border-secondary-700 rounded-lg" {...props}>
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children, ...props }) => (
                              <thead className="bg-secondary-100 dark:bg-secondary-800" {...props}>
                                {children}
                              </thead>
                            ),
                            th: ({ children, ...props }) => (
                              <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-white border-b border-secondary-200 dark:border-secondary-700" {...props}>
                                {children}
                              </th>
                            ),
                            td: ({ children, ...props }) => (
                              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700" {...props}>
                                {children}
                              </td>
                            ),
                            hr: ({ ...props }) => (
                              <hr className="my-8 border-secondary-200 dark:border-secondary-700" {...props} />
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isStreaming && (
                <div className="group">
                  <div className="mr-auto max-w-none">
                    <div className="flex items-center space-x-3 py-6">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-secondary-500 dark:text-secondary-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">
                Start a conversation
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6 leading-relaxed">
                Ask me anything about this context. I'll provide detailed, comprehensive responses to help with your questions and tasks.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Message Input - Constrained to main content area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-secondary-900 dark:via-secondary-900 dark:to-transparent pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden">
            <form onSubmit={handleSendMessage} className="flex items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                  placeholder="Type your message..."
                  className="w-full px-6 py-4 pr-4 resize-none focus:outline-none bg-transparent text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-secondary-500 transition-all duration-200"
                  style={{ minHeight: '60px', maxHeight: '120px' }}
                  rows={1}
                  disabled={isStreaming}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              <div className="p-4">
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-xl flex-shrink-0 disabled:opacity-50"
                  disabled={!message.trim() || isStreaming}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
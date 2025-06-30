import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Send, ChevronUp } from 'lucide-react';
import { useExtensionChat } from '../hooks/useExtensionChat';
import Button from '../../components/ui/Button';
import ExtensionWelcomeScreen from './ExtensionWelcomeScreen';
import 'highlight.js/styles/github-dark.css';

const ExtensionChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const { 
    activeContextId, 
    getCurrentMessages, 
    sendMessage, 
    isStreaming, 
    loadMoreMessages,
    isLoadingMore,
    messagesPagination
  } = useExtensionChat();
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
    return <ExtensionWelcomeScreen />;
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
              {messages.map((msg) => (
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
                          rehypePlugins={[rehypeRaw, rehypeHighlight]}
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
                              <h4 className="mb-4 mt-6 first:mt-0 text-lg font-semibold text-secondary-900 dark:text-white" {...props}>
                                {children}
                              </h4>
                            ),
                            blockquote: ({ children, ...props }) => (
                              <blockquote className="border-l-4 border-primary-500 pl-4 italic text-secondary-700 dark:text-secondary-300 mb-6" {...props}>
                                {children}
                              </blockquote>
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
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-2">
                Start a conversation
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400">
                Send your first message to begin chatting with the AI assistant.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700 p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-4 py-3 text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 min-h-[44px] max-h-[120px]"
                rows={1}
                disabled={isStreaming}
              />
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || isStreaming}
              className="flex-shrink-0"
            >
              {isStreaming ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Scroll to bottom anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ExtensionChatInterface; 
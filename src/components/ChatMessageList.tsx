import React, { useRef, useEffect } from 'react';
import ChatMessage, { ChatMessageProps } from './ChatMessage';

export interface ChatMessageListProps {
  messages: ChatMessageProps[];
  className?: string;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, className = '' }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`chat-messages-container ${className}`}>
      <div className="chat-messages-list">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#f0f0f0" />
                <path
                  d="M16 20L24 28L32 20"
                  stroke="#999"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="chat-empty-text">Start a conversation with AI</p>
            <p className="chat-empty-subtext">
              Ask me to help you organize content, create projects, or generate learning paths.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              id={message.id}
              content={message.content}
              sender={message.sender}
              timestamp={message.timestamp}
              status={message.status}
              isTyping={message.isTyping}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessageList;

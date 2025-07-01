import React from 'react';

export interface ChatMessageProps {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error' | undefined;
  isTyping?: boolean | undefined;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  timestamp,
  status = 'sent',
  isTyping = false,
}) => {
  const isUser = sender === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-ai'}`}>
      <div className="chat-message-avatar">
        {isUser ? (
          <div className="chat-avatar-user">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="6" r="3" fill="currentColor" />
              <path
                d="M2 14c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        ) : (
          <div className="chat-avatar-ai">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L9.5 5.5L13 7L9.5 8.5L8 12L6.5 8.5L3 7L6.5 5.5L8 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="chat-message-content">
        <div className="chat-message-bubble">
          {isTyping ? (
            <div className="chat-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <div className="chat-message-text">{content}</div>
          )}
        </div>

        <div className="chat-message-meta">
          <span className="chat-message-time">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isUser && (
            <span className={`chat-message-status chat-message-status-${status}`}>
              {status === 'sending' && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                  />
                </svg>
              )}
              {status === 'sent' && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {status === 'error' && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M6 3V7M6 9V9.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

import React, { useState } from 'react';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import { ChatMessageProps } from './ChatMessage';
import '../styles/global.css';
import { ConversationalAgent } from '../agents/conversational';
import { v4 as uuidv4 } from 'uuid';

const agent = new ConversationalAgent();

const ChatIconButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="chat-fab" onClick={onClick} aria-label="Open chat">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <rect x="9" y="12" width="14" height="8" rx="2" stroke="#222" strokeWidth="2" />
      <path d="M9 20L7 24L13 20" stroke="#222" strokeWidth="2" strokeLinejoin="round" />
      <rect x="12" y="15" width="8" height="2" rx="1" fill="#222" />
    </svg>
  </button>
);

const ChatModal: React.FC<{
  onClose: () => void;
  onMinimize: () => void;
  messages: ChatMessageProps[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
}> = ({ onClose, onMinimize, messages, onSendMessage, isTyping }) => (
  <div className="chat-modal">
    <div className="chat-modal-header">
      <span>AI Chat Interface</span>
      <div className="chat-modal-actions">
        <button className="chat-modal-btn" onClick={onMinimize} aria-label="Minimize chat">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="3" y="13" width="10" height="2" rx="1" fill="#222" />
          </svg>
        </button>
        <button className="chat-modal-btn" onClick={onClose} aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M4 4L12 12M12 4L4 12" stroke="#222" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
    <ChatMessageList messages={messages} isTyping={isTyping} />
    <ChatInput onSendMessage={onSendMessage} />
  </div>
);

const ChatInterface: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      id: '1',
      content:
        "Hello! I'm here to help you organize your learning content and create personalized learning paths.",
      sender: 'ai',
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
    },
    {
      id: '2',
      content: 'Hi! Can you help me add some content to my learning library?',
      sender: 'user',
      timestamp: new Date(Date.now() - 30000), // 30 seconds ago
      status: 'sent',
    },
    {
      id: '3',
      content:
        'Of course! I can help you add content in several ways:\n\n1. **Manual entry** - You can provide the title, description, and URL\n2. **AI-assisted** - I can help extract information from URLs\n3. **Batch import** - You can share multiple links at once\n\nWhat would you prefer?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (message: string) => {
    // Add user message with sending status
    const userMessage: ChatMessageProps = {
      id: uuidv4(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Simulate network delay and update status
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg)),
      );
    }, 500);

    // Show typing indicator
    setIsTyping(true);

    // Add an empty AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        content: '',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);

    try {
      let aiContent = '';
      for await (const chunk of agent.streamResponse(message)) {
        aiContent += chunk;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: aiContent } : msg)),
        );
      }
      setIsTyping(false);
    } catch (error: any) {
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your request. Please try again.',
              }
            : msg,
        ),
      );
    }
  };

  return (
    <>
      {!open && <ChatIconButton onClick={() => setOpen(true)} />}
      {open && (
        <ChatModal
          onClose={() => setOpen(false)}
          onMinimize={() => setOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
      )}
    </>
  );
};

export default ChatInterface;

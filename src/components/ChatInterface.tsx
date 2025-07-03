import React, { useState, useEffect } from 'react';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import { ChatMessageProps } from './ChatMessage';
import '../styles/global.css';
import { sendAgentMessage } from '../agents/conversational';
import { v4 as uuidv4 } from 'uuid';

const ChatIconButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="chat-fab" onClick={onClick} aria-label="Open chat">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" className="chat-fab__bg" />
      <rect x="9" y="12" width="14" height="8" rx="2" className="chat-fab__icon" strokeWidth="2" />
      <path
        d="M9 20L7 24L13 20"
        className="chat-fab__icon"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="12" y="15" width="8" height="2" rx="1" className="chat-fab__icon-fill" />
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
            <rect x="3" y="13" width="10" height="2" rx="1" className="chat-modal-btn__icon" />
          </svg>
        </button>
        <button className="chat-modal-btn" onClick={onClose} aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M4 4L12 12M12 4L4 12" className="chat-modal-btn__icon" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
    <ChatMessageList messages={messages} isTyping={isTyping} />
    <ChatInput onSendMessage={onSendMessage} />
  </div>
);

const ChatInterface: React.FC<{
  autoOpen?: boolean;
  onClose?: () => void;
  onLearningRequestAdded?: () => void;
}> = ({ autoOpen = false, onClose, onLearningRequestAdded }) => {
  const [open, setOpen] = useState(autoOpen);
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      id: '1',
      content: 'What do you want to learn about?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Watch for autoOpen prop changes
  useEffect(() => {
    setOpen(autoOpen);
  }, [autoOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose?.(); // Call the callback if provided
  };

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

    try {
      // Use the new sendAgentMessage function
      const response = await sendAgentMessage({
        message,
        sessionId: 'chat-session',
      });

      // Add AI response
      const aiMessage: ChatMessageProps = {
        id: uuidv4(),
        content: response as string,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);

      // Check if this response indicates a new learning request was created
      // The conversational agent responds with "I've saved your learning request" when complete
      if (typeof response === 'string' && response.includes("I've saved your learning request")) {
        // Call the callback to refresh the learning requests
        onLearningRequestAdded?.();
      }
    } catch (error: any) {
      console.error('Detailed error in ChatInterface:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setIsTyping(false);

      // Add error message with more details
      const errorMessage: ChatMessageProps = {
        id: uuidv4(),
        content: `Error: ${error.message || 'Unknown error occurred'}. Check the console for details.`,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <>
      {!open && <ChatIconButton onClick={() => setOpen(true)} />}
      {open && (
        <ChatModal
          onClose={handleClose}
          onMinimize={handleClose}
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
      )}
    </>
  );
};

export default ChatInterface;

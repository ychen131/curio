import React, { useState } from 'react';
import '../styles/global.css';

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
}> = ({ onClose, onMinimize }) => (
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
    <div className="chat-messages">
      <div className="chat-placeholder">Chat coming soon...</div>
    </div>
    <div className="chat-input-row">
      <input
        type="text"
        className="chat-input"
        placeholder="Type a message... (disabled)"
        disabled
      />
      <button className="chat-send-btn" disabled>
        Send
      </button>
    </div>
  </div>
);

const ChatInterface: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && <ChatIconButton onClick={() => setOpen(true)} />}
      {open && <ChatModal onClose={() => setOpen(false)} onMinimize={() => setOpen(false)} />}
    </>
  );
};

export default ChatInterface;

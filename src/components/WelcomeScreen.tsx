import React from 'react';
import '../styles/global.css';

type AppView = 'welcome' | 'dashboard';

interface WelcomeScreenProps {
  onNavigate: (view: AppView) => void;
  onOpenChat: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate, onOpenChat }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1 className="welcome-title">Curio</h1>
          <p className="welcome-subtitle">Your personal learning assistant</p>
        </div>

        <div className="welcome-actions">
          <button className="action-button" onClick={onOpenChat}>
            <div className="action-icon">🚀</div>
            <div className="action-text">
              <h2 className="action-title">Learn new subject</h2>
              <p className="action-description">Add something new to your learning collection.</p>
            </div>
          </button>

          <button className="action-button" onClick={() => onNavigate('dashboard')}>
            <div className="action-icon">📚</div>
            <div className="action-text">
              <h2 className="action-title">View my subjects</h2>
              <p className="action-description">See what you're currently learning.</p>
            </div>
          </button>
        </div>

        <div className="theme-toggle">
          <button className="theme-toggle-btn" aria-label="Toggle theme">
            ☀️
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;

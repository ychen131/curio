import React, { useState, useEffect } from 'react';
import WelcomeScreen from './WelcomeScreen';
import Dashboard from './Dashboard';
import { initializeAPIKey } from '../services/initialize-api-key';
import '../styles/global.css';

// App view types for routing
type AppView = 'welcome' | 'dashboard';

const App: React.FC = () => {
  // View routing state
  const [currentView, setCurrentView] = useState<AppView>('welcome');

  // Chat auto-open state for dashboard
  const [shouldOpenChat, setShouldOpenChat] = useState(false);

  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, fallback to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Removed test-related state - now using production Dashboard component

  // Helper function to navigate to dashboard with chat
  const openChatInDashboard = () => {
    setCurrentView('dashboard');
    setShouldOpenChat(true);
  };

  // Helper function to open chat when already on dashboard
  const openChatInCurrentDashboard = () => {
    setShouldOpenChat(true);
  };

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Initialize API key on app startup
  useEffect(() => {
    initializeAPIKey().catch(console.error);
  }, []);

  // Apply theme to document body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize app and determine starting view
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // [SIMPLIFIED FOR MVP] Instead of a dedicated count function,
        // we'll just fetch all topics and check the array length.
        // This reuses the logic the dashboard will need anyway.
        const allTopics = await window.electronAPI.getAllLearningRequests();

        if (allTopics && allTopics.length > 0) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('welcome');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Default to welcome screen on error
        setCurrentView('welcome');
      }
    };

    initializeApp();
  }, []);

  // Removed test functions - now using production Dashboard component

  // Render welcome screen
  const renderWelcomeScreen = () => (
    <WelcomeScreen
      onNavigate={setCurrentView}
      onOpenChat={openChatInDashboard}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
    />
  );

  // Render dashboard with the new Dashboard component
  const renderDashboard = () => (
    <Dashboard
      onNavigateToWelcome={() => setCurrentView('welcome')}
      onOpenChat={openChatInCurrentDashboard}
      shouldOpenChat={shouldOpenChat}
      onChatClose={() => setShouldOpenChat(false)}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
    />
  );

  return (
    <div className="app-container">
      {currentView === 'welcome' && renderWelcomeScreen()}
      {currentView === 'dashboard' && renderDashboard()}
    </div>
  );
};

export default App;

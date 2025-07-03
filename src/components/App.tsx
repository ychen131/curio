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

  // Learning requests state management
  const [learningRequests, setLearningRequests] = useState<any[]>([]);
  const [learningRequestsLoading, setLearningRequestsLoading] = useState(false);

  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, fallback to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Function to load learning requests
  const loadLearningRequests = async () => {
    setLearningRequestsLoading(true);
    try {
      const allRequests = await window.electronAPI.getAllLearningRequests();
      setLearningRequests(allRequests || []);
    } catch (error) {
      console.error('Failed to load learning requests:', error);
      setLearningRequests([]);
    } finally {
      setLearningRequestsLoading(false);
    }
  };

  // Function to refresh learning requests (to be called when new ones are added)
  const refreshLearningRequests = async () => {
    await loadLearningRequests();
  };

  // Helper function to navigate to dashboard with chat
  const openChatInDashboard = () => {
    setCurrentView('dashboard');
    setShouldOpenChat(true);
  };

  // Helper function to open chat when already on dashboard
  const openChatInCurrentDashboard = () => {
    setShouldOpenChat(true);
  };

  // Helper function to close chat and refresh learning requests
  const handleChatClose = async () => {
    setShouldOpenChat(false);
    // Refresh learning requests when chat is closed to pick up any new ones
    await refreshLearningRequests();
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

  // Load learning requests on app startup
  useEffect(() => {
    loadLearningRequests();
  }, []);

  // Initialize app and determine starting view
  useEffect(() => {
    if (learningRequests.length > 0) {
      setCurrentView('dashboard');
    } else if (!learningRequestsLoading) {
      setCurrentView('welcome');
    }
  }, [learningRequests, learningRequestsLoading]);

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
      onChatClose={handleChatClose}
      isDarkMode={isDarkMode}
      onToggleTheme={toggleTheme}
      learningRequests={learningRequests}
      onRefreshLearningRequests={refreshLearningRequests}
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

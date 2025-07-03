import React, { useState, useEffect } from 'react';
import TopicSidebar from './TopicSidebar';
import ContentPane from './ContentPane';
import ChatInterface from './ChatInterface';
import '../styles/global.css';

interface Topic {
  id: string;
  subject: string;
  category: string;
  lessonPlanId?: string;
  status?: string;
  createdAt: string;
}

interface DashboardProps {
  onNavigateToWelcome: () => void;
  onOpenChat: () => void;
  shouldOpenChat: boolean;
  onChatClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToWelcome,
  onOpenChat,
  shouldOpenChat,
  onChatClose,
  isDarkMode,
  onToggleTheme,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>();

  // Load topics and select the first one by default
  useEffect(() => {
    const loadTopics = async () => {
      try {
        if (window.electronAPI?.getAllLearningRequests) {
          const learningRequests = await window.electronAPI.getAllLearningRequests();
          const formattedTopics = learningRequests.map((request: any) => ({
            id: request._id,
            subject: request.subject,
            category: request.category,
            lessonPlanId: request.lessonPlanId,
            status: request.status,
            createdAt: request.createdAt,
          }));

          setTopics(formattedTopics);

          // Auto-select the first topic if none is selected
          if (formattedTopics.length > 0 && !selectedTopicId) {
            setSelectedTopicId(formattedTopics[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
      }
    };

    loadTopics();
  }, [selectedTopicId]);

  // Update selected topic when selectedTopicId changes
  useEffect(() => {
    if (selectedTopicId) {
      const topic = topics.find((t) => t.id === selectedTopicId);
      setSelectedTopic(topic);
    } else {
      setSelectedTopic(undefined);
    }
  }, [selectedTopicId, topics]);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
  };

  const handleLessonPlanGenerated = () => {
    // Reload topics to refresh any updated lesson plan status
    // This will trigger the useEffect above
    setSelectedTopicId(selectedTopicId); // Force refresh
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <button className="dashboard__menu-btn" aria-label="Menu">
            <span className="dashboard__menu-icon">☰</span>
          </button>
          <h1 className="dashboard__title">Curio</h1>
        </div>

        <div className="dashboard__header-right">
          <button className="dashboard__add-btn" onClick={onOpenChat} aria-label="Add new topic">
            <span className="dashboard__add-icon">+</span>
          </button>
          <button
            className="dashboard__theme-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className="dashboard__theme-icon">{isDarkMode ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard__main">
        {/* Sidebar */}
        <aside className="dashboard__sidebar">
          <TopicSidebar
            selectedTopicId={selectedTopicId || undefined}
            onTopicSelect={handleTopicSelect}
          />
        </aside>

        {/* Content */}
        <main className="dashboard__content">
          <ContentPane
            selectedTopicId={selectedTopicId || undefined}
            selectedTopicSubject={selectedTopic?.subject || undefined}
            onLessonPlanGenerated={handleLessonPlanGenerated}
          />
        </main>
      </div>

      {/* Chat Interface */}
      <ChatInterface autoOpen={shouldOpenChat} onClose={onChatClose} />
    </div>
  );
};

export default Dashboard;

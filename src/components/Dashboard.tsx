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
  learningRequests: any[];
  onRefreshLearningRequests: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToWelcome,
  onOpenChat,
  shouldOpenChat,
  onChatClose,
  isDarkMode,
  onToggleTheme,
  learningRequests,
  onRefreshLearningRequests,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>();

  // Convert learning requests to topics format whenever they change
  useEffect(() => {
    const formattedTopics =
      learningRequests?.map((request: any) => ({
        id: request._id,
        subject: request.subject,
        category: request.category,
        lessonPlanId: request.lessonPlanId,
        status: request.status,
        createdAt: request.createdAt,
      })) || [];

    setTopics(formattedTopics);

    // Auto-select the first topic if none is selected and we have topics
    if (formattedTopics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(formattedTopics[0]?.id);
    }
    // If the currently selected topic no longer exists, clear the selection
    else if (selectedTopicId && !formattedTopics.find((t) => t.id === selectedTopicId)) {
      setSelectedTopicId(formattedTopics.length > 0 ? formattedTopics[0]?.id : undefined);
    }
  }, [learningRequests, selectedTopicId]);

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

  const handleLessonPlanGenerated = async () => {
    // Refresh learning requests to get any updated lesson plan status
    await onRefreshLearningRequests();
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
            topics={topics}
            onTopicDeleted={onRefreshLearningRequests}
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
      <ChatInterface
        autoOpen={shouldOpenChat}
        onClose={onChatClose}
        onLearningRequestAdded={onRefreshLearningRequests}
      />
    </div>
  );
};

export default Dashboard;

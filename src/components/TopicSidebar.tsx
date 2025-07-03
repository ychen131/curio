import React, { useState, useEffect } from 'react';
import '../styles/global.css';

interface Topic {
  id: string;
  subject: string;
  category: string;
  lessonPlanId?: string;
  status?: string;
  createdAt: string;
}

interface TopicSidebarProps {
  selectedTopicId?: string | undefined;
  onTopicSelect: (topicId: string) => void;
}

const TopicSidebar: React.FC<TopicSidebarProps> = ({ selectedTopicId, onTopicSelect }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

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
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  const isTopicCompleted = (topic: Topic) => {
    return topic.lessonPlanId && topic.status === 'completed';
  };

  const isTopicSelected = (topicId: string) => {
    return selectedTopicId === topicId;
  };

  if (loading) {
    return (
      <div className="topic-sidebar">
        <div className="topic-sidebar__header">
          <h2 className="topic-sidebar__title">TO LEARN</h2>
        </div>
        <div className="topic-sidebar__loading">
          <div className="topic-sidebar__spinner"></div>
          <p>Loading topics...</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="topic-sidebar">
        <div className="topic-sidebar__header">
          <h2 className="topic-sidebar__title">TO LEARN</h2>
        </div>
        <div className="topic-sidebar__empty">
          <div className="topic-sidebar__empty-icon">📚</div>
          <p className="topic-sidebar__empty-text">No topics yet</p>
          <p className="topic-sidebar__empty-subtext">Add a new subject to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-sidebar">
      <div className="topic-sidebar__header">
        <h2 className="topic-sidebar__title">TO LEARN</h2>
      </div>

      <nav className="topic-sidebar__nav">
        {topics.map((topic) => (
          <button
            key={topic.id}
            className={`topic-item ${isTopicSelected(topic.id) ? 'topic-item--selected' : ''} ${
              isTopicCompleted(topic) ? 'topic-item--completed' : ''
            }`}
            onClick={() => onTopicSelect(topic.id)}
            aria-label={`Select ${topic.subject} topic`}
          >
            <div className="topic-item__content">
              <span className="topic-item__title">{topic.subject}</span>
              <span className="topic-item__category">{topic.category}</span>
            </div>

            {isTopicCompleted(topic) && (
              <div className="topic-item__status">
                <span className="topic-item__checkmark">✓</span>
              </div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TopicSidebar;

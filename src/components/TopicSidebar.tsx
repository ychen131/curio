import React, { useState, useEffect, useRef } from 'react';
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
  topics: Topic[];
  onTopicDeleted?: () => void;
}

// Context Menu Component
const ContextMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
}> = ({ isOpen, onClose, onDelete, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 1000,
      }}
    >
      <button className="context-menu__item context-menu__item--danger" onClick={onDelete}>
        <span className="context-menu__icon">🗑️</span>
        Delete
      </button>
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subjectName: string;
}> = ({ isOpen, onClose, onConfirm, subjectName }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus the dialog for accessibility
      dialogRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        tabIndex={-1}
      >
        <div className="dialog__header">
          <h2 id="dialog-title" className="dialog__title">
            Delete '{subjectName}'?
          </h2>
        </div>
        <div className="dialog__body">
          <p id="dialog-description" className="dialog__description">
            Are you sure you want to permanently delete this subject and all its curated resources?
            This action cannot be undone.
          </p>
        </div>
        <div className="dialog__footer">
          <button className="dialog__button dialog__button--primary" onClick={onClose} autoFocus>
            Cancel
          </button>
          <button className="dialog__button dialog__button--danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const TopicSidebar: React.FC<TopicSidebarProps> = ({
  selectedTopicId,
  onTopicSelect,
  topics,
  onTopicDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    topicId: string;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    topicId: '',
    position: { x: 0, y: 0 },
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    topicId: string;
    subjectName: string;
  }>({
    isOpen: false,
    topicId: '',
    subjectName: '',
  });
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  const isTopicCompleted = (topic: Topic) => {
    return topic.lessonPlanId && topic.status === 'completed';
  };

  const isTopicSelected = (topicId: string) => {
    return selectedTopicId === topicId;
  };

  const handleMenuClick = (event: React.MouseEvent, topicId: string) => {
    event.stopPropagation(); // Prevent topic selection
    const rect = event.currentTarget.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      topicId,
      position: {
        x: rect.left,
        y: rect.bottom + 5,
      },
    });
  };

  const handleDeleteClick = () => {
    const topic = topics.find((t) => t.id === contextMenu.topicId);
    if (topic) {
      setConfirmDialog({
        isOpen: true,
        topicId: contextMenu.topicId,
        subjectName: topic.subject,
      });
    }
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmDelete = async () => {
    const topicId = confirmDialog.topicId;
    setDeletingTopicId(topicId);

    try {
      await window.electronAPI.deleteLearningRequest(topicId);
      console.log('Learning request deleted successfully:', topicId);

      // Call the callback to refresh the learning requests
      onTopicDeleted?.();
    } catch (error) {
      console.error('Failed to delete learning request:', error);
      // You might want to show an error message to the user here
    } finally {
      setDeletingTopicId(null);
      setConfirmDialog({
        isOpen: false,
        topicId: '',
        subjectName: '',
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      topicId: '',
      subjectName: '',
    });
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
          <div
            key={topic.id}
            className={`topic-item-wrapper ${
              deletingTopicId === topic.id ? 'topic-item-wrapper--deleting' : ''
            }`}
          >
            <button
              className={`topic-item ${isTopicSelected(topic.id) ? 'topic-item--selected' : ''} ${
                isTopicCompleted(topic) ? 'topic-item--completed' : ''
              }`}
              onClick={() => onTopicSelect(topic.id)}
              aria-label={`Select ${topic.subject} topic`}
              disabled={deletingTopicId === topic.id}
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

            {deletingTopicId !== topic.id && (
              <button
                className="topic-item__menu-button"
                onClick={(e) => handleMenuClick(e, topic.id)}
                aria-label={`Options for ${topic.subject}`}
              >
                <span className="topic-item__menu-icon">⋯</span>
              </button>
            )}

            {deletingTopicId === topic.id && (
              <div className="topic-item__deleting">
                <div className="topic-item__spinner"></div>
              </div>
            )}
          </div>
        ))}
      </nav>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={closeContextMenu}
        onDelete={handleDeleteClick}
        position={contextMenu.position}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDelete}
        subjectName={confirmDialog.subjectName}
      />
    </div>
  );
};

export default TopicSidebar;

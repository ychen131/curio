import React, { useState, useEffect } from 'react';
import '../styles/global.css';

interface CuratedResource {
  title: string;
  url: string;
  summary: string;
  completed?: boolean;
}

interface LessonPlan {
  _id: string;
  learningRequestId: string;
  resources: CuratedResource[];
  createdAt: string;
  updatedAt: string;
}

interface ContentPaneProps {
  selectedTopicId?: string | undefined;
  selectedTopicSubject?: string | undefined;
  onLessonPlanGenerated?: () => void;
}

const ContentPane: React.FC<ContentPaneProps> = ({
  selectedTopicId,
  selectedTopicSubject,
  onLessonPlanGenerated,
}) => {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceCompletionStatus, setResourceCompletionStatus] = useState<{
    [key: string]: boolean;
  }>({});

  // Load lesson plan when topic is selected
  useEffect(() => {
    if (!selectedTopicId) {
      setLessonPlan(null);
      return;
    }

    const loadLessonPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        if (window.electronAPI?.getAllLessonPlans) {
          const allPlans = await window.electronAPI.getAllLessonPlans();
          const topicPlan = allPlans.find(
            (plan: LessonPlan) => plan.learningRequestId === selectedTopicId,
          );
          setLessonPlan(topicPlan || null);
        }
      } catch (err) {
        console.error('Failed to load lesson plan:', err);
        setError('Failed to load lesson plan');
      } finally {
        setLoading(false);
      }
    };

    loadLessonPlan();
  }, [selectedTopicId]);

  const handleGenerateLessonPlan = async () => {
    if (!selectedTopicId) return;

    setGenerating(true);
    setError(null);

    try {
      // Get the learning request to pass to lesson planner
      if (window.electronAPI?.getAllLearningRequests) {
        const requests = await window.electronAPI.getAllLearningRequests();
        const learningRequest = requests.find((req: any) => req._id === selectedTopicId);

        if (learningRequest) {
          const result = await window.electronAPI.invokeLessonPlanner(learningRequest);

          if (result.success && result.lessonPlan) {
            // Reload the lesson plans to get the newly created one
            const allPlans = await window.electronAPI.getAllLessonPlans();
            const newPlan = allPlans.find(
              (plan: LessonPlan) => plan.learningRequestId === selectedTopicId,
            );
            setLessonPlan(newPlan || null);
            onLessonPlanGenerated?.();
          } else {
            setError(result.error || 'Failed to generate lesson plan');
          }
        } else {
          setError('Learning request not found');
        }
      }
    } catch (err) {
      console.error('Failed to generate lesson plan:', err);
      setError('Failed to generate lesson plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResourceToggle = (resourceIndex: number) => {
    const resourceKey = `${selectedTopicId}-${resourceIndex}`;
    setResourceCompletionStatus((prev) => ({
      ...prev,
      [resourceKey]: !prev[resourceKey],
    }));
  };

  const isResourceCompleted = (resourceIndex: number): boolean => {
    const resourceKey = `${selectedTopicId}-${resourceIndex}`;
    return resourceCompletionStatus[resourceKey] || false;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="content-pane">
        <div className="content-pane__loading">
          <div className="content-pane__spinner"></div>
          <p>Loading lesson plan...</p>
        </div>
      </div>
    );
  }

  // Show empty state when no topic is selected
  if (!selectedTopicId) {
    return (
      <div className="content-pane">
        <div className="content-pane__empty">
          <div className="content-pane__empty-icon">📖</div>
          <h2 className="content-pane__empty-title">Select a topic to get started</h2>
          <p className="content-pane__empty-text">
            Choose a topic from the sidebar to view or create your lesson plan.
          </p>
        </div>
      </div>
    );
  }

  // Show empty state when topic has no lesson plan
  if (!lessonPlan) {
    return (
      <div className="content-pane">
        <div className="content-pane__empty">
          <div className="content-pane__empty-icon">📚</div>
          <h2 className="content-pane__empty-title">
            You're ready to learn about {selectedTopicSubject}!
          </h2>
          <p className="content-pane__empty-text">
            No lesson plan has been created for this topic yet.
          </p>

          {error && <div className="content-pane__error">{error}</div>}

          <button
            className="content-pane__cta-button"
            onClick={handleGenerateLessonPlan}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="content-pane__button-spinner"></div>
                Generating...
              </>
            ) : (
              <>
                <span className="content-pane__button-icon">✨</span>
                Curate My Lesson Plan
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Show lesson plan with resources
  return (
    <div className="content-pane">
      <div className="content-pane__header">
        <h1 className="content-pane__title">{selectedTopicSubject}</h1>
        <p className="content-pane__subtitle">{lessonPlan.resources.length} curated resources</p>
      </div>

      <div className="content-pane__resources">
        {lessonPlan.resources.map((resource, index) => (
          <div key={index} className="resource-card">
            <div className="resource-card__content">
              <input
                type="checkbox"
                className="resource-card__checkbox"
                checked={isResourceCompleted(index)}
                onChange={() => handleResourceToggle(index)}
                aria-label={`Mark "${resource.title}" as complete`}
              />
              <div className="resource-card__body">
                <div className="resource-card__header">
                  <h3 className="resource-card__title">{resource.title}</h3>
                  <button
                    className="resource-card__link-btn"
                    onClick={() => handleOpenLink(resource.url)}
                    aria-label={`Open "${resource.title}" in new tab`}
                  >
                    <span className="resource-card__link-icon">🔗</span>
                    Open Link
                  </button>
                </div>
                <p className="resource-card__summary">{resource.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentPane;

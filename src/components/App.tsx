import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ContentList from './ContentList';
import DetailPane from './DetailPane';
import ChatInterface from './ChatInterface';
import { initializeAPIKey } from '../services/initialize-api-key';
import { LearningRequestDoc, CuratedResource } from '../services/schemas';
import '../styles/global.css';

const App: React.FC = () => {
  const [dbTestResult, setDbTestResult] = useState<string>('');
  const [learningRequests, setLearningRequests] = useState<any[]>([]);
  const [showLearningRequests, setShowLearningRequests] = useState(false);
  const [lessonPlanResult, setLessonPlanResult] = useState<string>('');
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<CuratedResource[] | null>(null);

  // Initialize API key on app startup
  useEffect(() => {
    initializeAPIKey().catch(console.error);
  }, []);

  const testDatabase = async () => {
    try {
      if (window.electronAPI?.testDatabase) {
        const result = await window.electronAPI.testDatabase();
        setDbTestResult(result.message);
      } else {
        setDbTestResult('Database API not available');
      }
    } catch (error) {
      setDbTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadLearningRequests = async () => {
    try {
      if (window.electronAPI?.getAllLearningRequests) {
        const requests = await window.electronAPI.getAllLearningRequests();
        setLearningRequests(requests);
        setShowLearningRequests(true);
      } else {
        setDbTestResult('Learning requests API not available');
      }
    } catch (error) {
      setDbTestResult(
        `Error loading learning requests: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  const handleTestLessonPlanner = async () => {
    const sampleRequest: LearningRequestDoc = {
      _id: `request-${Date.now()}`,
      type: 'learningRequest',
      subject: 'React Hooks',
      category: 'Web Development',
      learningPreference: 'core_concepts',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Sending test request to main process:', sampleRequest);
    setLessonPlanResult('🔄 Testing lesson planner agent...');
    setGeneratedLessonPlan(null);

    try {
      // Use the IPC handler we'll set up in main.ts
      const result = await window.electronAPI.invokeLessonPlanner(sampleRequest);
      console.log('Agent execution result:', result);

      if (result.success) {
        console.log('Generated lesson plan:', result.lessonPlan);
        console.log('For learning request:', result.learningRequestId);
        setLessonPlanResult(
          `✅ Lesson planner succeeded! Generated ${result.lessonPlan?.length || 0} curated resources.`,
        );
        setGeneratedLessonPlan(result.lessonPlan || null);
      } else {
        setLessonPlanResult(`❌ Lesson planner failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Agent execution failed:', error);
      setLessonPlanResult(
        `❌ Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Curio</h1>
        <p>AI-powered learning productivity tool</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={testDatabase}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Test Database
          </button>
          <button
            onClick={loadLearningRequests}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28A745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            View Learning Requests
          </button>
          <button
            onClick={handleTestLessonPlanner}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Test Lesson Planner
          </button>
          <button
            onClick={() => setShowLearningRequests(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6C757D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Hide
          </button>
        </div>
        {dbTestResult && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: dbTestResult.includes('successful') ? '#E8F5E8' : '#FFE8E8',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {dbTestResult}
          </div>
        )}
        {lessonPlanResult && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: lessonPlanResult.includes('✅') ? '#E8F5E8' : '#FFE8E8',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {lessonPlanResult}
          </div>
        )}
        {generatedLessonPlan && (
          <div
            style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#F0F8FF',
              borderRadius: '6px',
              fontSize: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
              Generated Lesson Plan ({generatedLessonPlan.length} resources)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {generatedLessonPlan.map((resource, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #B0C4DE',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#FF6B35' }}>
                    {index + 1}. {resource.title}
                  </div>
                  <div style={{ color: '#007AFF', fontSize: '11px', marginTop: '2px' }}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.url}
                    </a>
                  </div>
                  <div style={{ color: '#6C757D', fontSize: '11px', marginTop: '4px' }}>
                    {resource.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showLearningRequests && (
          <div
            style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#F8F9FA',
              borderRadius: '6px',
              fontSize: '12px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
              Learning Requests ({learningRequests.length})
            </h3>
            {learningRequests.length === 0 ? (
              <p style={{ margin: 0, color: '#6C757D' }}>
                No learning requests found. Try completing a conversation in the chat!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {learningRequests.map((request, index) => (
                  <div
                    key={request._id || index}
                    style={{
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #DEE2E6',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#007AFF' }}>
                      {request.subject} ({request.category})
                    </div>
                    <div style={{ color: '#6C757D', marginTop: '2px' }}>
                      Learning focus: {request.learningPreference?.replace('_', ' ')}
                    </div>
                    <div style={{ color: '#6C757D', fontSize: '11px', marginTop: '2px' }}>
                      Created: {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </header>
      <main className="app-main">
        <div className="three-pane-layout">
          <Sidebar />
          <ContentList />
          <DetailPane />
        </div>
        <ChatInterface />
      </main>
    </div>
  );
};

export default App;

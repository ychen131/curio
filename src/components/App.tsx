import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ContentList from './ContentList';
import DetailPane from './DetailPane';
import ChatInterface from './ChatInterface';
import '../styles/global.css';

const App: React.FC = () => {
  const [dbTestResult, setDbTestResult] = useState<string>('');

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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Curio</h1>
        <p>AI-powered learning productivity tool</p>
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

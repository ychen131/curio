import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ContentList from './ContentList';
import DetailPane from './DetailPane';
import ChatInterface from './ChatInterface';
import '../styles/global.css';

// TEMPORARY: Types for preload CRUD API
interface ContentDoc {
  _id: string;
  type: 'content';
  title: string;
  description: string;
  url?: string;
  categoryIds: string[];
  projectId?: string;
  tags?: string[];
  priority?: number;
  status?: 'inbox' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    electronAPI?: any;
  }
}

const App: React.FC = () => {
  const [dbTestResult, setDbTestResult] = useState<string>('');
  // TEMPORARY: State for CRUD test panel
  const [contentList, setContentList] = useState<ContentDoc[]>([]);
  const [crudMessage, setCrudMessage] = useState<string>('');

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

  // TEMPORARY: CRUD handlers
  const createSampleContent = async () => {
    setCrudMessage('');
    const now = new Date().toISOString();
    const doc: ContentDoc = {
      _id: 'content:' + Math.random().toString(36).slice(2, 10),
      type: 'content',
      title: 'Sample Content ' + new Date().toLocaleTimeString(),
      description: 'This is a test content item.',
      categoryIds: [],
      createdAt: now,
      updatedAt: now,
    };
    try {
      const result = await window.electronAPI.createContent(doc);
      setCrudMessage('Created: ' + result.title);
      listAllContent();
    } catch (e) {
      setCrudMessage('Create failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const listAllContent = async () => {
    setCrudMessage('');
    try {
      const list = await window.electronAPI.getAllContent();
      setContentList(list);
      setCrudMessage('Listed ' + list.length + ' items.');
    } catch (e) {
      setCrudMessage('List failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const updateFirstContent = async () => {
    setCrudMessage('');
    if (contentList.length === 0) {
      setCrudMessage('No content to update.');
      return;
    }
    const doc = {
      ...contentList[0],
      title: contentList[0].title + ' (updated)',
      updatedAt: new Date().toISOString(),
    };
    try {
      const result = await window.electronAPI.updateContent(doc);
      setCrudMessage('Updated: ' + result.title);
      listAllContent();
    } catch (e) {
      setCrudMessage('Update failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const deleteFirstContent = async () => {
    setCrudMessage('');
    if (contentList.length === 0) {
      setCrudMessage('No content to delete.');
      return;
    }
    try {
      await window.electronAPI.deleteContent(contentList[0]._id);
      setCrudMessage('Deleted: ' + contentList[0].title);
      listAllContent();
    } catch (e) {
      setCrudMessage('Delete failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
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
        {/* TEMPORARY: CRUD TEST PANEL */}
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: '#FFFBEA',
            border: '1px solid #FFD700',
            borderRadius: 8,
          }}
        >
          <strong>Temporary Content CRUD Test Panel</strong>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={createSampleContent}>Create Sample</button>
            <button onClick={listAllContent}>List All</button>
            <button onClick={updateFirstContent}>Update First</button>
            <button onClick={deleteFirstContent}>Delete First</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>{crudMessage}</div>
          <ul style={{ marginTop: 8, fontSize: 12 }}>
            {contentList.map((item) => (
              <li key={item._id}>
                <b>{item.title}</b> — {item.description}{' '}
                <span style={{ color: '#888' }}>({item._id})</span>
              </li>
            ))}
          </ul>
        </div>
        {/* END TEMPORARY PANEL */}
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

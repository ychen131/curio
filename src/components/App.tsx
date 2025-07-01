import React from 'react';
import Sidebar from './Sidebar';
import ContentList from './ContentList';
import DetailPane from './DetailPane';
import '../styles/global.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Curio</h1>
        <p>AI-powered learning productivity tool</p>
      </header>
      <main className="app-main">
        <div className="three-pane-layout">
          <Sidebar />
          <ContentList />
          <DetailPane />
        </div>
      </main>
    </div>
  );
};

export default App;

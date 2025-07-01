import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h2>Navigation</h2>
      <nav>
        <ul>
          <li>
            <a href="#inbox">Inbox</a>
          </li>
          <li>
            <a href="#all-content">All Content</a>
          </li>
          <li>
            <a href="#learning-plan">Learning Plan</a>
          </li>
          <li>
            <a href="#quiz">Quiz</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

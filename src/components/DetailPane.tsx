import React from 'react';

const DetailPane: React.FC = () => {
  return (
    <section className="detail-pane">
      <h2>Detail View</h2>
      <div className="detail-content">
        <p>Detail view will go here</p>
        <p>This will show detailed information about selected content</p>
      </div>
    </section>
  );
};

export default DetailPane;

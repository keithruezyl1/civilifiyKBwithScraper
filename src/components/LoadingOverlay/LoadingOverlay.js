import React from 'react';
import './LoadingOverlay.css';

export const LoadingOverlay = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
      </div>
    </div>
  );
};




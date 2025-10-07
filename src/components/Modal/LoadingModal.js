import React from 'react';
import './Modal.css';

const LoadingModal = ({ isOpen, message = "Processing...", subtitle = "Please wait..." }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content loading-modal">
        <div className="modal-loading-spinner">
          <div className="modal-spinner"></div>
        </div>
        <h2 className="modal-title">{message}</h2>
        <p className="modal-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

export default LoadingModal;

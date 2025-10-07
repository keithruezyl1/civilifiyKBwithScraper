import React, { useState } from 'react';
import { Toast, DuplicateMatchesToast } from './Toast';

// Demo component showing how to use the Toast components
export const ToastDemo: React.FC = () => {
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [showWarningToast, setShowWarningToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showDuplicateToast, setShowDuplicateToast] = useState(false);

  const sampleMatches = [
    {
      title: "RA 4136 - Land Transportation and Traffic Code",
      type: "statute_section",
      canonical_citation: "RA 4136, Section 1",
      entry_id: "RA4136-Sec1-123456",
      similarity: 0.95
    },
    {
      title: "Land Transportation Code - General Provisions",
      type: "statute_section", 
      canonical_citation: "RA 4136, Section 2",
      entry_id: "RA4136-Sec2-789012",
      similarity: 0.87
    },
  ];

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Toast Component Demo</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowInfoToast(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Show Info Toast
        </button>
        
        <button
          onClick={() => setShowWarningToast(true)}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Show Warning Toast
        </button>
        
        <button
          onClick={() => setShowSuccessToast(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Show Success Toast
        </button>
        
        <button
          onClick={() => setShowErrorToast(true)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Show Error Toast
        </button>
        
        <button
          onClick={() => setShowDuplicateToast(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 col-span-2"
        >
          Show Duplicate Matches Toast
        </button>
      </div>

      {/* Toast Components */}
      <Toast
        isOpen={showInfoToast}
        onClose={() => setShowInfoToast(false)}
        title="Information"
        type="info"
        duration={5000}
      >
        <p className="text-sm text-gray-700">
          This is an informational toast message. It will auto-dismiss in 5 seconds.
        </p>
      </Toast>

      <Toast
        isOpen={showWarningToast}
        onClose={() => setShowWarningToast(false)}
        title="Warning"
        type="warning"
      >
        <p className="text-sm text-gray-700">
          This is a warning toast message. It will stay open until manually closed.
        </p>
      </Toast>

      <Toast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title="Success"
        type="success"
        duration={3000}
      >
        <p className="text-sm text-gray-700">
          Operation completed successfully! This toast will auto-dismiss in 3 seconds.
        </p>
      </Toast>

      <Toast
        isOpen={showErrorToast}
        onClose={() => setShowErrorToast(false)}
        title="Error"
        type="error"
      >
        <p className="text-sm text-gray-700">
          An error occurred while processing your request. Please try again.
        </p>
      </Toast>

      <DuplicateMatchesToast
        isOpen={showDuplicateToast}
        onClose={() => setShowDuplicateToast(false)}
        matches={sampleMatches}
        maxDisplay={3}
        onViewAll={() => {
          console.log('View all matches clicked');
          setShowDuplicateToast(false);
        }}
      />
    </div>
  );
};

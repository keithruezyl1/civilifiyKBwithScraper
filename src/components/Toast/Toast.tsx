import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getToastClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      default:
        return 'toast-info';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${getToastClass(toast.type)}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {getIcon(toast.type)}
            </div>
            <div className="toast-text">
              <div className="toast-title">{toast.title}</div>
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button 
              className="toast-close"
              onClick={() => removeToast(toast.id)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};


























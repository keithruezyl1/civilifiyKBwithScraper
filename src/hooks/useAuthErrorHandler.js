/**
 * Hook for handling authentication errors globally
 */
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clearAllUserData } from '../utils/storageUtils';

/**
 * Hook that sets up global authentication error handling
 * This should be used in the main App component
 */
export const useAuthErrorHandler = () => {
  const { logout } = useAuth();

  useEffect(() => {
    // Handle unhandled promise rejections that might be auth errors
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('Authentication failed') || 
           event.reason.message.includes('401') ||
           event.reason.message.includes('403'))) {
        console.log('🔒 Unhandled authentication error detected');
        clearAllUserData();
        logout();
      }
    };

    // Handle fetch errors globally
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for authentication errors
        if (response.status === 401 || response.status === 403) {
          console.log('🔒 Authentication error in fetch response');
          clearAllUserData();
          logout();
        }
        
        return response;
      } catch (error) {
        // Re-throw the error to maintain normal error handling
        throw error;
      }
    };

    // Add event listener for unhandled promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      // Restore original fetch
      window.fetch = originalFetch;
    };
  }, [logout]);
};

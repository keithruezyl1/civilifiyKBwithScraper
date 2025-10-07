/**
 * Centralized API utilities for handling authentication and common API patterns
 */

import { clearAllUserData } from './storageUtils';

/**
 * Check if an error response indicates authentication failure
 */
const isAuthError = (response) => {
  return response.status === 401 || response.status === 403;
};

/**
 * Handle authentication errors by clearing user data and redirecting to login
 */
const handleAuthError = () => {
  console.log('🔒 Authentication error detected, clearing user data');
  clearAllUserData();
  
  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Enhanced fetch wrapper that handles authentication errors globally
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  // Add authorization header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle authentication errors
  if (isAuthError(response)) {
    handleAuthError();
    throw new Error('Authentication failed');
  }
  
  return response;
};

/**
 * API request wrapper with automatic error handling
 */
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await authenticatedFetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * API request wrapper that returns JSON data
 */
export const apiRequestJson = async (url, options = {}) => {
  const response = await apiRequest(url, options);
  return response.json();
};

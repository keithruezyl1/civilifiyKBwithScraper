import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the useLocalStorage hook
jest.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({
    entries: [],
    loading: false,
    error: null,
    clearError: jest.fn(),
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    getEntryById: jest.fn(),
    getEntryByEntryId: jest.fn(),
    searchEntries: jest.fn(),
    exportEntries: jest.fn(),
    exportSingleEntry: jest.fn(),
    importEntries: jest.fn(),
    clearAllEntries: jest.fn(),
    getStorageStats: jest.fn(() => ({
      totalEntries: 0,
      progressPercentage: 0,
      remainingEntries: 1500
    })),
    getAllTeamProgress: jest.fn(() => ({})),
    getYesterdayTeamProgress: jest.fn(() => ({})),
    updateProgressForEntry: jest.fn(),
    checkDailyCompletion: jest.fn()
  })
}));

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    user: { id: 1, name: 'Test User', personId: 1 },
    isLoading: false,
    logout: jest.fn()
  })
}));

// Mock the useAuthErrorHandler hook
jest.mock('../hooks/useAuthErrorHandler', () => ({
  useAuthErrorHandler: () => {}
}));

// Mock the plan loader
jest.mock('../lib/plan/planLoader', () => ({
  loadPlanFromJson: jest.fn(() => Promise.resolve([])),
  computeDayIndex: jest.fn(() => 1),
  rowsForDay: jest.fn(() => []),
  getPlanDate: jest.fn(() => new Date()),
  toISODate: jest.fn(() => '2025-09-04')
}));

// Mock the progress store
jest.mock('../lib/plan/progressStore', () => ({
  setDay1Date: jest.fn()
}));

// Mock the vector API
jest.mock('../services/vectorApi', () => ({
  upsertEntry: jest.fn(),
  deleteEntryVector: jest.fn(),
  clearEntriesVector: jest.fn()
}));

// Mock the KB API
jest.mock('../services/kbApi', () => ({
  fetchEntryById: jest.fn()
}));

// Mock the admin utils
jest.mock('../utils/adminUtils', () => ({
  checkAdminAndAlert: jest.fn(() => true),
  isTagarao: jest.fn(() => false)
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  test('renders without crashing', () => {
    renderApp();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', async () => {
    // Mock unauthenticated state
    const mockUseAuth = require('../contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      logout: jest.fn()
    });

    renderApp();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  test('redirects to dashboard when authenticated', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  test('shows loading state when authentication is loading', () => {
    const mockUseAuth = require('../contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      logout: jest.fn()
    });

    renderApp();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles theme toggle functionality', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });

    // Check if theme toggle button exists
    const themeToggle = screen.getByTitle(/switch to/i);
    expect(themeToggle).toBeInTheDocument();
  });

  test('displays team progress section', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });

    // Check for team progress header
    expect(screen.getByText(/today's team progress/i)).toBeInTheDocument();
  });

  test('shows create new entry button', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });

    const createButton = screen.getByText('Create New Entry');
    expect(createButton).toBeInTheDocument();
  });

  test('displays entry count in header', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });

    expect(screen.getByText(/0 entries/)).toBeInTheDocument();
  });

  test('handles logout functionality', async () => {
    const mockLogout = jest.fn();
    const mockUseAuth = require('../contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User' },
      isLoading: false,
      logout: mockLogout
    });

    renderApp();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });

    const logoutButton = screen.getByText(/logout/i);
    expect(logoutButton).toBeInTheDocument();
  });
});

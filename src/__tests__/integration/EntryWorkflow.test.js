import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock all the dependencies
jest.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({
    entries: [],
    loading: false,
    error: null,
    clearError: jest.fn(),
    addEntry: jest.fn().mockResolvedValue({ id: 1, entry_id: 'TEST-001' }),
    updateEntry: jest.fn().mockResolvedValue({ id: 1, entry_id: 'TEST-001' }),
    deleteEntry: jest.fn().mockResolvedValue({ success: true }),
    getEntryById: jest.fn(),
    getEntryByEntryId: jest.fn(),
    searchEntries: jest.fn(),
    exportEntries: jest.fn(),
    exportSingleEntry: jest.fn(),
    importEntries: jest.fn().mockResolvedValue({ success: true }),
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

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    user: { id: 1, name: 'Test User', personId: 1 },
    isLoading: false,
    logout: jest.fn()
  })
}));

jest.mock('../../hooks/useAuthErrorHandler', () => ({
  useAuthErrorHandler: () => {}
}));

jest.mock('../../lib/plan/planLoader', () => ({
  loadPlanFromJson: jest.fn(() => Promise.resolve([])),
  computeDayIndex: jest.fn(() => 1),
  rowsForDay: jest.fn(() => []),
  getPlanDate: jest.fn(() => new Date()),
  toISODate: jest.fn(() => '2025-09-04')
}));

jest.mock('../../lib/plan/progressStore', () => ({
  setDay1Date: jest.fn()
}));

jest.mock('../../services/vectorApi', () => ({
  upsertEntry: jest.fn().mockResolvedValue({ success: true }),
  deleteEntryVector: jest.fn().mockResolvedValue({ success: true }),
  clearEntriesVector: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../../services/kbApi', () => ({
  fetchEntryById: jest.fn()
}));

jest.mock('../../utils/adminUtils', () => ({
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

describe('Entry Workflow Integration Tests', () => {
  beforeEach(() => {
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

  describe('Entry Creation Workflow', () => {
    test('complete entry creation flow', async () => {
      const user = userEvent.setup();
      renderApp();

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Create New Entry')).toBeInTheDocument();
      });

      // Click create new entry button
      const createButton = screen.getByText('Create New Entry');
      await user.click(createButton);

      // Should navigate to form
      await waitFor(() => {
        expect(window.location.pathname).toContain('/law-entry/1');
      });
    });

    test('entry form validation workflow', async () => {
      const user = userEvent.setup();
      
      // Mock navigation to form
      Object.defineProperty(window, 'location', {
        value: { pathname: '/law-entry/1' },
        writable: true,
      });

      renderApp();

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/basics/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const nextButton = screen.getByText(/next/i);
      await user.click(nextButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    test('entry form step navigation', async () => {
      const user = userEvent.setup();
      
      // Mock navigation to form
      Object.defineProperty(window, 'location', {
        value: { pathname: '/law-entry/1' },
        writable: true,
      });

      renderApp();

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/basics/i)).toBeInTheDocument();
      });

      // Fill in basic information
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Entry');

      const typeSelect = screen.getByLabelText(/type/i);
      await user.selectOptions(typeSelect, 'statute_section');

      // Navigate to next step
      const nextButton = screen.getByText(/next/i);
      await user.click(nextButton);

      // Should move to step 2
      await waitFor(() => {
        expect(screen.getByText(/sources/i)).toBeInTheDocument();
      });
    });
  });

  describe('Entry Management Workflow', () => {
    test('entry list display and interaction', async () => {
      const mockEntries = [
        {
          id: 1,
          entry_id: 'TEST-001',
          title: 'Test Entry 1',
          type: 'statute_section',
          created_at: '2025-01-01T00:00:00Z',
          created_by: 1,
          created_by_name: 'Test User'
        },
        {
          id: 2,
          entry_id: 'TEST-002',
          title: 'Test Entry 2',
          type: 'constitution_provision',
          created_at: '2025-01-02T00:00:00Z',
          created_by: 1,
          created_by_name: 'Test User'
        }
      ];

      // Mock useLocalStorage to return entries
      const mockUseLocalStorage = require('../../hooks/useLocalStorage').useLocalStorage;
      mockUseLocalStorage.mockReturnValue({
        entries: mockEntries,
        loading: false,
        error: null,
        clearError: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
        getEntryById: jest.fn((id) => mockEntries.find(e => e.id === id)),
        getEntryByEntryId: jest.fn(),
        searchEntries: jest.fn(),
        exportEntries: jest.fn(),
        exportSingleEntry: jest.fn(),
        importEntries: jest.fn(),
        clearAllEntries: jest.fn(),
        getStorageStats: jest.fn(() => ({
          totalEntries: 2,
          progressPercentage: 0.1,
          remainingEntries: 1498
        })),
        getAllTeamProgress: jest.fn(() => ({})),
        getYesterdayTeamProgress: jest.fn(() => ({})),
        updateProgressForEntry: jest.fn(),
        checkDailyCompletion: jest.fn()
      });

      renderApp();

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('Test Entry 1')).toBeInTheDocument();
        expect(screen.getByText('Test Entry 2')).toBeInTheDocument();
      });

      // Check entry count in header
      expect(screen.getByText(/2 entries/)).toBeInTheDocument();
    });

    test('entry search functionality', async () => {
      const user = userEvent.setup();
      const mockEntries = [
        {
          id: 1,
          entry_id: 'TEST-001',
          title: 'Criminal Law Section',
          type: 'statute_section',
          text: 'Criminal law provisions',
        },
        {
          id: 2,
          entry_id: 'TEST-002',
          title: 'Civil Law Section',
          type: 'statute_section',
          text: 'Civil law provisions',
        }
      ];

      const mockSearchEntries = jest.fn().mockReturnValue([mockEntries[0]]);
      const mockUseLocalStorage = require('../../hooks/useLocalStorage').useLocalStorage;
      mockUseLocalStorage.mockReturnValue({
        entries: mockEntries,
        loading: false,
        error: null,
        clearError: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
        getEntryById: jest.fn(),
        getEntryByEntryId: jest.fn(),
        searchEntries: mockSearchEntries,
        exportEntries: jest.fn(),
        exportSingleEntry: jest.fn(),
        importEntries: jest.fn(),
        clearAllEntries: jest.fn(),
        getStorageStats: jest.fn(() => ({
          totalEntries: 2,
          progressPercentage: 0.1,
          remainingEntries: 1498
        })),
        getAllTeamProgress: jest.fn(() => ({})),
        getYesterdayTeamProgress: jest.fn(() => ({})),
        updateProgressForEntry: jest.fn(),
        checkDailyCompletion: jest.fn()
      });

      renderApp();

      // Wait for search input to be available
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).toBeInTheDocument();
      });

      // Perform search
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'criminal');

      // Verify search was called
      expect(mockSearchEntries).toHaveBeenCalledWith('criminal');
    });

    test('entry export functionality', async () => {
      const user = userEvent.setup();
      const mockExportEntries = jest.fn();
      const mockUseLocalStorage = require('../../hooks/useLocalStorage').useLocalStorage;
      mockUseLocalStorage.mockReturnValue({
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
        exportEntries: mockExportEntries,
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
      });

      renderApp();

      // Wait for export button to be available
      await waitFor(() => {
        expect(screen.getByText('Export Entries')).toBeInTheDocument();
      });

      // Click export button
      const exportButton = screen.getByText('Export Entries');
      await user.click(exportButton);

      // Verify export was called
      expect(mockExportEntries).toHaveBeenCalled();
    });
  });

  describe('Authentication Workflow', () => {
    test('login and logout flow', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn();
      
      // Mock unauthenticated state first
      const mockUseAuth = require('../../contexts/AuthContext').useAuth;
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: mockLogout
      });

      renderApp();

      // Should redirect to login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });

      // Mock authenticated state
      mockUseAuth.mockReturnValue({
        user: { id: 1, name: 'Test User' },
        isLoading: false,
        logout: mockLogout
      });

      // Re-render to simulate login
      renderApp();

      // Should redirect to dashboard
      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });

      // Click logout button
      const logoutButton = screen.getByText(/logout/i);
      await user.click(logoutButton);

      // Should call logout function
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Error Handling Workflow', () => {
    test('handles API errors gracefully', async () => {
      const mockUseLocalStorage = require('../../hooks/useLocalStorage').useLocalStorage;
      mockUseLocalStorage.mockReturnValue({
        entries: [],
        loading: false,
        error: 'Failed to load entries',
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
      });

      renderApp();

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText('Failed to load entries')).toBeInTheDocument();
      });
    });

    test('handles loading states', async () => {
      const mockUseLocalStorage = require('../../hooks/useLocalStorage').useLocalStorage;
      mockUseLocalStorage.mockReturnValue({
        entries: [],
        loading: true,
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
      });

      renderApp();

      // Should display loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Team Progress Workflow', () => {
    test('displays team progress correctly', async () => {
      const mockTeamMembers = [
        { id: 1, name: 'Arda', person_id: 'P1' },
        { id: 2, name: 'Delos Cientos', person_id: 'P2' },
        { id: 3, name: 'Paden', person_id: 'P3' },
        { id: 4, name: 'Sendrijas', person_id: 'P4' },
        { id: 5, name: 'Tagarao', person_id: 'P5' }
      ];

      // Mock fetch for team members
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ team_members: mockTeamMembers })
      });

      renderApp();

      // Wait for team progress section
      await waitFor(() => {
        expect(screen.getByText(/today's team progress/i)).toBeInTheDocument();
      });

      // Check if team member names are displayed
      expect(screen.getByText('Arda')).toBeInTheDocument();
      expect(screen.getByText('Delos Cientos')).toBeInTheDocument();
      expect(screen.getByText('Paden')).toBeInTheDocument();
      expect(screen.getByText('Sendrijas')).toBeInTheDocument();
      expect(screen.getByText('Tagarao')).toBeInTheDocument();
    });
  });
});

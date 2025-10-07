import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the API services
jest.mock('../../services/kbApi', () => ({
  fetchAllEntries: jest.fn(),
  createEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
}));

jest.mock('../../services/vectorApi', () => ({
  upsertEntry: jest.fn(),
  deleteEntryVector: jest.fn(),
}));

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  test('initializes with empty entries when no data in localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage());

    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  test('loads entries from localStorage on initialization', () => {
    const mockEntries = [
      {
        id: 1,
        entry_id: 'TEST-001',
        title: 'Test Entry 1',
        type: 'statute_section',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        entry_id: 'TEST-002',
        title: 'Test Entry 2',
        type: 'constitution_provision',
        created_at: '2025-01-02T00:00:00Z',
      },
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));

    const { result } = renderHook(() => useLocalStorage());

    expect(result.current.entries).toEqual(mockEntries);
  });

  test('adds new entry successfully', async () => {
    localStorageMock.getItem.mockReturnValue('[]');
    const mockCreateEntry = require('../../services/kbApi').createEntry;
    const mockUpsertEntry = require('../../services/vectorApi').upsertEntry;
    
    mockCreateEntry.mockResolvedValue({
      id: 1,
      entry_id: 'TEST-001',
      title: 'New Entry',
      type: 'statute_section',
    });
    mockUpsertEntry.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useLocalStorage());

    const newEntry = {
      entry_id: 'TEST-001',
      title: 'New Entry',
      type: 'statute_section',
      jurisdiction: 'PH',
      law_family: 'Test Law',
      canonical_citation: 'Test Citation',
      summary: 'Test summary',
      text: 'Test text',
      source_urls: ['https://example.com'],
      tags: ['test'],
    };

    await act(async () => {
      await result.current.addEntry(newEntry);
    });

    expect(mockCreateEntry).toHaveBeenCalledWith(newEntry);
    expect(mockUpsertEntry).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('updates existing entry successfully', async () => {
    const existingEntry = {
      id: 1,
      entry_id: 'TEST-001',
      title: 'Original Title',
      type: 'statute_section',
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify([existingEntry]));
    
    const mockUpdateEntry = require('../../services/kbApi').updateEntry;
    const mockUpsertEntry = require('../../services/vectorApi').upsertEntry;
    
    mockUpdateEntry.mockResolvedValue({
      ...existingEntry,
      title: 'Updated Title',
    });
    mockUpsertEntry.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useLocalStorage());

    const updatedData = {
      title: 'Updated Title',
    };

    await act(async () => {
      await result.current.updateEntry(1, updatedData);
    });

    expect(mockUpdateEntry).toHaveBeenCalledWith(1, updatedData);
    expect(mockUpsertEntry).toHaveBeenCalled();
  });

  test('deletes entry successfully', async () => {
    const existingEntry = {
      id: 1,
      entry_id: 'TEST-001',
      title: 'Test Entry',
      type: 'statute_section',
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify([existingEntry]));
    
    const mockDeleteEntry = require('../../services/kbApi').deleteEntry;
    const mockDeleteEntryVector = require('../../services/vectorApi').deleteEntryVector;
    
    mockDeleteEntry.mockResolvedValue({ success: true });
    mockDeleteEntryVector.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useLocalStorage());

    await act(async () => {
      await result.current.deleteEntry(1);
    });

    expect(mockDeleteEntry).toHaveBeenCalledWith(1);
    expect(mockDeleteEntryVector).toHaveBeenCalledWith(1);
  });

  test('searches entries correctly', () => {
    const mockEntries = [
      {
        id: 1,
        title: 'Criminal Law',
        type: 'statute_section',
        text: 'Criminal law provisions',
      },
      {
        id: 2,
        title: 'Civil Law',
        type: 'statute_section',
        text: 'Civil law provisions',
      },
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));

    const { result } = renderHook(() => useLocalStorage());

    act(() => {
      const searchResults = result.current.searchEntries('criminal');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('Criminal Law');
    });
  });

  test('calculates storage stats correctly', () => {
    const mockEntries = [
      { id: 1, type: 'statute_section' },
      { id: 2, type: 'constitution_provision' },
      { id: 3, type: 'statute_section' },
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));

    const { result } = renderHook(() => useLocalStorage());

    const stats = result.current.getStorageStats();
    
    expect(stats.totalEntries).toBe(3);
    expect(stats.progressPercentage).toBeCloseTo(0.2, 1); // 3/1500 * 100
    expect(stats.remainingEntries).toBe(1497);
  });

  test('handles errors gracefully', async () => {
    localStorageMock.getItem.mockReturnValue('[]');
    const mockCreateEntry = require('../../services/kbApi').createEntry;
    mockCreateEntry.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useLocalStorage());

    const newEntry = {
      entry_id: 'TEST-001',
      title: 'New Entry',
      type: 'statute_section',
    };

    await act(async () => {
      try {
        await result.current.addEntry(newEntry);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  test('exports entries correctly', () => {
    const mockEntries = [
      { id: 1, title: 'Entry 1' },
      { id: 2, title: 'Entry 2' },
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries));

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    document.createElement = jest.fn(() => mockLink);
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    const { result } = renderHook(() => useLocalStorage());

    act(() => {
      result.current.exportEntries();
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.download).toBe('law-entries-export.json');
    expect(mockLink.click).toHaveBeenCalled();
  });

  test('imports entries correctly', async () => {
    localStorageMock.getItem.mockReturnValue('[]');
    
    const mockCreateEntry = require('../../services/kbApi').createEntry;
    const mockUpsertEntry = require('../../services/vectorApi').upsertEntry;
    
    mockCreateEntry.mockResolvedValue({ id: 1, entry_id: 'TEST-001' });
    mockUpsertEntry.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useLocalStorage());

    const importData = [
      {
        entry_id: 'TEST-001',
        title: 'Imported Entry',
        type: 'statute_section',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Test text',
        source_urls: ['https://example.com'],
        tags: ['test'],
      },
    ];

    const mockUser = { id: 1, name: 'Test User' };

    await act(async () => {
      const result = await result.current.importEntries(JSON.stringify(importData), mockUser);
      expect(result.success).toBe(true);
    });

    expect(mockCreateEntry).toHaveBeenCalledTimes(1);
    expect(mockUpsertEntry).toHaveBeenCalledTimes(1);
  });
});

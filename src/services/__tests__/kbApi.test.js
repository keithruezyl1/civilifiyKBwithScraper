import {
  fetchAllEntries,
  fetchEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  searchEntries
} from '../kbApi';

// Mock fetch globally
global.fetch = jest.fn();

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

describe('KB API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('fetchAllEntries', () => {
    test('fetches all entries successfully', async () => {
      const mockEntries = [
        { id: 1, title: 'Entry 1', type: 'statute_section' },
        { id: 2, title: 'Entry 2', type: 'constitution_provision' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntries,
      });

      const result = await fetchAllEntries();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/kb/entries'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
      expect(result).toEqual(mockEntries);
    });

    test('handles fetch error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAllEntries()).rejects.toThrow('Network error');
    });

    test('handles non-ok response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchAllEntries()).rejects.toThrow('Failed to fetch entries: 500 Internal Server Error');
    });
  });

  describe('fetchEntryById', () => {
    test('fetches entry by ID successfully', async () => {
      const mockEntry = {
        id: 1,
        entry_id: 'TEST-001',
        title: 'Test Entry',
        type: 'statute_section',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntry,
      });

      const result = await fetchEntryById(1);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/kb/entries/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
      expect(result).toEqual(mockEntry);
    });

    test('handles entry not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchEntryById(999);
      expect(result).toBeNull();
    });
  });

  describe('createEntry', () => {
    test('creates entry successfully', async () => {
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

      const createdEntry = {
        id: 1,
        ...newEntry,
        created_at: '2025-01-01T00:00:00Z',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdEntry,
      });

      const result = await createEntry(newEntry);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/kb/entries'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          }),
          body: JSON.stringify(newEntry),
        })
      );
      expect(result).toEqual(createdEntry);
    });

    test('handles creation error', async () => {
      const newEntry = {
        entry_id: 'TEST-001',
        title: 'New Entry',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Validation failed' }),
      });

      await expect(createEntry(newEntry)).rejects.toThrow('Failed to create entry: 400 Bad Request');
    });
  });

  describe('updateEntry', () => {
    test('updates entry successfully', async () => {
      const updateData = {
        title: 'Updated Entry',
        summary: 'Updated summary',
      };

      const updatedEntry = {
        id: 1,
        entry_id: 'TEST-001',
        title: 'Updated Entry',
        summary: 'Updated summary',
        type: 'statute_section',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedEntry,
      });

      const result = await updateEntry(1, updateData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/kb/entries/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          }),
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(updatedEntry);
    });

    test('handles update error', async () => {
      const updateData = { title: 'Updated Entry' };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(updateEntry(999, updateData)).rejects.toThrow('Failed to update entry: 404 Not Found');
    });
  });

  describe('deleteEntry', () => {
    test('deletes entry successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await deleteEntry(1);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/kb/entries/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
      expect(result).toEqual({ success: true });
    });

    test('handles delete error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(deleteEntry(999)).rejects.toThrow('Failed to delete entry: 404 Not Found');
    });
  });

  describe('searchEntries', () => {
    test('searches entries successfully', async () => {
      const searchQuery = 'criminal law';
      const mockResults = [
        { id: 1, title: 'Criminal Law Section 1', type: 'statute_section' },
        { id: 2, title: 'Criminal Procedure', type: 'rule_of_court' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const result = await searchEntries(searchQuery);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/kb/search'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          }),
          body: JSON.stringify({ query: searchQuery }),
        })
      );
      expect(result).toEqual(mockResults);
    });

    test('handles search error', async () => {
      fetch.mockRejectedValueOnce(new Error('Search failed'));

      await expect(searchEntries('test query')).rejects.toThrow('Search failed');
    });
  });

  describe('Authentication handling', () => {
    test('includes auth token in requests', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAllEntries();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    test('handles missing auth token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAllEntries();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer null',
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    test('handles network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAllEntries()).rejects.toThrow('Network error');
    });

    test('handles JSON parsing errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchAllEntries()).rejects.toThrow('Invalid JSON');
    });

    test('handles timeout errors', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(fetchAllEntries()).rejects.toThrow('Request timeout');
    });
  });
});

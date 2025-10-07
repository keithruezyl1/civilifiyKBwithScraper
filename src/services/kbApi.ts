import { KbEntry } from '../lib/kb/schemas';

export interface SaveDraftResponse {
  success: boolean;
  draftId: string;
  message: string;
}

export interface SubmitResponse {
  success: boolean;
  entryId: string;
  message: string;
}

export interface PublishResponse {
  success: boolean;
  entryId: string;
  message: string;
}

// Mock API service - in a real implementation, this would call actual endpoints
export class KbApiService {
  private static instance: KbApiService;
  private drafts: Map<string, KbEntry> = new Map();
  private entries: Map<string, KbEntry> = new Map();

  static getInstance(): KbApiService {
    if (!KbApiService.instance) {
      KbApiService.instance = new KbApiService();
    }
    return KbApiService.instance;
  }

  async saveDraft(entry: Partial<KbEntry>): Promise<SaveDraftResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store draft in memory (in real app, this would be saved to backend)
      this.drafts.set(draftId, entry as KbEntry);
      
      // Also save to localStorage for persistence
      const drafts = JSON.parse(localStorage.getItem('kb_drafts') || '{}');
      drafts[draftId] = entry;
      localStorage.setItem('kb_drafts', JSON.stringify(drafts));
      
      return {
        success: true,
        draftId,
        message: 'Draft saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        draftId: '',
        message: 'Failed to save draft'
      };
    }
  }

  async submitForReview(entry: KbEntry): Promise<SubmitResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const entryId = entry.entry_id;
      
      // Store entry in memory (in real app, this would be submitted to review queue)
      this.entries.set(entryId, entry);
      
      return {
        success: true,
        entryId,
        message: 'Entry submitted for review successfully'
      };
    } catch (error) {
      return {
        success: false,
        entryId: '',
        message: 'Failed to submit entry for review'
      };
    }
  }

  async publishEntry(entry: KbEntry): Promise<PublishResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const entryId = entry.entry_id;
      
      // Store entry in memory (in real app, this would be published to the KB)
      this.entries.set(entryId, entry);
      
      return {
        success: true,
        entryId,
        message: 'Entry published successfully'
      };
    } catch (error) {
      return {
        success: false,
        entryId: '',
        message: 'Failed to publish entry'
      };
    }
  }

  async loadDraft(draftId: string): Promise<KbEntry | null> {
    try {
      // Try to load from localStorage first
      const drafts = JSON.parse(localStorage.getItem('kb_drafts') || '{}');
      const draft = drafts[draftId];
      
      if (draft) {
        return draft;
      }
      
      // Fallback to memory storage
      return this.drafts.get(draftId) || null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }

  async searchExistingEntries(query: string): Promise<Array<{ entry_id: string; title: string; type: string }>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock search results
      const mockResults = [
        { entry_id: 'RPC-Art308', title: 'RPC Art. 308 — Theft', type: 'statute_section' },
        { entry_id: 'ROC-Rule113-Sec5', title: 'Rule 113 Sec. 5 — Arrest without warrant', type: 'rule_of_court' },
        { entry_id: 'INC-DUI-001', title: 'DUI Apprehension', type: 'incident_checklist' }
      ];
      
      return mockResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.entry_id.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search entries:', error);
      return [];
    }
  }

  async uploadSnapshot(file: File): Promise<{ success: boolean; url?: string; message: string }> {
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock upload response
      const mockUrl = `https://storage.example.com/snapshots/${file.name}`;
      
      return {
        success: true,
        url: mockUrl,
        message: 'File uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upload file'
      };
    }
  }
}

export const kbApi = KbApiService.getInstance();

// Live API helpers (optional – to dynamically reflect DB state)
const ORIGIN_BASE = (process.env.REACT_APP_API_BASE || process.env.REACT_APP_VECTOR_API_URL || 'http://localhost:4000');
const KB_BASE_URL = `${ORIGIN_BASE.endsWith('/api') ? ORIGIN_BASE : ORIGIN_BASE + '/api'}/kb`;

export async function fetchAllEntriesFromDb(): Promise<any[]> {
  try {
    const token = localStorage.getItem('auth_token');
    const resp = await fetch(`${KB_BASE_URL}/entries`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    const json = await resp.json();
    if (!json?.success) return [];
    return json.entries || [];
  } catch {
    return [];
  }
}

// Helper to fetch one entry by id with all fields
export async function fetchEntryById(entryId: string): Promise<any | null> {
  try {
    const token = localStorage.getItem('auth_token');
    const resp = await fetch(`${KB_BASE_URL}/entries/${encodeURIComponent(entryId)}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    const json = await resp.json();
    if (!json?.success) return null;
    return json.entry || null;
  } catch {
    return null;
  }
}

// Server lexical search (feature-flag-ready consumer)
export async function serverSearch(params: {
  query: string;
  type?: string;
  jurisdiction?: string;
  status?: string;
  verified?: 'yes' | 'not_verified';
  team_member_id?: string | number;
  limit?: number;
  explain?: boolean;
}): Promise<{ results: any[]; cursor: string | null }> {
  const token = localStorage.getItem('auth_token');
  const qs = new URLSearchParams();
  qs.set('query', params.query || '');
  if (params.type) qs.set('type', params.type);
  if (params.jurisdiction) qs.set('jurisdiction', params.jurisdiction);
  if (params.status) qs.set('status', params.status);
  if (params.verified) qs.set('verified', params.verified);
  if (params.team_member_id != null) qs.set('team_member_id', String(params.team_member_id));
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.explain) qs.set('explain', 'true');

  const resp = await fetch(`${KB_BASE_URL}/search?${qs.toString()}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!resp.ok) throw new Error(`Search failed: ${resp.status}`);
  const json = await resp.json();
  return { results: json.results || [], cursor: json.cursor || null };
}

// Verify entry
export async function verifyEntry(entryId: string): Promise<any | null> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No authentication token');
    
    const resp = await fetch(`${KB_BASE_URL}/entries/${encodeURIComponent(entryId)}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const json = await resp.json();
    if (!json?.success) throw new Error(json.error || 'Verification failed');
    return json.entry || null;
  } catch (error) {
    console.error('Failed to verify entry:', error);
    throw error;
  }
}

// Re-verify entry (reset verification status)
export async function reverifyEntry(entryId: string): Promise<any | null> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No authentication token');
    
    const resp = await fetch(`${KB_BASE_URL}/entries/${encodeURIComponent(entryId)}/reverify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const json = await resp.json();
    if (!json?.success) throw new Error(json.error || 'Re-verification failed');
    return json.entry || null;
  } catch (error) {
    console.error('Failed to re-verify entry:', error);
    throw error;
  }
}



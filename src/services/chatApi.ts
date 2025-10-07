export interface ChatResponse {
  answer: string;
  sources: Array<{ entry_id: string; type?: string; title: string; canonical_citation?: string; summary?: string; tags?: string[] }>;
  error?: string;
}

// Align base handling with other services
const ORIGIN_BASE = (process.env.REACT_APP_API_BASE || process.env.REACT_APP_VECTOR_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : 'http://localhost:4000'));
const API_BASE = `${ORIGIN_BASE.endsWith('/api') ? ORIGIN_BASE : ORIGIN_BASE + '/api'}`;

export async function askChat(question: string): Promise<ChatResponse> {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const resp = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question }),
    });
    const json = await resp.json();
    if (!resp.ok) return { answer: '', sources: [], error: json?.error || 'Chat server error' };
    return { answer: json?.answer || '', sources: json?.sources || [] };
  } catch (e: any) {
    return { answer: '', sources: [], error: String(e?.message || e) };
  }
}




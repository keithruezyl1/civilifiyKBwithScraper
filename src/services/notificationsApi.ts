export interface NotificationItem {
  id: string;
  entry_id: string;
  citation_snapshot: { citation?: string; title?: string; url?: string };
  matched_entry_ids: string[];
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

const ORIGIN_BASE = (process.env.REACT_APP_API_BASE || process.env.REACT_APP_VECTOR_API_URL || window.location.origin.replace(/\/$/, ''));
const API_BASE = `${ORIGIN_BASE.endsWith('/api') ? ORIGIN_BASE : ORIGIN_BASE + '/api'}`;

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

export async function computeNotifications(): Promise<{ success: boolean; created?: number; error?: string }> {
  const resp = await fetch(`${API_BASE}/notifications/compute`, {
    method: 'POST',
    headers: authHeaders(),
  });
  try { return await resp.json(); } catch { return { success: false, error: 'bad_json' }; }
}

export async function listNotifications(): Promise<{ success: boolean; notifications: NotificationItem[] }> {
  const resp = await fetch(`${API_BASE}/notifications`, {
    headers: authHeaders(),
  });
  const json = await resp.json();
  return json;
}

export async function dismissNotification(id: string): Promise<{ success: boolean }> {
  const resp = await fetch(`${API_BASE}/notifications/${encodeURIComponent(id)}/dismiss`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const json = await resp.json();
  return json;
}

export async function resolveNotification(id: string, selected_entry_id?: string): Promise<{ success: boolean }> {
  const resp = await fetch(`${API_BASE}/notifications/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(selected_entry_id ? { selected_entry_id } : {}),
  });
  const json = await resp.json();
  return json;
}



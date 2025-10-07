export type UpsertEntryPayload = {
  entry_id: string;
  type: string;
  title: string;
  canonical_citation?: string;
  summary?: string;
  text?: string;
  tags?: string[];
  jurisdiction?: string;
  law_family?: string;
  section_id?: string;
  status?: string;
  effective_date?: string;
  amendment_date?: string | null;
  last_reviewed?: string;
  visibility?: any;
  source_urls?: string[];
  elements?: any;
  penalties?: any;
  defenses?: any;
  prescriptive_period?: string;
  standard_of_proof?: string;
  rule_no?: string;
  section_no?: string;
  triggers?: any;
  time_limits?: any;
  required_forms?: any;
  circular_no?: string;
  applicability?: any;
  issuance_no?: string;
  instrument_no?: string;
  supersedes?: any;
  steps_brief?: any;
  forms_required?: any;
  failure_states?: any;
  violation_code?: string;
  violation_name?: string;
  license_action?: string;
  fine_schedule?: any;
  apprehension_flow?: any;
  incident?: string;
  phases?: any;
  forms?: any;
  handoff?: any;
  rights_callouts?: any;
  rights_scope?: string;
  advice_points?: any;
  topics?: any;
  jurisprudence?: any;
  legal_bases?: any;
  related_sections?: any;
};

const API_BASE = (process.env.REACT_APP_API_BASE || process.env.REACT_APP_VECTOR_API_URL || 'http://localhost:4000');
const BASE_URL = `${API_BASE}/api/kb`;

export async function upsertEntry(payload: UpsertEntryPayload): Promise<{ success: boolean; entry_id?: string; error?: string }>{
  try {
    const token = localStorage.getItem('auth_token');
    // Do not send verification fields on initial create to avoid DB column issues
    const { verified, verified_by, verified_at, ...safePayload } = (payload as any) || {};
    const resp = await fetch(`${BASE_URL}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(safePayload),
    });
    const json = await resp.json();
    return json;
  } catch (e: any) {
    return { success: false, error: String(e?.message || e) };
  }
}

export async function semanticSearch(query: string, limit = 5): Promise<{ success: boolean; results?: any[]; error?: string }>{
  try {
    const token = localStorage.getItem('auth_token');
    const resp = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, limit }),
    });
    const json = await resp.json();
    return json;
  } catch (e: any) {
    return { success: false, error: String(e?.message || e) };
  }
}

export async function deleteEntryVector(entryId: string): Promise<{ success: boolean; error?: string }>{
  try {
    const token = localStorage.getItem('auth_token');
    const resp = await fetch(`${BASE_URL}/entries/${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await resp.json();
    return json;
  } catch (e: any) {
    return { success: false, error: String(e?.message || e) };
  }
}

export async function clearEntriesVector(dateISO?: string): Promise<{ success: boolean; error?: string }>{
  try {
    const url = new URL(`${BASE_URL}/entries`);
    if (dateISO) url.searchParams.set('date', dateISO);
    const token = localStorage.getItem('auth_token');
    const resp = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await resp.json();
    return json;
  } catch (e: any) {
    return { success: false, error: String(e?.message || e) };
  }
}




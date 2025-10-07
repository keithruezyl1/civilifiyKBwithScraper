import { apiRequestJson, authenticatedFetch } from '../utils/apiUtils';

const ORIGIN_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
const API_BASE = ORIGIN_BASE.endsWith('/api') ? ORIGIN_BASE : `${ORIGIN_BASE}/api`;

export interface User {
  id: number;
  username: string;
  name: string;
  personId: string; // P1, P2, P3, P4, P5
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface QuotaItem {
  entry_type: string;
  current_count: number;
  daily_quota: number;
  can_submit: boolean;
}

export interface TeamProgressItem {
  user_id: number;
  username: string;
  name: string;
  person_id: string;
  entry_type: string;
  count: number;
}

// Login with username and password
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
};

// Get current user info
export const getCurrentUser = async (token: string): Promise<User> => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get user info');
  }

  const data = await response.json();
  return data.user;
};

// Get user's daily quota validation
export const getUserQuota = async (userId: number, date?: string): Promise<QuotaItem[]> => {
  const dateParam = date || new Date().toISOString().split('T')[0];
  const data = await apiRequestJson(`${API_BASE}/auth/quota/${userId}?date=${dateParam}`);
  return data.quota;
};

// Get team progress for a date
export const getTeamProgress = async (date?: string): Promise<TeamProgressItem[]> => {
  const dateParam = date || new Date().toISOString().split('T')[0];
  const data = await apiRequestJson(`${API_BASE}/auth/team-progress?date=${dateParam}`);
  return data.progress;
};

// Check if user can submit a specific entry type
export const canSubmitEntryType = async (userId: number, entryType: string, date?: string): Promise<boolean> => {
  try {
    const quota = await getUserQuota(userId, date);
    const typeQuota = quota.find(q => q.entry_type === entryType);
    return typeQuota ? typeQuota.can_submit : false;
  } catch (error) {
    console.error('Error checking entry type quota:', error);
    return false;
  }
};

// Get available entry types for user
export const getAvailableEntryTypes = async (userId: number, date?: string): Promise<string[]> => {
  try {
    const quota = await getUserQuota(userId, date);
    return quota.filter(q => q.can_submit).map(q => q.entry_type);
  } catch (error) {
    console.error('Error getting available entry types:', error);
    return [];
  }
};

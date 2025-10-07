const ORIGIN_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
const API_BASE = ORIGIN_BASE.endsWith('/api') ? ORIGIN_BASE : `${ORIGIN_BASE}/api`;

export interface SharedPlan {
  id: number;
  name: string;
  day1_date: string;
  plan_data: any[];
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface PlanHistory {
  id: number;
  name: string;
  day1_date: string;
  created_at: string;
  is_active: boolean;
  created_by_name: string;
}

// Get current active plan
export const getActivePlan = async (): Promise<SharedPlan | null> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE}/plans/active`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get active plan');
  }

  const data = await response.json();
  return data.plan;
};

// Import new plan
export const importPlan = async (name: string, day1Date: string, planData: any[]): Promise<number> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE}/plans/import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      day1_date: day1Date,
      plan_data: planData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import plan');
  }

  const data = await response.json();
  return data.plan_id;
};

// Remove current plan
export const removePlan = async (): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE}/plans/active`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove plan');
  }
};

// Get plan history
export const getPlanHistory = async (): Promise<PlanHistory[]> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE}/plans/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get plan history');
  }

  const data = await response.json();
  return data.plans;
};

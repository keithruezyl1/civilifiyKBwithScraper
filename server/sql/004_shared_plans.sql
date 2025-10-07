-- Shared plan management for team coordination
CREATE TABLE IF NOT EXISTS shared_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  day1_date DATE NOT NULL,
  plan_data JSONB NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Index for active plans
CREATE INDEX IF NOT EXISTS shared_plans_active_idx ON shared_plans(is_active);
CREATE INDEX IF NOT EXISTS shared_plans_created_by_idx ON shared_plans(created_by);

-- Function to get the current active plan
CREATE OR REPLACE FUNCTION get_active_plan()
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  day1_date DATE,
  plan_data JSONB,
  created_by INTEGER,
  created_by_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    sp.id,
    sp.name,
    sp.day1_date,
    sp.plan_data,
    sp.created_by,
    u.name as created_by_name,
    sp.created_at
  FROM shared_plans sp
  LEFT JOIN users u ON sp.created_by = u.id
  WHERE sp.is_active = true
  ORDER BY sp.created_at DESC
  LIMIT 1;
$$;

-- Function to deactivate all plans (when importing new one)
CREATE OR REPLACE FUNCTION deactivate_all_plans()
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE shared_plans SET is_active = false;
$$;

-- Function to get plan history
CREATE OR REPLACE FUNCTION get_plan_history()
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  day1_date DATE,
  created_at TIMESTAMPTZ,
  is_active BOOLEAN,
  created_by_name TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    sp.id,
    sp.name,
    sp.day1_date,
    sp.created_at,
    sp.is_active,
    u.name as created_by_name
  FROM shared_plans sp
  LEFT JOIN users u ON sp.created_by = u.id
  ORDER BY sp.created_at DESC;
$$;
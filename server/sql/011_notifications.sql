-- Create notifications table for external->internal suggestions
create table if not exists kb_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  entry_id text not null,
  citation_snapshot jsonb not null,
  matched_entry_ids text[] not null,
  status text not null default 'pending', -- pending | resolved | dismissed
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_kb_notifications_user on kb_notifications(user_id);
create index if not exists idx_kb_notifications_status on kb_notifications(status);
create index if not exists idx_kb_notifications_entry on kb_notifications(entry_id);































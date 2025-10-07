-- Ensure old signature is removed before redefining with new return type
DROP FUNCTION IF EXISTS match_kb_entries(vector, int);

-- Match function for vector KNN; suitable for exposure via managed Postgres
create or replace function match_kb_entries(query_embedding vector, match_count int)
returns table(
  entry_id text,
  type text,
  title text,
  canonical_citation text,
  created_by integer,
  created_by_name text,
  similarity real
)
language sql
stable
as $$
  select
    e.entry_id,
    e.type,
    e.title,
    e.canonical_citation,
    e.created_by,
    u.name as created_by_name,
    1 - (e.embedding <=> query_embedding) as similarity
  from kb_entries e
  left join users u on e.created_by = u.id
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

-- Removed progress/quota helper functions; quotas are client-plan-driven




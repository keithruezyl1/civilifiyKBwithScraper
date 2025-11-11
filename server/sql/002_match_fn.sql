-- Ensure old signature is removed before redefining with new return type
DROP FUNCTION IF EXISTS match_kb_entries(vector, int);

-- Match function for vector KNN; suitable for exposure via managed Postgres
-- Only create if vector extension is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION match_kb_entries(query_embedding vector, match_count int)
      RETURNS TABLE(
        entry_id text,
        type text,
        title text,
        canonical_citation text,
        created_by integer,
        created_by_name text,
        similarity real
      )
      LANGUAGE sql
      STABLE
      AS $func$
        SELECT
          e.entry_id,
          e.type,
          e.title,
          e.canonical_citation,
          e.created_by,
          u.name as created_by_name,
          1 - (e.embedding <=> query_embedding) as similarity
        FROM kb_entries e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.embedding IS NOT NULL
        ORDER BY e.embedding <=> query_embedding
        LIMIT match_count;
      $func$;
    ';
    RAISE NOTICE 'match_kb_entries function created';
  ELSE
    RAISE NOTICE 'Skipping match_kb_entries function (pgvector not available)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating match_kb_entries: %', SQLERRM;
END $$;

-- Removed progress/quota helper functions; quotas are client-plan-driven




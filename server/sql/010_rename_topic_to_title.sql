-- Rename JSON key 'topic' -> 'title' in kb_entries.legal_bases and related_sections
-- Safe to run multiple times; uses COALESCE and checks if key exists

BEGIN;

-- Update legal_bases array items
UPDATE kb_entries
SET legal_bases = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'topic' THEN (elem - 'topic') || jsonb_build_object('title', elem->'topic')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(COALESCE(legal_bases, '[]'::jsonb)) AS elem
)
WHERE legal_bases IS NOT NULL;

-- Update related_sections array items
UPDATE kb_entries
SET related_sections = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'topic' THEN (elem - 'topic') || jsonb_build_object('title', elem->'topic')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(COALESCE(related_sections, '[]'::jsonb)) AS elem
)
WHERE related_sections IS NOT NULL;

COMMIT;




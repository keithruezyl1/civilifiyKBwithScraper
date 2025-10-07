-- Migration 016: Triggers to refresh search artifacts

CREATE OR REPLACE FUNCTION law_entries_search_vec_refresh()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vec :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.canonical_citation,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.section_id,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.law_family,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags,' '),'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary,'')), 'D') ||
    setweight(to_tsvector('simple', coalesce(NEW.text,'')), 'D');

  NEW.compact_citation := regexp_replace(lower(unaccent(coalesce(NEW.title,'')||' '||coalesce(NEW.canonical_citation,''))), '\s+', '', 'g');

  NEW.ra_number := COALESCE(
    NULLIF((regexp_match(lower(coalesce(NEW.canonical_citation,'')), 'ra\.?\s*no\.?\s*(\d+)|republic act\s*(\d+)'))[1], '')::int,
    NULLIF((regexp_match(lower(coalesce(NEW.canonical_citation,'')), 'republic\s*act\s*no\.?\s*(\d+)'))[1], '')::int
  );
  NEW.bp_number := (regexp_match(lower(coalesce(NEW.canonical_citation,'')), 'b\.?p\.?\s*(blg\.?)?\s*(\d+)'))[2]::int;
  NEW.gr_number := COALESCE((regexp_match(lower(coalesce(NEW.canonical_citation,'')), 'g\.?r\.?\s*no\.?\s*([0-9-]+)'))[1], NULL);
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_law_entries_search_vec ON law_entries;
CREATE TRIGGER trg_law_entries_search_vec
BEFORE INSERT OR UPDATE ON law_entries
FOR EACH ROW EXECUTE FUNCTION law_entries_search_vec_refresh();










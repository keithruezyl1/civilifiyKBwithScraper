import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { embedText } from '../embeddings.js';
import buildEmbeddingText from '../embedding-builder.js';

const router = Router();

// --- Helpers for server-side query normalization/expansion ---
function romanToInt(roman) {
  if (!roman) return null;
  const map = { i:1, v:5, x:10, l:50, c:100, d:500, m:1000 };
  const s = roman.toLowerCase();
  if (!/^[ivxlcdm]+$/.test(s)) return null;
  let res = 0, prev = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    const val = map[s[i]] || 0;
    if (val < prev) res -= val; else res += val;
    prev = val;
  }
  return res > 0 ? String(res) : null;
}

function normalizeAndExpandQuery(q) {
  let s = String(q || '').toLowerCase();
  // common punctuation → space
  s = s.replace(/[“”"'’`]+/g, ' ').replace(/[–—‐−]/g, '-');
  // abbreviations and acronyms (PH legal)
  s = s
    .replace(/\bra\.\b/g, ' republic act ')
    .replace(/\br\.a\.\b/g, ' republic act ')
    .replace(/\bra\b/g, ' republic act ')
    .replace(/\bbp\b/g, ' batas pambansa ')
    .replace(/\bb\.p\.\b/g, ' batas pambansa ')
    .replace(/\bblg\.?\b/g, ' bilang ')
    .replace(/\bca\b/g, ' commonwealth act ')
    .replace(/\bc\.a\.\b/g, ' commonwealth act ')
    .replace(/\bpd\b/g, ' presidential decree ')
    .replace(/\bp\.d\.\b/g, ' presidential decree ')
    .replace(/\broc\b/g, ' rules of court ')
    .replace(/\birr\b/g, ' implementing rules and regulations ')
    .replace(/\beo\b/g, ' executive order ')
    .replace(/\bmc\b/g, ' memorandum circular ')
    .replace(/\bvs\.?\b/g, ' v ')
    .replace(/\bversus\b/g, ' v ');

  // compact citation forms (no space): ra7610, bp22, pd1602, ca141
  s = s
    .replace(/\bra(\d{2,5})\b/g, ' republic act $1 ')
    .replace(/\bbp(\d{1,4})\b/g, ' batas pambansa $1 ')
    .replace(/\bpd(\d{1,5})\b/g, ' presidential decree $1 ')
    .replace(/\bca(\d{1,5})\b/g, ' commonwealth act $1 ');

  // article/section Roman → Arabic
  s = s.replace(/\b(article|art)\.?\s+([ivxlcdm]+)\b/g, (_m, _g1, r) => `article ${romanToInt(r) || r}`);
  s = s.replace(/\b(section|sec)\.?\s+([ivxlcdm]+)\b/g, (_m, _g1, r) => `section ${romanToInt(r) || r}`);

  // compact number-letter like 5 a → 5(a) (helps citation forms)
  s = s.replace(/\b(\d+)\s*([a-z])\b/g, '$1($2)');

  // jurisprudence citation: G.R. No. 123456 → gr number 123456
  s = s.replace(/\bg\.?\s*r\.?\s*no\.?\s*(\d{1,7})\b/g, ' gr number $1 ');

  // anti- allowlist expansion (hardened)
  const antiAllow = [
    'graft', 'trafficking', 'terrorism', 'wiretapping', 'fencing', 'hazing',
    'money laundering', 'money-laundering', 'moneylaundering', 'red tape', 'red-tape', 'redtape'
  ];
  for (const term of antiAllow) {
    // create a tolerant pattern that matches anti-term with optional hyphen/space
    const base = term.replace(/[-\s]+/g, '[-\s]?');
    const re = new RegExp(`\banti${base}\b`, 'g');
    // expand to include base tokens alongside the anti- form
    s = s.replace(re, (m) => `${m} ${term.replace(/-/g, ' ')}`);
  }

  // collapse whitespace
  s = s.replace(/[^a-z0-9()\-\s]+/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}
// List entries (basic projection)
router.get('/entries', async (req, res) => {
  try {
    // Return full rows so the detail modal has all fields available
    const result = await query(
      `select * from kb_entries order by updated_at desc`,
      []
    );
    res.json({ success: true, entries: result.rows });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Get single entry
router.get('/entries/:entryId', async (req, res) => {
  try {
    const entryId = String(req.params.entryId || '').trim();
    if (!entryId) return res.status(400).json({ success: false, error: 'entryId is required' });
    
    const result = await query(
      `select * from kb_entries where entry_id = $1`,
      [entryId]
    );
    
    if (!result.rows.length) return res.status(404).json({ status: 404, error: 'not found' });
    res.json({ success: true, entry: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});


const UpsertSchema = z.object({
  entry_id: z.string(),
  type: z.string(),
  title: z.string(),
  canonical_citation: z.string().optional(),
  summary: z.string().optional(),
  text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  jurisdiction: z.string().optional(),
  law_family: z.string().optional(),
  section_id: z.string().optional(),
  status: z.string().optional(),
  effective_date: z.string().optional(),
  amendment_date: z.string().nullable().optional(),
  last_reviewed: z.string().optional(),
  visibility: z.object({ gli: z.boolean(), cpa: z.boolean() }).optional(),
  source_urls: z.array(z.string()).optional(),
  elements: z.array(z.string()).optional(),
  penalties: z.array(z.string()).optional(),
  defenses: z.array(z.string()).optional(),
  prescriptive_period: z.any().optional(),
  standard_of_proof: z.string().optional(),
  rule_no: z.string().optional(),
  section_no: z.string().optional(),
  triggers: z.array(z.string()).optional(),
  time_limits: z.array(z.string()).optional(),
  required_forms: z.array(z.string()).optional(),
  circular_no: z.string().optional(),
  applicability: z.array(z.string()).optional(),
  issuance_no: z.string().optional(),
  instrument_no: z.string().optional(),
  supersedes: z.any().optional(),
  steps_brief: z.array(z.string()).optional(),
  forms_required: z.array(z.string()).optional(),
  failure_states: z.array(z.string()).optional(),
  violation_code: z.string().optional(),
  violation_name: z.string().optional(),
  license_action: z.string().optional(),
  fine_schedule: z.any().optional(),
  apprehension_flow: z.array(z.string()).optional(),
  incident: z.string().optional(),
  phases: z.any().optional(),
  forms: z.array(z.string()).optional(),
  handoff: z.array(z.string()).optional(),
  rights_callouts: z.array(z.string()).optional(),
  rights_scope: z.string().optional(),
  advice_points: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  jurisprudence: z.array(z.string()).optional(),
  // Be permissive: accept any array for relations to avoid losing data due to minor shape differences
  legal_bases: z.any().optional(),
  related_sections: z.any().optional(),
  created_by_name: z.string().optional(),
  verified: z.boolean().optional(),
  verified_by: z.string().optional(),
  verified_at: z.string().optional(),
});

router.post('/entries', async (req, res) => {
  try {
    const parsed = UpsertSchema.parse(req.body);
    if (!parsed.entry_id || parsed.entry_id.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'entry_id is required' });
    }

    // Check if entry_id already exists (for new entries)
    const existingEntry = await query('SELECT entry_id FROM kb_entries WHERE entry_id = $1', [parsed.entry_id]);
    if (existingEntry.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `Entry ID '${parsed.entry_id}' already exists. Please use a different entry ID or update the existing entry.` 
      });
    }
    const contentForEmbedding = buildEmbeddingText(parsed);
    let embeddingLiteral = null;
    try {
      const embedding = await embedText(contentForEmbedding);
      embeddingLiteral = `[${embedding.join(',')}]`;
    } catch (err) {
      console.warn('[kb] embedText failed; saving without embedding:', String(err?.message || err));
      embeddingLiteral = null;
    }

    const createdBy = req.user?.userId || null;
    const createdByName = parsed.created_by_name || req.user?.name || null;

    // 1) Ensure row exists with required non-null columns
    try {
      // Try to insert with created_by_name first
      await query(
        `insert into kb_entries (entry_id, type, title, created_by, created_by_name)
         values ($1, $2, $3, $4, $5)
         on conflict (entry_id) do update set type=excluded.type, title=excluded.title, created_by=excluded.created_by, created_by_name=excluded.created_by_name`,
        [parsed.entry_id, parsed.type, parsed.title, createdBy, createdByName]
      );
    } catch (error) {
      // If created_by_name column doesn't exist, fall back to basic insert
      if (error.message.includes('created_by_name')) {
        console.log('created_by_name column not found, using fallback insert');
        await query(
          `insert into kb_entries (entry_id, type, title, created_by)
           values ($1, $2, $3, $4)
           on conflict (entry_id) do update set type=excluded.type, title=excluded.title, created_by=excluded.created_by`,
          [parsed.entry_id, parsed.type, parsed.title, createdBy]
        );
      } else {
        throw error;
      }
    }

    // 2) Update all fields (single authoritative update)
    await query(
      `update kb_entries set
         canonical_citation=$2,
         summary=$3,
         text=$4,
         tags=$5,
         jurisdiction=$6,
         law_family=$7,
         section_id=$8,
         status=$9,
         effective_date=$10,
         amendment_date=$11,
         last_reviewed=$12,
         visibility=$13,
         source_urls=$14,
         elements=$15,
         penalties=$16,
         defenses=$17,
         prescriptive_period=$18,
         standard_of_proof=$19,
         rule_no=$20,
         section_no=$21,
         triggers=$22,
         time_limits=$23,
         required_forms=$24,
         circular_no=$25,
         applicability=$26,
         issuance_no=$27,
         instrument_no=$28,
         supersedes=$29,
         steps_brief=$30,
         forms_required=$31,
         failure_states=$32,
         violation_code=$33,
         violation_name=$34,
         license_action=$35,
         fine_schedule=$36,
         apprehension_flow=$37,
         incident=$38,
         phases=$39,
         forms=$40,
         handoff=$41,
         rights_callouts=$42,
         rights_scope=$43,
         advice_points=$44,
         topics=$45,
         jurisprudence=$46,
         legal_bases=$47,
         related_sections=$48,
         created_by_name=$49,
         verified=NULL,
         verified_by=NULL,
         verified_at=NULL,
         embedding=COALESCE($50::vector, kb_entries.embedding),
         updated_at=now()
       where entry_id=$1`,
      [
        parsed.entry_id,
        parsed.canonical_citation || null,
        parsed.summary || null,
        parsed.text || null,
        JSON.stringify(parsed.tags || []),
        parsed.jurisdiction || null,
        parsed.law_family || null,
        parsed.section_id || null,
        parsed.status || null,
        parsed.effective_date || null,
        parsed.amendment_date || null,
        parsed.last_reviewed || null,
        JSON.stringify(parsed.visibility ?? { gli: true, cpa: false }),
        JSON.stringify(parsed.source_urls || []),
        JSON.stringify(parsed.elements || []),
        JSON.stringify(parsed.penalties || []),
        JSON.stringify(parsed.defenses || []),
        JSON.stringify(parsed.prescriptive_period || null),
        parsed.standard_of_proof || null,
        parsed.rule_no || null,
        parsed.section_no || null,
        JSON.stringify(parsed.triggers || []),
        JSON.stringify(parsed.time_limits || []),
        JSON.stringify(parsed.required_forms || []),
        parsed.circular_no || null,
        JSON.stringify(parsed.applicability || []),
        parsed.issuance_no || null,
        parsed.instrument_no || null,
        JSON.stringify(parsed.supersedes || []),
        JSON.stringify(parsed.steps_brief || []),
        JSON.stringify(parsed.forms_required || []),
        JSON.stringify(parsed.failure_states || []),
        parsed.violation_code || null,
        parsed.violation_name || null,
        parsed.license_action || null,
        JSON.stringify(parsed.fine_schedule || []),
        JSON.stringify(parsed.apprehension_flow || []),
        parsed.incident || null,
        JSON.stringify(parsed.phases || []),
        JSON.stringify(parsed.forms || []),
        JSON.stringify(parsed.handoff || []),
        JSON.stringify(parsed.rights_callouts || []),
        parsed.rights_scope || null,
        JSON.stringify(parsed.advice_points || []),
        JSON.stringify(parsed.topics || []),
        JSON.stringify(parsed.jurisprudence || []),
        JSON.stringify(parsed.legal_bases || []),
        JSON.stringify(parsed.related_sections || []),
        createdByName,

        embeddingLiteral,
      ]
    );

    res.json({ success: true, entry_id: parsed.entry_id });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Delete by entry_id
router.delete('/entries/:entryId', async (req, res) => {
  try {
    const entryId = String(req.params.entryId || '').trim();
    if (!entryId) return res.status(400).json({ success: false, error: 'entryId is required' });
    await query('delete from kb_entries where entry_id = $1', [entryId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Update existing entry by entry_id
router.put('/entries/:entryId', async (req, res) => {
  try {
    const entryId = String(req.params.entryId || '').trim();
    if (!entryId) return res.status(400).json({ success: false, error: 'entryId is required' });
    
    const parsed = UpsertSchema.parse(req.body);
    if (parsed.entry_id !== entryId) {
      return res.status(400).json({ success: false, error: 'entry_id in body must match URL parameter' });
    }

    console.log('[kb] PUT /entries - Updating entry:', {
      entry_id: parsed.entry_id,
      type: parsed.type,
      title: parsed.title,
      status: parsed.status,
      elements: parsed.elements,
      penalties: parsed.penalties,
      defenses: parsed.defenses
    });

    const contentForEmbedding = buildEmbeddingText(parsed);
    
    let embeddingLiteral = null;
    try {
      const embedding = await embedText(contentForEmbedding);
      embeddingLiteral = `[${embedding.join(',')}]`;
    } catch (err) {
      console.warn('[kb] embedText failed; updating without new embedding:', String(err?.message || err));
      embeddingLiteral = null;
    }

    // Update all fields
    await query(
      `update kb_entries set
         type=$2,
         title=$3,
         canonical_citation=$4,
         summary=$5,
         text=$6,
         tags=$7,
         jurisdiction=$8,
         law_family=$9,
         section_id=$10,
         status=$11,
         effective_date=$12,
         amendment_date=$13,
         last_reviewed=now()::date,
         visibility=$14,
         source_urls=$15,
         elements=$16,
         penalties=$17,
         defenses=$18,
         prescriptive_period=$19,
         standard_of_proof=$20,
         rule_no=$21,
         section_no=$22,
         triggers=$23,
         time_limits=$24,
         required_forms=$25,
         circular_no=$26,
         applicability=$27,
         issuance_no=$28,
         instrument_no=$29,
         supersedes=$30,
         steps_brief=$31,
         forms_required=$32,
         failure_states=$33,
         violation_code=$34,
         violation_name=$35,
         license_action=$36,
         fine_schedule=$37,
         apprehension_flow=$38,
         incident=$39,
         phases=$40,
         forms=$41,
         handoff=$42,
         rights_callouts=$43,
         rights_scope=$44,
         advice_points=$45,
         topics=$46,
         jurisprudence=$47,
         legal_bases=$48,
         related_sections=$49,
         verified=NULL,
         verified_by=NULL,
         verified_at=NULL,
         embedding=COALESCE($50::vector, kb_entries.embedding),
         updated_at=now()
       where entry_id=$1`,
      [
        parsed.entry_id,
        parsed.type,
        parsed.title,
        parsed.canonical_citation || null,
        parsed.summary || null,
        parsed.text || null,
        JSON.stringify(parsed.tags || []),
        parsed.jurisdiction || null,
        parsed.law_family || null,
        parsed.section_id || null,
        parsed.status || null,
        parsed.effective_date || null,
        parsed.amendment_date || null,
        JSON.stringify(parsed.visibility ?? { gli: true, cpa: false }),
        JSON.stringify(parsed.source_urls || []),
        JSON.stringify(parsed.elements || []),
        JSON.stringify(parsed.penalties || []),
        JSON.stringify(parsed.defenses || []),
        JSON.stringify(parsed.prescriptive_period || null),
        parsed.standard_of_proof || null,
        parsed.rule_no || null,
        parsed.section_no || null,
        JSON.stringify(parsed.triggers || []),
        JSON.stringify(parsed.time_limits || []),
        JSON.stringify(parsed.required_forms || []),
        parsed.circular_no || null,
        JSON.stringify(parsed.applicability || []),
        parsed.issuance_no || null,
        parsed.instrument_no || null,
        JSON.stringify(parsed.supersedes || []),
        JSON.stringify(parsed.steps_brief || []),
        JSON.stringify(parsed.forms_required || []),
        JSON.stringify(parsed.failure_states || []),
        parsed.violation_code || null,
        parsed.violation_name || null,
        parsed.license_action || null,
        JSON.stringify(parsed.fine_schedule || []),
        JSON.stringify(parsed.apprehension_flow || []),
        parsed.incident || null,
        JSON.stringify(parsed.phases || []),
        JSON.stringify(parsed.forms || []),
        JSON.stringify(parsed.handoff || []),
        JSON.stringify(parsed.rights_callouts || []),
        parsed.rights_scope || null,
        JSON.stringify(parsed.advice_points || []),
        JSON.stringify(parsed.topics || []),
        JSON.stringify(parsed.jurisprudence || []),
        JSON.stringify(parsed.legal_bases || []),
        JSON.stringify(parsed.related_sections || []),

        embeddingLiteral,
      ]
    );

    res.json({ success: true, entry_id: parsed.entry_id });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Bulk delete: all or by date (YYYY-MM-DD)
router.delete('/entries', async (req, res) => {
  try {
    const { date } = req.query || {};
    if (date) {
      await query('delete from kb_entries where created_at::date = $1::date', [String(date)]);
      return res.json({ success: true, scope: 'date', date });
    }
    await query('delete from kb_entries', []);
    res.json({ success: true, scope: 'all' });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Verify entry
router.post('/entries/:entryId/verify', async (req, res) => {
  try {
    const entryId = String(req.params.entryId || '').trim();
    if (!entryId) return res.status(400).json({ success: false, error: 'entryId is required' });
    
    // User info is already available from authenticateToken middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    // Get user details
    const userResult = await query(
      'SELECT name, person_id FROM users WHERE id = $1',
      [req.user.userId || req.user.id]
    );
    
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Only P3 and P5 can verify entries
    if (user.person_id !== 'P3' && user.person_id !== 'P5') {
      return res.status(403).json({ success: false, error: 'Only P3 and P5 team members can verify entries' });
    }
    
    // Update entry verification status
    await query(
      `UPDATE kb_entries SET 
         verified = true,
         verified_by = $2,
         verified_at = now(),
         last_reviewed = now()::date
       WHERE entry_id = $1`,
      [entryId, user.name]
    );
    
    // Get updated entry
    const result = await query(
      'SELECT * FROM kb_entries WHERE entry_id = $1',
      [entryId]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    
    res.json({ success: true, entry: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Re-verify entry (reset verification status)
router.post('/entries/:entryId/reverify', async (req, res) => {
  try {
    const entryId = String(req.params.entryId || '').trim();
    if (!entryId) return res.status(400).json({ success: false, error: 'entryId is required' });
    
    // User info is already available from authenticateToken middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    // Get user details
    const userResult = await query(
      'SELECT name, person_id FROM users WHERE id = $1',
      [req.user.userId || req.user.id]
    );
    
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Only P3 and P5 can re-verify entries
    if (user.person_id !== 'P3' && user.person_id !== 'P5') {
      return res.status(403).json({ success: false, error: 'Only P3 and P5 team members can re-verify entries' });
    }
    
    // Update entry verification status to null
    await query(
      `UPDATE kb_entries SET 
         verified = NULL,
         verified_by = NULL,
         verified_at = NULL
       WHERE entry_id = $1`,
      [entryId]
    );
    
    // Get updated entry
    const result = await query(
      'SELECT * FROM kb_entries WHERE entry_id = $1',
      [entryId]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    
    res.json({ success: true, entry: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

const SearchSchema = z.object({
  query: z.string(),
  limit: z.number().int().min(1).max(50).optional(),
});

router.post('/search', async (req, res) => {
  try {
    const { query: q, limit = 10 } = SearchSchema.parse(req.body);
    // Keep existing vector search endpoint intact; add a new lexical endpoint below
    const qEmbedding = await embedText(q);
    const qEmbeddingLiteral = `[${qEmbedding.join(',')}]`;
    const result = await query(
      `select entry_id, type, title, canonical_citation, summary, tags,
              1 - (embedding <=> $1::vector) as similarity
       from kb_entries
       order by embedding <=> $1::vector
       limit $2`,
      [qEmbeddingLiteral, limit]
    );
    res.json({ success: true, results: result.rows });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// New: GET /api/kb/search (lexical + trigram fallback)
const LexicalQuerySchema = z.object({
  query: z.string().min(1),
  type: z.string().optional(),
  jurisdiction: z.string().optional(),
  status: z.string().optional(),
  verified: z.enum(['yes','not_verified']).optional(),
  team_member_id: z.string().optional(),
  limit: z.preprocess((v)=>Number(v), z.number().int().min(1).max(100)).optional(),
  cursor: z.string().optional(),
  explain: z.preprocess((v)=> (v === 'true' || v === true), z.boolean()).optional(),
});

router.get('/search', async (req, res) => {
  try {
    const p = LexicalQuerySchema.parse(req.query);
    let limit = p.limit || 20;
    if (Number.isFinite(limit)) {
      limit = Math.max(1, Math.min(100, limit));
    } else {
      limit = 20;
    }
    const originalQ = String(p.query || '').trim();
    const q = normalizeAndExpandQuery(originalQ);
    if (!q) return res.status(400).json({ error: 'query is required' });

    // websearch_to_tsquery + fallback trigram union
    const sql = `
      with params as (
        select 
          websearch_to_tsquery('simple', $1) as tsq,
          regexp_replace(lower($1), '\\s+', '', 'g') as compact_q,
          lower($1) as q_norm,
          split_part(lower($1), ' ', 1) as first_tok
      ), lex as (
        select k.entry_id, k.type, k.title, k.canonical_citation, k.section_id, k.law_family, k.tags, k.summary,
               k.verified, k.status, k.effective_date,
               ts_rank_cd(k.search_vec, (select tsq from params)) as rank_score,
               case when $7::boolean is true then ts_headline('simple', coalesce(k.title,''), (select tsq from params), 'MinWords=3, MaxWords=12') else null end as hl_title,
               case when $7::boolean is true then ts_headline('simple', coalesce(k.summary,''), (select tsq from params), 'MinWords=6, MaxWords=18') else null end as hl_summary,
               case when $7::boolean is true then ts_headline('simple', coalesce(k.canonical_citation,''), (select tsq from params), 'MinWords=2, MaxWords=8') else null end as hl_citation,
               ((setweight(to_tsvector('simple', coalesce(k.title,'')),'A')) @@ (select tsq from params)) as m_title,
               ((setweight(to_tsvector('simple', coalesce(k.canonical_citation,'')),'A')) @@ (select tsq from params)) as m_citation,
               ((setweight(to_tsvector('simple', coalesce(k.section_id,'')),'B')) @@ (select tsq from params)) as m_section
        from kb_entries k
        where k.search_vec @@ (select tsq from params)
          and ($2::text is null or k.type = $2)
          and ($3::text is null or k.jurisdiction = $3)
          and ($4::text is null or k.status = $4)
          and ($5::text is null or (case when $5 = 'yes' then k.verified = true else k.verified is not true end))
      ), tri as (
        select k.entry_id, k.type, k.title, k.canonical_citation, k.section_id, k.law_family, k.tags, k.summary,
               k.verified, k.status, k.effective_date,
               0.15 as rank_score,
               null::text as hl_title,
               null::text as hl_summary,
               null::text as hl_citation,
               false as m_title,
               false as m_citation,
               false as m_section
        from kb_entries k, params
        where ($1 <> '') and (
          lower(k.title) % (select q_norm from params) or
          lower(k.canonical_citation) % (select q_norm from params) or
          k.compact_citation like '%' || (select compact_q from params) || '%'
        )
          and ($2::text is null or k.type = $2)
          and ($3::text is null or k.jurisdiction = $3)
          and ($4::text is null or k.status = $4)
          and ($5::text is null or (case when $5 = 'yes' then k.verified = true else k.verified is not true end))
      ), unioned as (
        select * from lex
        union all
        select * from tri
      )
      select *,
             -- symmetric trigram similarities for title and citation (equal weight)
             similarity(lower(coalesce(title,'')), (select q_norm from params)) as sim_title,
             similarity(lower(coalesce(canonical_citation,'')), (select q_norm from params)) as sim_citation,
             similarity(lower(coalesce(array_to_string(tags,' '),'')), (select q_norm from params)) as sim_tags,
             (case when lower(coalesce(title,'')) like (select first_tok from params) || ' %' or lower(coalesce(title,'')) = (select first_tok from params) then 1 else 0 end) as title_starts,
             (case when lower(coalesce(title,'')||' '||coalesce(canonical_citation,'')) = (select q_norm from params) then 1000 else 0 end) as exact_pin,
             array_remove(array[
               case when m_title then 'title' else null end,
               case when m_citation then 'canonical_citation' else null end,
               case when m_section then 'section_id' else null end
             ], null) as matched_fields
      from unioned
      order by (
                 rank_score
                 + (case when lower(coalesce(title,'')||' '||coalesce(canonical_citation,'')) = (select q_norm from params) then 1000 else 0 end)
                 + (sim_title * 0.75)
                 + (sim_citation * 0.75)
                 + (sim_tags * 0.50)
                 + (case when title_starts = 1 then 0.60 else 0 end)
               ) desc,
               (case when verified then 1 else 0 end) desc,
               (case when lower(coalesce(status,'')) = 'active' then 1 else 0 end) desc,
               coalesce(effective_date, '0001-01-01') desc,
               length(coalesce(title,'')) asc,
               entry_id asc
      limit $6`;

    const params = [ q, p.type || null, p.jurisdiction || null, p.status || null, p.verified || null, limit, Boolean(p.explain) ];
    let result = await query(sql, params);

    // Domain-aware re-rank boosts for agency/admin queries
    const qn = q.toLowerCase();
    const agencyKeys = ['nbi','bir','dilg','ltfrb','dotr','dhsud'];
    const phraseSignals = [
      { key: 'memorandum circular', type: 'agency_circular', boost: 2.5 },
      { key: ' mc ', type: 'agency_circular', boost: 2.0 },
      { key: 'department order', type: 'executive_issuance', boost: 2.5 },
      { key: 'license to sell', type: 'executive_issuance', boost: 2.5 },
      { key: 'franchise suspension', type: 'agency_circular', boost: 2.0 },
      { key: 'clearance', type: null, boost: 1.0 },
      { key: 'gr number', type: null, boost: 1.0 },
    ];
    const hasAgency = agencyKeys.some(k => qn.includes(k));
    const typeSig = phraseSignals.find(p => qn.includes(p.key)) || null;
    let boostedRows = (result.rows || []).map(r => {
      let extra = 0;
      const title = String(r.title || '').toLowerCase();
      const lawfam = String(r.law_family || '').toLowerCase();
      const tags = Array.isArray(r.tags) ? String(r.tags.join(' ')).toLowerCase() : '';
      // Citation-aware boosts: RA and Section tokens
      const raMatch = qn.match(/\brepublic\s+act\s+(\d{2,5})\b/);
      const secMatch = qn.match(/\bsection\s+(\d+[a-z]?|\d+\([a-z]\))\b/);
      if (raMatch) {
        const raNum = raMatch[1];
        const inTitle = title.includes(`ra ${raNum}`) || title.includes(`republic act ${raNum}`);
        const inCit = String(r.canonical_citation || '').toLowerCase().includes(raNum);
        const inCompact = String(r.compact_citation || '').toLowerCase().includes(`ra${raNum}`);
        if (inTitle || inCit || inCompact) extra += 2.0;
      }
      if (secMatch) {
        const secTok = secMatch[1].replace(/\s+/g,'');
        const secPlain = secTok.replace(/\(|\)/g,'');
        const txt = `${title} ${String(r.canonical_citation||'').toLowerCase()} ${String(r.section_id||'').toLowerCase()} ${String(r.compact_citation||'').toLowerCase()}`;
        if (txt.includes(`section ${secPlain}`) || txt.includes(secTok) || txt.includes(secPlain)) extra += 1.5;
      }
      if (hasAgency) {
        if (agencyKeys.some(k => title.includes(k) || lawfam.includes(k) || tags.includes(k))) {
          extra += 1.5; // agency acronyms align
        }
      }
      if (typeSig && typeSig.type && String(r.type || '') === typeSig.type) {
        extra += typeSig.boost;
      }
      return { ...r, __boost: extra };
    })
    .sort((a, b) => {
      const sa = (a.rank_score || 0) + (a.exact_pin || 0) + (a.__boost || 0);
      const sb = (b.rank_score || 0) + (b.exact_pin || 0) + (b.__boost || 0);
      if (sb !== sa) return sb - sa;
      const av = a.verified === true ? 1 : 0; const bv = b.verified === true ? 1 : 0; if (bv !== av) return bv - av;
      const aActive = String(a.status || '').toLowerCase() === 'active' ? 1 : 0; const bActive = String(b.status || '').toLowerCase() === 'active' ? 1 : 0; if (bActive !== aActive) return bActive - aActive;
      const ad = a.effective_date ? Date.parse(a.effective_date) : 0; const bd = b.effective_date ? Date.parse(b.effective_date) : 0; if (bd !== ad) return bd - ad;
      const at = String(a.title || '').length; const bt = String(b.title || '').length; if (at !== bt) return at - bt;
      const aid = String(a.entry_id || a.id || ''); const bid = String(b.entry_id || b.id || ''); return aid.localeCompare(bid);
    });

    // Soft fallback: if no results, run multi-word ILIKE across title/citation/summary
    if (!boostedRows.length) {
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);
      if (tokens.length) {
        const likeClauses = tokens
          .map((_, idx) => `(
            lower(title) LIKE $${idx + 1}
            OR lower(canonical_citation) LIKE $${idx + 1}
            OR lower(summary) LIKE $${idx + 1}
          )`)
          .join(' AND ');
        const likeParams = tokens.map(t => `%${t}%`);
        const softSql = `
          select entry_id, type, title, canonical_citation, section_id, law_family, tags, summary,
                 verified, status, effective_date,
                 0.05 as rank_score,
                 null::text as hl_title,
                 null::text as hl_summary,
                 null::text as hl_citation,
                 false as m_title,
                 false as m_citation,
                 false as m_section
          from kb_entries
          where ${likeClauses}
          limit $${likeParams.length + 1}
        `;
        try {
          const softRes = await query(softSql, [...likeParams, limit]);
          boostedRows = softRes.rows || [];
        } catch (e) {
          // ignore; keep empty results
        }
      }
    }

    // Always compute a best suggestion (title-based)
    let bestSuggestion = null;
    try {
      const s = await query(
        `with params as (
           select lower($1) as q
         )
         select title
         from kb_entries, params
         where title is not null and title <> ''
         order by similarity(lower(title), (select q from params)) desc
         limit 1`,
        [ originalQ ]
      );
      bestSuggestion = s.rows?.[0]?.title || null;
    } catch (e) {
      bestSuggestion = null;
    }

    // Build suggestions[] when results are low or empty
    let suggestions = [];
    if (boostedRows.length < 3) {
      try {
        const sug = await query(
          `with params as (
             select lower($1) as q
           )
           select entry_id, type, title, canonical_citation
           from (
             select entry_id, type, title, canonical_citation,
                    similarity(lower(title), (select q from params)) as score
             from kb_entries
             union all
             select entry_id, type, title, canonical_citation,
                    similarity(lower(coalesce(canonical_citation,'')), (select q from params)) as score
             from kb_entries
             union all
             select entry_id, type, title, canonical_citation,
                    similarity(lower(coalesce(array_to_string(tags,' '),'')), (select q from params)) as score
             from kb_entries
           ) s
           where score > 0
           order by score desc
           limit 10`,
          [ originalQ ]
        );
        suggestions = Array.isArray(sug.rows) ? sug.rows : [];
      } catch (e) {
        suggestions = [];
      }
    }

    res.json({
      success: true,
      took_ms: undefined,
      results: boostedRows,
      cursor: null,
      suggestion: bestSuggestion,
      suggestions,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

export default router;




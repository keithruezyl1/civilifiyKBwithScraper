import express from 'express';
import { ScrapingOrchestrator } from '../scraper/ScrapingOrchestrator.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { embedText } from '../embeddings.js';
import buildEmbeddingText from '../embedding-builder.js';
import { enrichEntryWithGPT, isGPTAvailable } from '../gpt-service.js';

dotenv.config();

const router = express.Router();
/**
 * Lightweight GPT availability status
 */
router.get('/gpt-status', (_req, res) => {
  try {
    const available = isGPTAvailable();
    res.json({ success: true, available, model: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo' });
  } catch (e) {
    res.status(200).json({ success: true, available: false, model: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo' });
  }
});

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// In-memory cancel flags for entry generation per session
const cancelGenerationBySession = new Map();

/**
 * Generate stable entry ID from metadata
 */
function generateEntryId(metadata, category) {
  const { articleNumber, sectionNumber, preamble, actNumber, sectionNumber: actSectionNumber } = metadata || {};
  
  if (category === 'constitution_1987') {
    if (preamble) {
      return 'CONST-1987-PREAMBLE';
    }
    if (articleNumber && sectionNumber) {
      return `CONST-1987-ART${articleNumber}-SEC${sectionNumber}`;
    }
    if (articleNumber) {
      return `CONST-1987-ART${articleNumber}`;
    }
    // Check for ordinance in metadata
    if (metadata.title && metadata.title.toLowerCase().includes('ordinance')) {
      return 'CONST-1987-ORDINANCE';
    }
  }
  
  if (category === 'acts') {
    if (actNumber && actSectionNumber) {
      return `ACT-${actNumber}-SEC${actSectionNumber}`;
    }
    if (actNumber) {
      return `ACT-${actNumber}`;
    }
  }
  
  // Fallback to hash-based ID
  const content = JSON.stringify(metadata);
  const hash = require('crypto').createHash('md5').update(content).digest('hex').substring(0, 8);
  return `ENTRY-${hash}`;
}

/**
 * Generate historical_context based on act metadata
 * Uses predefined values to avoid GPT credits
 */
function generateHistoricalContext(metadata, entrySubtype, canonicalCitation) {
  // For post-1946 Acts: no historical context needed
  if (!entrySubtype || entrySubtype === 'republic_act' || entrySubtype === 'mga_batas_pambansa') {
    return null;
  }
  
  // Extract year from metadata or canonical citation
  const year = metadata?.year || null;
  const actNumber = metadata?.actNumber || null;
  const url = metadata?.canonicalUrl || '';
  
  // Check canonical citation for act type
  const cit = String(canonicalCitation || '').toLowerCase();
  
  // Commonwealth Acts (1935-1946)
  if (entrySubtype === 'commonwealth_act' || cit.includes('commonwealth act') || cit.includes('ca ')) {
    return 'Commonwealth period law; check current applicability';
  }
  
  // 1930 Acts (pre-Commonwealth)
  if (entrySubtype === 'act' || cit.includes('act no.') || url.includes('/act193') || url.includes('/acts/act')) {
    // Check if it's specifically Act No. 3815 (Revised Penal Code)
    if (actNumber === '3815' || actNumber === 3815 || cit.includes('act no. 3815') || cit.includes('act 3815')) {
      return 'Pre-Commonwealth statute (Revised Penal Code); verify current applicability and amendments';
    }
    
    // Check year range for 1930 Acts
    if (year && parseInt(year) >= 1930 && parseInt(year) < 1935) {
      return 'Pre-Commonwealth statute; may be repealed or superseded';
    }
    
    // Default for any Act (pre-1946)
    if (!year || parseInt(year) < 1946) {
      return 'Pre-Commonwealth statute; may be repealed or superseded';
    }
  }
  
  // Default: no historical context for modern laws
  return null;
}

/**
 * Generate canonical citation from metadata
 */
function generateCanonicalCitation(metadata, category) {
  const { articleNumber, sectionNumber, preamble, title, actNumber, sectionNumber: actSectionNumber, year } = metadata || {};
  
  if (category === 'constitution_1987') {
    if (preamble) {
      return '1987 Constitution, Preamble';
    }
    if (articleNumber && sectionNumber) {
      return `1987 Constitution, Article ${articleNumber}, Section ${sectionNumber}`;
    }
    if (articleNumber) {
      return `1987 Constitution, Article ${articleNumber}`;
    }
    if (title && title.toLowerCase().includes('ordinance')) {
      return '1987 Constitution, Ordinance';
    }
  }
  
  if (category === 'acts') {
    if (actNumber && actSectionNumber) {
      return `Act No. ${actNumber}, Section ${actSectionNumber} (${year})`;
    }
    if (actNumber) {
      return `Act No. ${actNumber} (${year})`;
    }
  }
  
  return title || 'Unknown Citation';
}

/**
 * Generate a structured section ID for filtering and deduplication
 */
function generateSectionId(entryId) {
  // Extract article and section from entry ID
  const match = entryId.match(/CONST-1987-ART(\d+)-SEC(\d+)/);
  if (match) {
    const article = match[1];
    const section = match[2];
    return `ART${article}-SEC${section}`;
  }
  
  // Handle special cases
  if (entryId.includes('PREAMBLE')) {
    return 'PREAMBLE';
  } else if (entryId.includes('ORDINANCE')) {
    return 'ORDINANCE';
  } else if (entryId.match(/CONST-1987-ART(\d+)$/)) {
    const match = entryId.match(/CONST-1987-ART(\d+)$/);
    return `ART${match[1]}`;
  }
  
  return entryId;
}

// Initialize orchestrator
const orchestrator = new ScrapingOrchestrator(process.env.DATABASE_URL, {
  scraper: {
    maxRps: 1,
    concurrency: 1,
    userAgent: 'LawEntryBot/1.0 (contact@example.com)',
    timeout: 30000,
    retryAttempts: 3
  }
});

/**
 * Start a scraping session
 */
router.post('/start', async (req, res) => {
  try {
    const { url, category = 'constitution_1987', operator = 'user' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`🚀 Starting scraping session for: ${url}`);
    
    // Start session
    const sessionId = await orchestrator.startSession(category, url, operator);
    
    res.json({ 
      success: true, 
      sessionId,
      message: 'Scraping session started'
    });
    
  } catch (error) {
    console.error('Failed to start scraping session:', error);
    res.status(500).json({ 
      error: 'Failed to start scraping session',
      details: error.message 
    });
  }
});

/**
 * Clear all scraped data - comprehensive cleanup for fresh start
 */
router.post('/clear-all', async (_req, res) => {
  try {
    console.log('🧹 Starting comprehensive data cleanup...');
    
    // Clear all unpublished entries (draft entries)
    const entriesResult = await db.query(`
      DELETE FROM kb_entries
      WHERE published_at IS NULL
      RETURNING entry_id
    `);
    
    // Clear all scraped documents
    const documentsResult = await db.query(`
      DELETE FROM scraped_documents
      RETURNING id
    `);
    
    // Clear all scraping sessions
    const sessionsResult = await db.query(`
      DELETE FROM scraping_sessions
      RETURNING id
    `);
    
    // Clear all GPT inferences
    const inferencesResult = await db.query(`
      DELETE FROM gpt_inferences
      RETURNING id
    `);
    
    // Clear all batch releases
    const batchResult = await db.query(`
      DELETE FROM batch_releases
      RETURNING id
    `);
    
    console.log(`✅ Cleanup completed:`);
    console.log(`  - Entries: ${entriesResult.rows.length}`);
    console.log(`  - Documents: ${documentsResult.rows.length}`);
    console.log(`  - Sessions: ${sessionsResult.rows.length}`);
    console.log(`  - Inferences: ${inferencesResult.rows.length}`);
    console.log(`  - Batches: ${batchResult.rows.length}`);
    
    res.json({ 
      success: true, 
      deleted_counts: {
        entries: entriesResult.rows.length,
        documents: documentsResult.rows.length,
        sessions: sessionsResult.rows.length,
        inferences: inferencesResult.rows.length,
        batches: batchResult.rows.length
      }
    });
  } catch (error) {
    console.error('Failed to clear all data:', error);
    res.status(500).json({ error: 'Failed to clear all data', details: error.message });
  }
});

/**
 * Clear only scraped documents and sessions (preserves generated KB entries)
 */
router.post('/clear-scraped-data', async (_req, res) => {
  try {
    console.log('🧹 Clearing scraped documents and sessions (preserving KB entries)...');
    
    // Clear all scraped documents
    const documentsResult = await db.query(`
      DELETE FROM scraped_documents
      RETURNING id
    `);
    
    // Clear all scraping sessions
    const sessionsResult = await db.query(`
      DELETE FROM scraping_sessions
      RETURNING id
    `);
    
    // Clear GPT inferences
    const inferencesResult = await db.query(`
      DELETE FROM gpt_inferences
      RETURNING id
    `);
    
    // Clear batch releases
    const batchesResult = await db.query(`
      DELETE FROM batch_releases
      RETURNING id
    `);

    console.log('✅ Scraped data cleanup completed:');
    console.log(`  - Documents: ${documentsResult.rows.length}`);
    console.log(`  - Sessions: ${sessionsResult.rows.length}`);
    console.log(`  - Inferences: ${inferencesResult.rows.length}`);
    console.log(`  - Batches: ${batchesResult.rows.length}`);

    res.json({
      success: true,
      deleted_count: documentsResult.rows.length + sessionsResult.rows.length,
      details: {
        documents: documentsResult.rows.length,
        sessions: sessionsResult.rows.length,
        inferences: inferencesResult.rows.length,
        batches: batchesResult.rows.length
      }
    });
  } catch (error) {
    console.error('Failed to clear scraped data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear only UNSAVED scraped data (preserve saved batches)
 * - Deletes scraped_documents/inferences for sessions not marked saved
 * - Preserves sessions with is_saved=true or with a description present
 */
router.post('/clear-unsaved', async (_req, res) => {
  try {
    // Determine column availability
    const colRes = await db.query(`select column_name from information_schema.columns where table_name = 'scraping_sessions'`);
    const cols = new Set(colRes.rows.map(r => r.column_name));
    const hasDescription = cols.has('description');
    const hasIsSaved = cols.has('is_saved');

    let sessionIds = [];
    if (hasDescription || hasIsSaved) {
      // Select unsaved sessions
      const whereExpr = [
        hasIsSaved ? '(is_saved = false or is_saved is null)' : null,
        hasDescription ? '(description is null)' : null
      ].filter(Boolean).join(' AND ');
      const sres = await db.query(`select id from scraping_sessions where ${whereExpr}`);
      sessionIds = sres.rows.map(r => r.id);
    } else {
      // Fallback: schema doesn't support saved batches; do NOT delete anything
      sessionIds = [];
    }

    if (sessionIds.length === 0) {
      return res.json({ success: true, cleared_sessions: 0, message: 'No unsaved sessions to clear' });
    }

    // Delete documents and inferences for these sessions
    const delInf = await db.query(`delete from gpt_inferences where scraped_document_id in (select id from scraped_documents where session_id = any($1::uuid[])) returning id`, [sessionIds]);
    const delDocs = await db.query(`delete from scraped_documents where session_id = any($1::uuid[]) returning id`, [sessionIds]);
    const delSess = await db.query(`delete from scraping_sessions where id = any($1::uuid[]) returning id`, [sessionIds]);

    res.json({ success: true, cleared_sessions: delSess.rows.length, cleared_documents: delDocs.rows.length, cleared_inferences: delInf.rows.length });
  } catch (error) {
    console.error('Failed to clear unsaved scraped data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete ALL KB entries created by scraping (both unreleased and released)
 */
router.post('/clear-kb-entries-scraped', async (_req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM kb_entries
      WHERE (provenance->>'source') = 'lawphil_scraping'
      RETURNING entry_id
    `);

    console.log(`🗑️ Deleted ${result.rows.length} KB entries created by scraping`);
    res.json({ success: true, deleted_count: result.rows.length, deleted_entries: result.rows.map(r => r.entry_id) });
  } catch (error) {
    console.error('Failed to clear scraped KB entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete ALL KB entries (regardless of source)
 */
router.post('/clear-kb-entries-all', async (_req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM kb_entries
      RETURNING entry_id
    `);
    console.log(`🗑️ Deleted ALL KB entries: ${result.rows.length}`);
    res.json({ success: true, deleted_count: result.rows.length });
  } catch (error) {
    console.error('Failed to clear all KB entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/** Hard clear KB: TRUNCATE for stubborn cases */
router.post('/clear-kb-entries-hard', async (_req, res) => {
  try {
    await db.query('TRUNCATE TABLE kb_entries RESTART IDENTITY');
    console.log('🗑️ Hard-cleared kb_entries via TRUNCATE');
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to hard clear kb_entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Clear all scraped draft entries (unpublished) and optionally sessions/documents
 */
router.post('/clear-draft-entries', async (_req, res) => {
  try {
    // Delete only entries created by scraping and not yet published
    const result = await db.query(`
      DELETE FROM kb_entries
      WHERE published_at IS NULL
        AND (provenance->>'source') = 'lawphil_scraping'
      RETURNING entry_id
    `);

    // Optionally also clear session/documents tables to avoid clutter (best-effort)
    try {
      await db.query(`DELETE FROM scraped_documents WHERE parse_status IS NOT NULL`);
      await db.query(`DELETE FROM scraping_sessions WHERE id NOT IN (SELECT DISTINCT batch_release_id FROM kb_entries)`);
    } catch (e) {
      console.warn('Non-fatal: failed to prune scraper tables', e?.message || e);
    }

    res.json({ success: true, deleted_count: result.rows.length });
  } catch (error) {
    console.error('Failed to clear draft entries:', error);
    res.status(500).json({ error: 'Failed to clear draft entries', details: error.message });
  }
});

/**
 * Process a URL (fetch and parse)
 */
router.post('/process', async (req, res) => {
  try {
    const { sessionId, url, parserType = 'constitution_1987' } = req.body;
    
    if (!sessionId || !url) {
      return res.status(400).json({ error: 'Session ID and URL are required' });
    }
    
    console.log(`🔍 Processing URL: ${url}`);
    
    // Process the URL
    const documentId = await orchestrator.processUrl(sessionId, url, parserType);
    
    res.json({ 
      success: true, 
      documentId,
      message: 'URL processed successfully'
    });
    
  } catch (error) {
    console.error('Failed to process URL:', error);
    const msg = error?.message || 'Failed to process URL';
    // Distinguish parse/fetch failures as 422 so UI can reflect properly
    const status = msg.includes('No content parsed') || msg.includes('incomplete') ? 422 : 500;
    res.status(status).json({ 
      error: msg,
      details: msg 
    });
  }
});

/**
 * Process Acts from a year page URL
 */
router.post('/process-acts', async (req, res) => {
  try {
    const { sessionId, yearPageUrl } = req.body;
    
    if (!sessionId || !yearPageUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, yearPageUrl' 
      });
    }
    
    // Validate URL format
    if (!/\/act\d{4}\/act\d{4}\.html$/.test(yearPageUrl)) {
      return res.status(400).json({ 
        error: 'Invalid year page URL format. Expected: /actYYYY/actYYYY.html' 
      });
    }
    
    console.log(`🔄 Processing Acts year page: ${yearPageUrl}`);
    
    const result = await orchestrator.processActsYear(sessionId, yearPageUrl);
    
    res.json({
      success: true,
      message: 'Acts year page processed successfully',
      result: {
        totalActs: result.length,
        acts: result
      }
    });
    
  } catch (error) {
    console.error('Process Acts error:', error);
    res.status(500).json({ 
      error: 'Failed to process Acts year page',
      details: error.message 
    });
  }
});

/**
 * Get session status
 */
router.get('/session/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const status = await orchestrator.getSessionStatus(sessionId);
    
    if (!status) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ 
      success: true, 
      status 
    });
    
  } catch (error) {
    console.error('Failed to get session status:', error);
    res.status(500).json({ 
      error: 'Failed to get session status',
      details: error.message 
    });
  }
});

/**
 * Request cancel of entry generation for a session (best-effort, non-destructive)
 */
router.post('/session/:sessionId/cancel-generation', async (req, res) => {
  try {
    const { sessionId } = req.params;
    cancelGenerationBySession.set(sessionId, true);
    res.json({ success: true, message: 'Cancel requested. Current item will finish and then stop.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get session documents
 */
router.get('/session/:sessionId/documents', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const documents = await orchestrator.getSessionDocuments(sessionId);
    
    res.json({ 
      success: true, 
      documents 
    });
    
  } catch (error) {
    console.error('Failed to get session documents:', error);
    res.status(500).json({ 
      error: 'Failed to get session documents',
      details: error.message 
    });
  }
});

/**
 * Complete a session
 */
router.post('/session/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await orchestrator.completeSession(sessionId);
    
    res.json({ 
      success: true, 
      message: 'Session completed successfully'
    });
    
  } catch (error) {
    console.error('Failed to complete session:', error);
    res.status(500).json({ 
      error: 'Failed to complete session',
      details: error.message 
    });
  }
});

/**
 * Save a scraping session as a named batch
 */
router.post('/session/:sessionId/save-batch', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { description } = req.body || {};
    if (!description || String(description).trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Ensure session exists
    const sres = await db.query('select id from scraping_sessions where id = $1', [sessionId]);
    if (!sres.rows.length) return res.status(404).json({ error: 'Session not found' });

    // Check which columns exist to be migration-safe
    const colRes = await db.query(
      `select column_name from information_schema.columns where table_name = 'scraping_sessions'`
    );
    const cols = new Set(colRes.rows.map(r => r.column_name));
    const hasDescription = cols.has('description');
    const hasIsSaved = cols.has('is_saved');

    if (hasDescription) {
      const sets = [];
      const params = [sessionId, String(description).trim()];
      sets.push('description = $2');
      if (hasIsSaved) {
        sets.push('is_saved = true');
      }
      sets.push('updated_at = now()');
      await db.query(`update scraping_sessions set ${sets.join(', ')} where id = $1`, params);
    } else {
      // Fallback to notes column if description not present
      await db.query(
        `update scraping_sessions set notes = coalesce(notes,'') || $2, updated_at = now() where id = $1`,
        [sessionId, `\n[batch] ${String(description).trim()}`]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save batch', details: error.message });
  }
});

/**
 * List saved scrape batches with counts
 */
router.get('/batches', async (_req, res) => {
  try {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    // Check columns to build a compatible query
    const colRes = await db.query(
      `select column_name from information_schema.columns where table_name = 'scraping_sessions'`
    );
    const cols = new Set(colRes.rows.map(r => r.column_name));
    const hasDescription = cols.has('description');
    const hasIsSaved = cols.has('is_saved');

    const descriptionExpr = hasDescription ? 's.description' : "null";
    const notesExpr = cols.has('notes') ? 's.notes' : 'null';
    const whereExpr = hasIsSaved
      ? '(s.is_saved = true or ' + (hasDescription ? 's.description is not null' : 's.notes is not null') + ')'
      : (hasDescription ? 's.description is not null' : 's.notes is not null');

    const result = await db.query(`
      select s.id, s.category, s.root_url, ${descriptionExpr} as description, ${notesExpr} as notes, s.created_at, s.updated_at,
             coalesce(count(d.id),0) as total_documents,
             coalesce(count(nullif(d.parse_status <> 'parsed', true)), 0) as parsed_documents
        from scraping_sessions s
        left join scraped_documents d on d.session_id = s.id
       where ${whereExpr}
       group by s.id
       order by s.created_at desc
       limit 100
    `);
    // Fallback: if description is null and notes exist, map notes to description prefix
    const rows = result.rows.map(r => ({
      ...r,
      description: r.description || r.notes || null
    }));
    res.json({ success: true, batches: rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list batches', details: error.message });
  }
});

/**
 * Alias: generate entries for a saved batch (session)
 */
router.post('/batch/:sessionId/generate-entries', async (req, res) => {
  req.params.sessionId = req.params.sessionId; // passthrough
  return router.handle({ ...req, url: `/session/${req.params.sessionId}/generate-entries`, method: 'POST' }, res);
});

/**
 * Delete a saved batch. Guard: do not remove if any kb_entries provenance points to session
 */
router.delete('/batch/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists
    const sres = await db.query('select id from scraping_sessions where id = $1', [sessionId]);
    if (!sres.rows.length) return res.status(404).json({ error: 'Batch not found' });

    // Guard: do any entries reference this session?
    const eres = await db.query(
      `select count(1) as cnt from kb_entries where provenance->>'session_id' = $1`,
      [sessionId]
    );
    const count = Number(eres.rows[0]?.cnt || 0);
    if (count > 0) {
      return res.status(409).json({ error: 'Batch has generated entries; cannot delete' });
    }

    // Delete documents then session (documents cascade also handles this)
    await db.query('delete from scraped_documents where session_id = $1', [sessionId]);
    await db.query('delete from scraping_sessions where id = $1', [sessionId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete batch', details: error.message });
  }
});

/**
 * Get all scraping sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, 
             COUNT(d.id) as total_documents,
             COUNT(CASE WHEN d.parse_status = 'parsed' THEN 1 END) as parsed_documents,
             COUNT(CASE WHEN d.parse_status = 'failed' THEN 1 END) as failed_documents
      FROM scraping_sessions s
      LEFT JOIN scraped_documents d ON s.id = d.session_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `);
    
    res.json({ 
      success: true, 
      sessions: result.rows 
    });
    
  } catch (error) {
    console.error('Failed to get sessions:', error);
    res.status(500).json({ 
      error: 'Failed to get sessions',
      details: error.message 
    });
  }
});

/**
 * Generate KB entries from scraped documents in a session
 */
router.post('/session/:sessionId/generate-entries', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit } = req.body || {};
    
    console.log(`🔄 Generating KB entries for session: ${sessionId}${limit ? ` (limit: ${limit})` : ''}`);
    
    // Get session info to determine entry type/subtype
    const sessionResult = await db.query(`
      SELECT category, root_url, created_at
      FROM scraping_sessions 
      WHERE id = $1
    `, [sessionId]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];
    
    // Get all parsed documents from this session
    const documentsResult = await db.query(`
      SELECT id, extracted_text, metadata, canonical_url, source_hash
      FROM scraped_documents 
      WHERE session_id = $1 AND parse_status = 'parsed'
      ORDER BY sequence_index ASC
    `, [sessionId]);
    
    if (documentsResult.rows.length === 0) {
      return res.status(400).json({ error: 'No parsed documents found in session' });
    }
    
    let documents = documentsResult.rows;
    
    // Apply limit if specified
    if (limit && limit > 0) {
      documents = documents.slice(0, parseInt(limit));
      console.log(`📄 Found ${documentsResult.rows.length} parsed documents, processing first ${documents.length} (limit: ${limit})`);
    } else {
      console.log(`📄 Found ${documents.length} parsed documents to process`);
    }
    
    // Determine entry type and subtype based on session category
    let entryType, entrySubtype;
    switch (session.category) {
      case 'constitution_1987':
        entryType = 'constitution_provision';
        entrySubtype = 'constitution_1987';
        break;
      case 'acts':
        entryType = 'statute_section';
        entrySubtype = 'act'; // Will be refined per document
        break;
      default:
        entryType = 'constitution_provision';
        entrySubtype = 'constitution_1987';
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Function to detect statute subtype and extract subtype-specific data
    function detectStatuteSubtypeAndData(doc) {
      const url = doc.canonical_url || '';
      const text = doc.extracted_text || '';
      const title = doc.metadata?.title || '';
      
      // Check for ACT-XXXX-SECY pattern in URL
      const actMatch = url.match(/ACT-(\d+)-SEC(\d+)/i);
      if (actMatch) {
        return {
          subtype: 'act',
          subtypeData: {
            act_number: parseInt(actMatch[1]),
            section_number: actMatch[2]
          }
        };
      }
      
      // Check metadata for act number and section number
      const metadata = doc.metadata || {};
      if (metadata.actNumber && metadata.sectionNumber) {
        return {
          subtype: 'act',
          subtypeData: {
            act_number: parseInt(metadata.actNumber),
            section_number: metadata.sectionNumber
          }
        };
      }
      
      // Check URL patterns first
      if (url.includes('/acts/ra')) {
        const raMatch = url.match(/\/acts\/ra(\d+)/i);
        if (raMatch) {
          return {
            subtype: 'republic_act',
            subtypeData: {
              ra_number: parseInt(raMatch[1]),
              section_number: extractSectionNumber(text, title)
            }
          };
        }
      }
      
      if (url.includes('/acts/ca')) {
        const caMatch = url.match(/\/acts\/ca(\d+)/i);
        if (caMatch) {
          return {
            subtype: 'commonwealth_act',
            subtypeData: {
              commonwealth_act_number: parseInt(caMatch[1]),
              section_number: extractSectionNumber(text, title)
            }
          };
        }
      }
      
      if (url.includes('/acts/mbp')) {
        const mbpMatch = url.match(/\/acts\/mbp(\d+)/i);
        if (mbpMatch) {
          return {
            subtype: 'mga_batas_pambansa',
            subtypeData: {
              mbp_number: parseInt(mbpMatch[1]),
              section_number: extractSectionNumber(text, title)
            }
          };
        }
      }
      
      // Check text content for patterns
      const raMatch = text.match(/(?:Republic Act|RA)\s*No\.?\s*(\d+)/i);
      if (raMatch) {
        return {
          subtype: 'republic_act',
          subtypeData: {
            ra_number: parseInt(raMatch[1]),
            section_number: extractSectionNumber(text, title)
          }
        };
      }
      
      const caMatch = text.match(/(?:Commonwealth Act|CA)\s*No\.?\s*(\d+)/i);
      if (caMatch) {
        return {
          subtype: 'commonwealth_act',
          subtypeData: {
            commonwealth_act_number: parseInt(caMatch[1]),
            section_number: extractSectionNumber(text, title)
          }
        };
      }
      
      const mbpMatch = text.match(/(?:Mga Batas Pambansa|MBP)\s*No\.?\s*(\d+)/i);
      if (mbpMatch) {
        return {
          subtype: 'mga_batas_pambansa',
          subtypeData: {
            mbp_number: parseInt(mbpMatch[1]),
            section_number: extractSectionNumber(text, title)
          }
        };
      }
      
      const textActMatch = text.match(/(?:Act)\s*No\.?\s*(\d+)/i);
      if (textActMatch) {
        return {
          subtype: 'act',
          subtypeData: {
            act_number: parseInt(textActMatch[1]),
            section_number: extractSectionNumber(text, title)
          }
        };
      }
      
      // Default fallback
      return {
        subtype: 'act',
        subtypeData: {
          act_number: null,
          section_number: extractSectionNumber(text, title)
        }
      };
    }
    
    // Function to extract section number from text
    function extractSectionNumber(text, title) {
      // Look for "Section X" or "Sec. X" patterns
      const sectionMatch = text.match(/(?:Section|Sec\.?)\s*(\d+[a-z]?)/i);
      if (sectionMatch) {
        return sectionMatch[1];
      }
      
      // Look in title
      const titleSectionMatch = title.match(/(?:Section|Sec\.?)\s*(\d+[a-z]?)/i);
      if (titleSectionMatch) {
        return titleSectionMatch[1];
      }
      
      return null;
    }
    
    // Process each document and create KB entry
    for (let docIndex = 0; docIndex < documents.length; docIndex++) {
      const doc = documents[docIndex];
      
      // Cooperative cancel: stop after finishing current doc
      if (cancelGenerationBySession.get(sessionId)) {
        console.log(`⏹️  Cancel requested for session ${sessionId}. Stopping generation.`);
        break;
      }
      
      // Pause every 20 entries to remind about enrichment guidelines
      if (docIndex > 0 && docIndex % 20 === 0 && createdCount > 0) {
        console.log('\n' + '═'.repeat(80));
        console.log('⚠️  PAUSE: Every 20 entries generated - Please review enrichment guidelines');
        console.log('═'.repeat(80));
        console.log('📋 WHAT TO FOLLOW WHEN ENRICHING:');
        console.log('   1. TITLE FORMAT:');
        console.log('      - Constitution: Article ROMAN (I, II, III), Section Arabic (1, 2, 3)');
        console.log('      - Statutes: "[Act Type] [Number], Section [Y] - [Description]"');
        console.log('      - Ordinances: "Ordinance [Number], Section [Y] - [Description]"');
        console.log('      - Rules of Court: "Rule [X], Section [Y] - [Description]"');
        console.log('   2. NO DUPLICATES in multi-item fields (tags, jurisprudence, related_laws, etc.)');
        console.log('   3. ALL FIELDS MUST HAVE AT LEAST ONE ITEM (minimum):');
        console.log('      - ALL arrays: tags, rights_callouts, advice_points, jurisprudence, related_laws');
        console.log('      - If applicable: Provide 1–3 for related_laws (non-self)');
        console.log('      - NO maximum limit - provide ALL applicable items (can go beyond 3)');
        console.log('      - If not applicable: Provide 1 general/connected item (never return empty [])');
        console.log('      - Statutes: elements, penalties, defenses MUST have at least one, provide as many as applicable');
        console.log('   4. ENTRY TYPE-SPECIFIC:');
        console.log('      - Statutes: ALWAYS provide elements, penalties, defenses (at least one each)');
        console.log('      - Constitution: Provide rights_callouts, advice_points, jurisprudence (at least one each)');
        console.log('      - Rules of Court: Provide triggers, time_limits, required_forms');
        console.log('   5. Jurisprudence: Must have at least one citation (citations only, no URLs)');
        console.log('   6. Relations: Must have at least one item, format: "Citation\\nURL"');
        console.log('   7. Tags: Must have at least one tag (no maximum)');
        console.log('   8. Use null (not "NA") for non-applicable string fields');
        console.log('═'.repeat(80));
        console.log(`✅ Continuing generation... (${createdCount} entries created so far, ${docIndex + 1}/${documents.length} documents processed)\n`);
        // Small delay to allow reading the reminder
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      try {
        const metadata = doc.metadata || {};
        let rawText = doc.extracted_text || '';
        
        // Sanitize the scraped text before using it
        const sanitizeFullText = (text) => {
          if (!text || typeof text !== 'string') return '';
          
          let sanitized = text;
          
          // Remove HTML tags if any (in case HTML wasn't fully stripped)
          sanitized = sanitized.replace(/<[^>]+>/g, '');
          
          // Remove common scraping artifacts and navigation elements
          sanitized = sanitized.replace(/(?:back to top|return to top|^top$)/gi, '');
          sanitized = sanitized.replace(/\[back to top\]/gi, '');
          sanitized = sanitized.replace(/^\s*[↑▲]\s*/gm, ''); // Remove arrow indicators
          
          // Remove excessive whitespace but preserve paragraph structure
          sanitized = sanitized.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
          sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n'); // More than 3 consecutive newlines to 3
          
          // Remove leading/trailing whitespace from each line
          sanitized = sanitized.split('\n').map(line => line.trim()).join('\n');
          
          // Remove lines that are just punctuation, numbers, or very short non-meaningful text
          sanitized = sanitized.split('\n').filter(line => {
            const trimmed = line.trim();
            // Keep lines that are:
            // - Not just numbers (like "1" or "2.")
            // - Not just punctuation or symbols
            // - Longer than 2 characters (unless it's meaningful like "A.", "B.", etc.)
            if (trimmed.length === 0) return true; // Keep blank lines for paragraph spacing
            if (/^[\d\.\s\-]+$/.test(trimmed) && trimmed.length <= 5) return false; // Remove standalone numbers like "1.", "2)", etc.
            if (/^[^\w\s]+$/.test(trimmed)) return false; // Remove lines that are only symbols/punctuation
            if (trimmed.length < 3 && !/^[A-Z]\.$/.test(trimmed)) return false; // Remove very short lines unless it's like "A."
            return true;
          }).join('\n');
          
          // Clean up excessive blank lines again after filtering
          sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
          
          // Remove common LawPhil footer/header patterns if present
          sanitized = sanitized.replace(/^The Lawphil Project.*$/gmi, '');
          sanitized = sanitized.replace(/^Chan Robles.*$/gmi, '');
          sanitized = sanitized.replace(/©.*?\d{4}.*?Lawphil.*$/gmi, '');
          
          // Remove cross-references and citations from other entries
          // Remove lines that look like citations from other entries (but preserve section headers at start)
          const lines = sanitized.split('\n');
          const cleanedLines = lines.map((line, idx) => {
            const trimmed = line.trim();
            // Keep section headers at the start
            if (idx === 0 && /^(Section|Article)\s+\d+/i.test(trimmed)) {
              return line;
            }
            // Remove citations from other entries (e.g., "Article X Section Y" appearing mid-text)
            if (/^(Article\s+\d+|Act\s+No\.\s+\d+).*Section\s+\d+/i.test(trimmed) && 
                !trimmed.startsWith('Section') && 
                !trimmed.startsWith('Article')) {
              return ''; // Remove this line
            }
            // Remove "The Project -" artifacts
            if (/^The Project\s*-?\s*$/i.test(trimmed)) {
              return '';
            }
            // Remove lines that are just URLs or citations
            if (/^(https?:\/\/|civilify\.local|www\.)/i.test(trimmed)) {
              return '';
            }
            return line;
          }).filter(line => line.trim() !== '');
          
          sanitized = cleanedLines.join('\n');
          
          // Final trim
          sanitized = sanitized.trim();
          
          return sanitized;
        };
        
        const text = sanitizeFullText(rawText);
        
        if (!text || text.length < 10) {
          console.log(`⏭️ Skipping document ${doc.id}: insufficient content after sanitization`);
          skippedCount++;
          continue;
        }
        
        // Detect statute subtype and extract subtype-specific data
        let finalEntrySubtype = entrySubtype;
        let subtypeFields = {};
        
        if (entryType === 'statute_section') {
          const subtypeDetection = detectStatuteSubtypeAndData(doc);
          finalEntrySubtype = subtypeDetection.subtype;
          subtypeFields = subtypeDetection.subtypeData;
          console.log(`📋 Detected statute subtype: ${finalEntrySubtype}`, subtypeFields);
        }
        
        // Generate stable entry ID
        const entryId = generateEntryId(metadata, session.category);
        // Determine GPT availability early (used for duplicate handling and full enrichment)
        const gptAvailable = isGPTAvailable();
        
        // Check if entry already exists BEFORE enrichment to save credits
        const existingCheck = await db.query('SELECT entry_id FROM kb_entries WHERE entry_id = $1', [entryId]);
        
        if (existingCheck.rows.length > 0) {
          console.log(`⏭️  Skipping duplicate entry: ${entryId} (already exists)`);
          skippedCount++;
          continue; // Move to next document
        }
        
        // Create canonical citation
        const canonicalCitation = generateCanonicalCitation(metadata, session.category);
        
        // Build rich content for embedding generation
        const entryData = {
          entry_id: entryId,
          type: entryType,
          title: metadata.title || canonicalCitation,
          canonical_citation: canonicalCitation,
          text: text,
          entry_subtype: finalEntrySubtype
        };
        
        // gptAvailable already determined earlier

        // Determine law_family based on URL pattern for constitution entries
        let lawFamily = 'constitution';
        if (session.category === 'constitution_1987') {
          if (doc.canonical_url.includes('/cons1987.html')) {
            lawFamily = '1987 Constitution';
          } else if (doc.canonical_url.includes('/cons1935.html')) {
            lawFamily = '1935 Constitution';
          } else if (doc.canonical_url.includes('/consmalo.html')) {
            lawFamily = 'Malolos Constitution';
          } else if (doc.canonical_url.includes('/cons1973.html')) {
            lawFamily = '1973 Constitution';
          } else if (doc.canonical_url.includes('/cons1986.html')) {
            lawFamily = '1986 Constitution';
          }
        }

        // Enrich with GPT if available
        let enrichedData = {};
        if (gptAvailable) {
          try {
            console.log(`🤖 Enriching entry with GPT: ${entryId}`);
            enrichedData = await enrichEntryWithGPT(entryData, { entryIndex: docIndex });
            // Override law_family with URL-based determination
          enrichedData.law_family = lawFamily;
          
          // Auto-assign historical_context based on metadata (no GPT credits needed)
          enrichedData.historical_context = generateHistoricalContext(metadata, finalEntrySubtype, canonicalCitation);
          
          // Add prescriptive_period and standard_of_proof to subtypeFields for statute sections
          if (entryType === 'statute_section') {
            if (enrichedData.prescriptive_period) {
              subtypeFields.prescriptive_period = enrichedData.prescriptive_period;
            }
            if (enrichedData.standard_of_proof) {
              subtypeFields.standard_of_proof = enrichedData.standard_of_proof;
            }
          }
            
            // Ensure required fields are set for constitution entries
            if (session.category === 'constitution_1987') {
              enrichedData.jurisdiction = enrichedData.jurisdiction || 'Philippines';
              enrichedData.effective_date = enrichedData.effective_date || '1987-02-02';
            }
            console.log(`✅ GPT enrichment successful for: ${entryId}`);
          } catch (gptError) {
            console.error(`❌ GPT enrichment failed for ${entryId}:`, gptError.message);
            throw new Error(`GPT enrichment failed: ${gptError.message}`);
          }
        } else {
          // Fallback data when GPT is not available
          // Optional heuristic fill for constitution to avoid empty UI when GPT is down
          const enableHeuristic = String(process.env.FEATURE_CONSTITUTION_HEURISTIC_FALLBACK || '').toLowerCase() === 'true';
          if (session.category === 'constitution_1987' && enableHeuristic) {
            const basicTags = [];
            const words = String(canonicalCitation || '').split(/\W+/).filter(Boolean);
            for (const w of words) {
              const t = w.trim();
              if (t.length >= 3 && basicTags.length < 8) basicTags.push(t);
            }
            enrichedData = {
              title: metadata.title || canonicalCitation,
              topics: [],
              tags: basicTags,
              jurisdiction: 'Philippines',
              law_family: lawFamily,
              applicability: null,
              penalties: null,
              defenses: null,
              time_limits: null,
              required_forms: null,
              related_sections: [],
              rights_callouts: [],
              advice_points: [],
              jurisprudence: [],
              legal_bases: []
            };
          } else {
            // Auto-assign historical_context even when GPT is not available
            const historicalContext = generateHistoricalContext(metadata, finalEntrySubtype, canonicalCitation);
            
            enrichedData = {
              topics: metadata.topics || [],
              tags: metadata.tags || [],
              jurisdiction: 'Philippines',
              historical_context: historicalContext,
              law_family: lawFamily,
              applicability: null,
              penalties: null,
              defenses: null,
              time_limits: null,
              required_forms: null,
              related_sections: []
            };
          }
        }

        // Helper: Convert number to Roman numeral
        const toRomanNumeral = (n) => {
          if (!n || n <= 0) return '';
          const map = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'],
            [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'],
            [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
          ];
          let result = '', num = Math.floor(n);
          for (const [value, numeral] of map) {
            while (num >= value) {
              result += numeral;
              num -= value;
            }
          }
          return result;
        };

        // Normalize title format for constitution entries: "Article X Section Y - [Description]"
        // Article numbers use Roman numerals, Section numbers use Arabic numerals
        const normalizeConstitutionTitle = (title, metadata) => {
          if (session.category !== 'constitution_1987') return title;
          if (!title || typeof title !== 'string') return title;
          
          const { articleNumber, sectionNumber } = metadata || {};
          if (!articleNumber) return title; // Skip if no article number
          
          // Extract article and section numbers
          const artNum = parseInt(articleNumber, 10);
          const secNum = sectionNumber ? parseInt(sectionNumber, 10) : null;
          
          // Convert article to Roman numeral
          const artRoman = toRomanNumeral(artNum);
          
          // Extract description from title (remove any existing "Article X Section Y" prefix)
          let description = title
            .replace(/^(?:1987\s+Constitution,\s*)?Article\s+[IVXLCDM\d]+(?:\s+Section\s+\d+)?[:\s-]+/i, '')
            .replace(/^Article\s+[IVXLCDM\d]+(?:\s+Section\s+\d+)?[:\s-]+/i, '')
            .trim();
          
          // If no description extracted, use the original title (might be format already)
          if (!description || description === title) {
            description = title.replace(/^(?:1987\s+Constitution,\s*)?Article\s+[IVXLCDM\d]+(?:\s+Section\s+\d+)?[:\s-]*/i, '').trim() || title;
          }
          
          // Build normalized title: Article in Roman, Section in Arabic
          if (secNum) {
            return `Article ${artRoman} Section ${secNum} - ${description}`;
          } else {
            return `Article ${artRoman} - ${description}`;
          }
        };
        
        // Normalize title after GPT enrichment
        if (enrichedData.title && session.category === 'constitution_1987') {
          enrichedData.title = normalizeConstitutionTitle(enrichedData.title, metadata);
        }
        
        // Helper: Validate and sanitize date strings (convert invalid dates to null)
        const validateDate = (dateString) => {
          if (!dateString || typeof dateString !== 'string') return null;
          
          // Check for invalid patterns like "1930-XX-XX", "XXXX-XX-XX", etc.
          if (/X/i.test(dateString) || dateString.includes('Unknown') || dateString.includes('TBD')) {
            return null;
          }
          
          // Try to parse as ISO date (YYYY-MM-DD)
          const isoDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (isoDateMatch) {
            const year = parseInt(isoDateMatch[1], 10);
            const month = parseInt(isoDateMatch[2], 10);
            const day = parseInt(isoDateMatch[3], 10);
            
            // Validate date components
            if (year >= 1 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              // Try to create a Date object to validate (handles invalid dates like Feb 30)
              const testDate = new Date(year, month - 1, day);
              if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
                return dateString; // Valid ISO date
              }
            }
          }
          
          // Try to parse as Date object and convert to ISO
          try {
            const parsed = new Date(dateString);
            if (!isNaN(parsed.getTime())) {
              const iso = parsed.toISOString().split('T')[0];
              // Double-check the ISO string is valid
              if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
                return iso;
              }
            }
          } catch {}
          
          // If all else fails, return null
          return null;
        };
        
        // Coalesce critical enrichment fields before persistence
        const persistedJurisdiction = enrichedData.jurisdiction || (session.category === 'constitution_1987' ? 'Philippines' : null);
        const persistedLawFamily = enrichedData.law_family || lawFamily;
        
        // Validate effective_date - convert invalid dates to null
        const rawEffectiveDate = enrichedData.effective_date || (session.category === 'constitution_1987' ? '1987-02-02' : null);
        const persistedEffectiveDate = rawEffectiveDate ? validateDate(rawEffectiveDate) : (session.category === 'constitution_1987' ? '1987-02-02' : null);
        
        // Validate amendment_date - convert invalid dates to null
        const persistedAmendmentDate = enrichedData.amendment_date ? validateDate(enrichedData.amendment_date) : null;

        // Generate vector embedding
        let embeddingLiteral = null;
        try {
          const contentForEmbedding = buildEmbeddingText({
            ...entryData,
            topics: enrichedData.topics,
            tags: enrichedData.tags,
            jurisdiction: persistedJurisdiction,
            law_family: persistedLawFamily
          });
          const embedding = await embedText(contentForEmbedding);
          embeddingLiteral = `[${embedding.join(',')}]`;
          console.log(`🧠 Generated embedding for entry: ${entryId}`);
        } catch (err) {
          console.error(`❌ Failed to generate embedding for ${entryId}:`, err?.message || err);
          throw new Error(`Embedding generation failed: ${err.message}`);
        }
        
        // Create KB entry with comprehensive enrichment fields
        // Note: Duplicate check already done above before enrichment, so we can proceed with INSERT
        const result = await db.query(`
          INSERT INTO kb_entries (
            entry_id, type, title, text, entry_subtype, canonical_citation,
            tags, jurisdiction, law_family, applicability,
            penalties, defenses, time_limits, required_forms, elements, triggers,
            violation_code, violation_name, fine_schedule, license_action,
            apprehension_flow, incident, phases, forms, handoff, rights_callouts,
            rights_scope, advice_points, jurisprudence, related_laws,
            section_id, status, source_urls, embedding, batch_release_id, published_at, 
            provenance, created_by, effective_date, amendment_date, subtype_fields, historical_context
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7::text[], $8, $9, $10, $11, $12, $13, $14, $15, $16, 
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26::text[], $27, $28::text[], $29::text[], 
            $30::text[], $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42
          )
        `, [
          entryId, // 1
          entryType, // 2
          enrichedData.title || metadata.title || canonicalCitation, // 3
          text, // 4
          finalEntrySubtype, // 5
          canonicalCitation, // 6
          (Array.isArray(enrichedData.tags) ? enrichedData.tags : []), // 7 TEXT[]
          persistedJurisdiction, // 8
          persistedLawFamily, // 9
          enrichedData.applicability, // 10 TEXT
          // For statute sections: penalties, defenses, elements should be arrays (JSON.stringify if needed)
          Array.isArray(enrichedData.penalties) ? JSON.stringify(enrichedData.penalties) : enrichedData.penalties, // 11 TEXT (JSON string for arrays)
          Array.isArray(enrichedData.defenses) ? JSON.stringify(enrichedData.defenses) : enrichedData.defenses, // 12 TEXT (JSON string for arrays)
          enrichedData.time_limits, // 13 TEXT
          enrichedData.required_forms, // 14 TEXT
          Array.isArray(enrichedData.elements) ? JSON.stringify(enrichedData.elements) : enrichedData.elements, // 15 TEXT (JSON string for arrays)
          enrichedData.triggers, // 16 TEXT
          enrichedData.violation_code, // 17
          enrichedData.violation_name, // 18
          enrichedData.fine_schedule, // 19 TEXT
          enrichedData.license_action, // 20
          enrichedData.apprehension_flow, // 21 TEXT
          enrichedData.incident, // 22
          enrichedData.phases, // 23 TEXT
          enrichedData.forms, // 24 TEXT
          enrichedData.handoff, // 25 TEXT
          (Array.isArray(enrichedData.rights_callouts) ? enrichedData.rights_callouts : []), // 26 TEXT[]
          enrichedData.rights_scope, // 27 TEXT
          (Array.isArray(enrichedData.advice_points) ? enrichedData.advice_points : []), // 28 TEXT[]
          (Array.isArray(enrichedData.jurisprudence) ? enrichedData.jurisprudence : []), // 29 TEXT[]
          (Array.isArray(enrichedData.related_laws) ? enrichedData.related_laws : []), // 30 TEXT[]
          generateSectionId(entryId), // 31
          'unreleased', // 32
          JSON.stringify([String(doc.canonical_url || '').split('#')[0]]), // 33 strip any fragment; keep pure scraping URL
          embeddingLiteral, // 34
          null, // 35 - No batch assigned yet
          null, // 36 - Not published yet
              JSON.stringify({
                source: 'lawphil_scraping',
                scraper_id: 'constitution_1987_parser',
                extraction_method: 'html_parsing',
            gpt_model: gptAvailable ? (process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo') : null,
            gpt_version: gptAvailable ? '2024-10-08' : null,
                validation_method: 'schema_validation',
                timestamp: new Date().toISOString(),
                // Session tracking
                session_id: sessionId,
                document_id: doc.id,
                content_hash: doc.source_hash,
                canonical_url: doc.canonical_url,
                scraped_at: new Date().toISOString(),
                metadata: metadata,
                // GPT enrichment info
                gpt_enriched: gptAvailable,
                enriched_at: gptAvailable ? new Date().toISOString() : null
          }), // 37
          1, // 38 - Default user ID
          persistedEffectiveDate, // 39
          persistedAmendmentDate, // 40
          JSON.stringify(subtypeFields), // 41 - subtype_fields
          enrichedData.historical_context || null // 42 - historical_context
        ]);
        
        // Entry was successfully inserted (duplicate check passed above)
        console.log(`📝 Created KB entry: ${entryId}`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Failed to create entry for document ${doc.id}:`, error);
        errors.push({
          document_id: doc.id,
          error: error.message
        });
      }
    }
    
    // Clear cancel flag if it was set
    if (cancelGenerationBySession.get(sessionId)) {
      cancelGenerationBySession.delete(sessionId);
      console.log(`🛑 Entry generation stopped early for session ${sessionId}: ${createdCount} created, ${skippedCount} skipped, ${errors.length} errors`);
    } else {
      console.log(`✅ Entry generation completed: ${createdCount} created, ${skippedCount} skipped, ${errors.length} errors`);
    }
    
    res.json({
      success: true,
      session_id: sessionId,
      total_documents: documents.length,
      created_count: createdCount,
      skipped_count: skippedCount,
      error_count: errors.length,
      errors: errors,
      message: `Generated ${createdCount} KB entries from ${documents.length} documents${cancelGenerationBySession.get(sessionId) ? ' (stopped early)' : ''}`
    });
    
  } catch (error) {
    console.error('Failed to generate entries:', error);
    res.status(500).json({ 
      error: 'Failed to generate entries',
      details: error.message 
    });
  }
});

/**
 * Get draft entries (unpublished)
 */
router.get('/draft-entries', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT entry_id, title, type, entry_subtype, created_at, provenance
      FROM kb_entries 
      WHERE published_at IS NULL
      ORDER BY created_at DESC
    `);
    
    res.json({ 
      success: true, 
      entries: result.rows 
    });
    
  } catch (error) {
    console.error('Failed to get draft entries:', error);
    res.status(500).json({ 
      error: 'Failed to get draft entries',
      details: error.message 
    });
  }
});

/**
 * Release draft entries (publish them)
 */
router.post('/release-entries', async (req, res) => {
  try {
    const { entryIds } = req.body;
    
    if (!entryIds || !Array.isArray(entryIds)) {
      return res.status(400).json({ error: 'Entry IDs array is required' });
    }
    
    // Create a new batch release record
    const batchResult = await db.query(`
      INSERT INTO batch_releases (category, status, published_by, notes)
      VALUES ('manual_release', 'published', 'system', 'Manual release of selected entries')
      RETURNING id
    `);
    
    const batchReleaseId = batchResult.rows[0].id;
    
    // Update entries to published status with batch_release_id
    const result = await db.query(`
      UPDATE kb_entries 
      SET published_at = NOW(), status = 'released', batch_release_id = $1, updated_at = NOW()
      WHERE entry_id = ANY($2) AND published_at IS NULL
      RETURNING entry_id, title
    `, [batchReleaseId, entryIds]);
    
    console.log(`✅ Released ${result.rows.length} entries with batch ID: ${batchReleaseId}`);
    
    res.json({ 
      success: true, 
      released_count: result.rows.length,
      batch_release_id: batchReleaseId,
      released_entries: result.rows
    });
    
  } catch (error) {
    console.error('Failed to release entries:', error);
    res.status(500).json({ 
      error: 'Failed to release entries',
      details: error.message 
    });
  }
});

/**
 * Release all draft entries
 */
router.post('/release-all-entries', async (req, res) => {
  try {
    // Create a new batch release record
    const batchResult = await db.query(`
      INSERT INTO batch_releases (category, status, published_by, notes)
      VALUES ('bulk_release', 'published', 'system', 'Bulk release of all draft entries')
      RETURNING id
    `);
    
    const batchReleaseId = batchResult.rows[0].id;
    
    // Update all unpublished entries to published status with batch_release_id
    const result = await db.query(`
      UPDATE kb_entries 
      SET published_at = NOW(), status = 'released', batch_release_id = $1, updated_at = NOW()
      WHERE published_at IS NULL
      RETURNING entry_id, title
    `, [batchReleaseId]);
    
    console.log(`✅ Released all ${result.rows.length} draft entries with batch ID: ${batchReleaseId}`);
    
    res.json({ 
      success: true, 
      released_count: result.rows.length,
      batch_release_id: batchReleaseId,
      released_entries: result.rows
    });
    
  } catch (error) {
    console.error('Failed to release all entries:', error);
    res.status(500).json({ 
      error: 'Failed to release all entries',
      details: error.message 
    });
  }
});

export default router;

import express from 'express';
import { ScrapingOrchestrator } from '../scraper/ScrapingOrchestrator.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const db = new Pool({ connectionString: process.env.DATABASE_URL });

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
 * Get session documents
 */
router.get('/session/:sessionId/documents', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
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
    
    // Update entries to published status
    const result = await db.query(`
      UPDATE kb_entries 
      SET published_at = NOW(), updated_at = NOW()
      WHERE entry_id = ANY($1) AND published_at IS NULL
      RETURNING entry_id, title
    `, [entryIds]);
    
    console.log(`✅ Released ${result.rows.length} entries`);
    
    res.json({ 
      success: true, 
      released_count: result.rows.length,
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
    // Update all unpublished entries to published status
    const result = await db.query(`
      UPDATE kb_entries 
      SET published_at = NOW(), updated_at = NOW()
      WHERE published_at IS NULL
      RETURNING entry_id, title
    `);
    
    console.log(`✅ Released all ${result.rows.length} draft entries`);
    
    res.json({ 
      success: true, 
      released_count: result.rows.length,
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

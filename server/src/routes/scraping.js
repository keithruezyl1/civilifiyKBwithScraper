import express from 'express';
import { ScrapingOrchestrator } from '../scraper/ScrapingOrchestrator.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { embedText } from '../embeddings.js';
import buildEmbeddingText from '../embedding-builder.js';
import { enrichEntryWithGPT, isGPTAvailable } from '../gpt-service.js';

dotenv.config();

const router = express.Router();
const db = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Generate stable entry ID from metadata
 */
function generateEntryId(metadata, category) {
  const { articleNumber, sectionNumber, preamble } = metadata || {};
  
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
  
  // Fallback to hash-based ID
  const content = JSON.stringify(metadata);
  const hash = require('crypto').createHash('md5').update(content).digest('hex').substring(0, 8);
  return `ENTRY-${hash}`;
}

/**
 * Generate canonical citation from metadata
 */
function generateCanonicalCitation(metadata, category) {
  const { articleNumber, sectionNumber, preamble, title } = metadata || {};
  
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
 * Generate KB entries from scraped documents in a session
 */
router.post('/session/:sessionId/generate-entries', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`🔄 Generating KB entries for session: ${sessionId}`);
    
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
    
    const documents = documentsResult.rows;
    console.log(`📄 Found ${documents.length} parsed documents to process`);
    
    // Determine entry type and subtype based on session category
    let entryType, entrySubtype;
    switch (session.category) {
      case 'constitution_1987':
        entryType = 'constitution_provision';
        entrySubtype = 'constitution_1987';
        break;
      default:
        entryType = 'constitution_provision';
        entrySubtype = 'constitution_1987';
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Process each document and create KB entry
    for (const doc of documents) {
      try {
        const metadata = doc.metadata || {};
        const text = doc.extracted_text || '';
        
        if (!text || text.length < 10) {
          console.log(`⏭️ Skipping document ${doc.id}: insufficient content`);
          skippedCount++;
          continue;
        }
        
        // Generate stable entry ID
        const entryId = generateEntryId(metadata, session.category);
        
        // Check if entry already exists
        const existingResult = await db.query(`
          SELECT 1 FROM kb_entries WHERE entry_id = $1
        `, [entryId]);
        
        if (existingResult.rows.length > 0) {
          console.log(`↷ Skipping duplicate entry: ${entryId}`);
          skippedCount++;
          continue;
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
          entry_subtype: entrySubtype
        };
        
        // Check if GPT is available
        const gptAvailable = isGPTAvailable();
        if (!gptAvailable) {
          console.log('⚠️ GPT service not available - entries will be created without enrichment');
        }

        // Enrich with GPT if available
        let enrichedData = {};
        if (gptAvailable) {
          try {
            console.log(`🤖 Enriching entry with GPT: ${entryId}`);
            enrichedData = await enrichEntryWithGPT(entryData);
            console.log(`✅ GPT enrichment successful for: ${entryId}`);
          } catch (gptError) {
            console.error(`❌ GPT enrichment failed for ${entryId}:`, gptError.message);
            throw new Error(`GPT enrichment failed: ${gptError.message}`);
          }
        } else {
          // Fallback data when GPT is not available
          enrichedData = {
            summary: null,
            topics: metadata.topics || [],
            tags: metadata.tags || [],
            jurisdiction: 'Philippines',
            law_family: 'constitution',
            key_concepts: [],
            applicability: null,
            penalties: null,
            defenses: null,
            time_limits: null,
            required_forms: null,
            related_sections: []
          };
        }

        // Generate vector embedding
        let embeddingLiteral = null;
        try {
          const contentForEmbedding = buildEmbeddingText({
            ...entryData,
            summary: enrichedData.summary,
            topics: enrichedData.topics,
            tags: enrichedData.tags,
            jurisdiction: enrichedData.jurisdiction,
            law_family: enrichedData.law_family
          });
          const embedding = await embedText(contentForEmbedding);
          embeddingLiteral = `[${embedding.join(',')}]`;
          console.log(`🧠 Generated embedding for entry: ${entryId}`);
        } catch (err) {
          console.error(`❌ Failed to generate embedding for ${entryId}:`, err?.message || err);
          throw new Error(`Embedding generation failed: ${err.message}`);
        }
        
        // Create KB entry with comprehensive enrichment fields
        await db.query(`
          INSERT INTO kb_entries (
            entry_id, type, title, text, entry_subtype, canonical_citation,
            summary, tags, jurisdiction, law_family, key_concepts, applicability,
            penalties, defenses, time_limits, required_forms, elements, triggers,
            violation_code, violation_name, fine_schedule, license_action,
            apprehension_flow, incident, phases, forms, handoff, rights_callouts,
            rights_scope, advice_points, jurisprudence, legal_bases, related_sections,
            section_id, status, source_urls, embedding, batch_release_id, published_at, 
            provenance, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, NOW(), NOW()
          )
        `, [
          entryId, // 1
          entryType, // 2
          metadata.title || canonicalCitation, // 3
          text, // 4
          entrySubtype, // 5
          canonicalCitation, // 6
          enrichedData.summary, // 7
          enrichedData.tags, // 8
          enrichedData.jurisdiction, // 9
          enrichedData.law_family, // 10
          enrichedData.key_concepts, // 11
          enrichedData.applicability, // 12
          enrichedData.penalties, // 13
          enrichedData.defenses, // 14
          enrichedData.time_limits, // 15
          enrichedData.required_forms, // 16
          enrichedData.elements, // 17
          enrichedData.triggers, // 18
          enrichedData.violation_code, // 19
          enrichedData.violation_name, // 20
          enrichedData.fine_schedule, // 21
          enrichedData.license_action, // 22
          enrichedData.apprehension_flow, // 23
          enrichedData.incident, // 24
          enrichedData.phases, // 25
          enrichedData.forms, // 26
          enrichedData.handoff, // 27
          enrichedData.rights_callouts, // 28
          enrichedData.rights_scope, // 29
          enrichedData.advice_points, // 30
          enrichedData.jurisprudence, // 31
          enrichedData.legal_bases, // 32
          enrichedData.related_sections, // 33
          generateSectionId(entryId), // 34
          'unreleased', // 35
          JSON.stringify([doc.canonical_url]), // 36
          embeddingLiteral, // 37
          null, // 38 - No batch assigned yet
          null, // 39 - Not published yet
              JSON.stringify({
                source: 'lawphil_scraping',
                scraper_id: 'constitution_1987_parser',
                extraction_method: 'html_parsing',
                gpt_model: gptAvailable ? (process.env.OPENAI_CHAT_MODEL || 'gpt-4o') : null,
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
              }), // 40
          1 // 41 - Default user ID
        ]);
        
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
    
    console.log(`✅ Entry generation completed: ${createdCount} created, ${skippedCount} skipped, ${errors.length} errors`);
    
    res.json({
      success: true,
      session_id: sessionId,
      total_documents: documents.length,
      created_count: createdCount,
      skipped_count: skippedCount,
      error_count: errors.length,
      errors: errors,
      message: `Generated ${createdCount} KB entries from ${documents.length} documents`
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
    
    // Update entries to published status
    const result = await db.query(`
      UPDATE kb_entries 
      SET published_at = NOW(), status = 'released', updated_at = NOW()
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
      SET published_at = NOW(), status = 'released', updated_at = NOW()
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

import { DocumentScraper } from './DocumentScraper.js';
import { Constitution1987Parser } from '../parsers/Constitution1987Parser.js';
import { Pool } from 'pg';

/**
 * ScrapingOrchestrator
 * Manages the complete scraping workflow
 */
export class ScrapingOrchestrator {
  constructor(dbConnectionString, options = {}) {
    this.db = new Pool({ connectionString: dbConnectionString });
    this.scraper = new DocumentScraper(options.scraper);
    this.parsers = {
      constitution_1987: new Constitution1987Parser()
    };
  }

  normalizePerEntry(parsed) {
    const md = parsed?.metadata || {};
    const articleNumber = md.articleNumber != null ? parseInt(md.articleNumber, 10) : null;
    const sectionNumber = md.sectionNumber;
    let body = (parsed?.extracted_text || '').trim();
    if (!body) return null;

    const toRoman = (n) => {
      if (!n) return '';
      const map = [
        [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']
      ];
      let res = '', x = Math.floor(n);
      for (const [v,s] of map) { while (x >= v) { res += s; x -= v; } }
      return res;
    };

    // Helper: extract article title from metadata.title like "<ARTICLE TITLE> - Section X"
    const articleTitleFromMeta = () => {
      if (typeof md.title === 'string' && md.title) {
        const m = md.title.match(/^(.+?)\s*-\s*Section\s+\d+/i);
        if (m && m[1]) return m[1].trim();
        return md.title.trim();
      }
      return '';
    };

    // Preamble
    if (md.preamble) {
      const title = `1987 Constitution, PREAMBLE`;
      return { title, body, headerPlusBody: `${title}\n${body}` };
    }

    // Ordinance (no article/section; topics or title contain 'ordinance')
    const topics = Array.isArray(md.topics) ? md.topics.map(t => String(t).toLowerCase()) : [];
    const isOrdinance = topics.includes('ordinance') || /\bordinance\b/i.test(md.title || '');
    if (isOrdinance) {
      const title = `1987 Constitution, ORDINANCE`;
      return { title, body, headerPlusBody: `${title}\n${body}` };
    }

    // Article-only (no sections)
    if (articleNumber && (sectionNumber == null || sectionNumber === 0 || sectionNumber === '0')) {
      const roman = toRoman(articleNumber);
      const artTitle = articleTitleFromMeta();
      const title = artTitle ? `1987 Constitution, Article ${roman}, ${artTitle}` : `1987 Constitution, Article ${roman}`;
      return { title, body, headerPlusBody: `${title}\n${body}` };
    }

    // Regular section entry
    if (!articleNumber || !sectionNumber) return null; // require both for section entries

    // remove duplicated leading "Section <n>." if present; rely on the header & title
    try {
      const leading = new RegExp(`^\n?\s*Section\s+${sectionNumber}[A-Za-z]?\.?\s*`, 'i');
      body = body.replace(leading, '');
    } catch {}

    const roman = toRoman(articleNumber);
    const artTitle = articleTitleFromMeta();
    const title = artTitle
      ? `1987 Constitution, Article ${roman}, ${artTitle}, Section ${sectionNumber}`
      : `1987 Constitution, Article ${roman}, Section ${sectionNumber}`;

    const headerPlusBody = `${title}\n${body}`;
    return { title, body, headerPlusBody };
  }

  // Fallback text-based parser for pages whose DOM structure hides siblings
  parseByText(canonicalUrl, html) {
    const results = [];
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ');
    const raw = text.replace(/\r/g, '\n').replace(/\t/g, ' ').replace(/\u00a0/g, ' ');
    const normalized = raw.replace(/\n+/g, '\n').replace(/ +/g, ' ').trim();

    const articleRe = /(ARTICLE\s+([IVXLCDM]+))(.*?)(?=ARTICLE\s+[IVXLCDM]+|$)/gis;
    let am;
    let seq = 0;
    while ((am = articleRe.exec(normalized)) !== null) {
      const roman = am[2];
      const articleText = am[0];
      // convert roman to number
      const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
      let n = 0, prev = 0; roman.split('').reverse().forEach(ch=>{const v=map[ch]; if(v<prev) n-=v; else {n+=v; prev=v;}});
      const articleNumber = n || null;
      if (!articleNumber) continue;

      const sectionRe = /Section\s+(\d+[A-Za-z]?)\.\s*/gi;
      let lastIndex = 0; let m; let currentNum = null;
      const content = articleText;
      while ((m = sectionRe.exec(content)) !== null) {
        if (currentNum !== null) {
          const segment = content.substring(lastIndex, m.index).trim();
          if (segment) {
            results.push({
              extracted_text: segment,
              metadata: { title: `Article ${articleNumber} - Section ${currentNum}`, articleNumber, sectionNumber: currentNum, preamble: false, topics: [] },
              sequence_index: seq++,
              canonical_url: `${canonicalUrl}#article-${articleNumber}-section-${currentNum}`
            });
          }
        }
        currentNum = m[1];
        lastIndex = m.index + m[0].length;
      }
      if (currentNum !== null) {
        const tail = content.substring(lastIndex).trim();
        if (tail) {
          results.push({
            extracted_text: tail,
            metadata: { title: `Article ${articleNumber} - Section ${currentNum}`, articleNumber, sectionNumber: currentNum, preamble: false, topics: [] },
            sequence_index: seq++,
            canonical_url: `${canonicalUrl}#article-${articleNumber}-section-${currentNum}`
          });
        }
      }
    }
    return results;
  }

  /**
   * Start a scraping session
   */
  async startSession(category, rootUrl, operator = 'system') {
    try {
      console.log(`🚀 Starting scraping session: ${category}`);
      
      // Create session record
      const sessionResult = await this.db.query(`
        INSERT INTO scraping_sessions (category, root_url, operator, status, started_at)
        VALUES ($1, $2, $3, 'running', NOW())
        RETURNING id
      `, [category, rootUrl, operator]);
      
      const sessionId = sessionResult.rows[0].id;
      console.log(`📋 Session created: ${sessionId}`);
      
      return sessionId;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Process a single URL
   */
  async processUrl(sessionId, url, parserType = 'constitution_1987') {
    try {
      console.log(`🔍 Processing: ${url}`);
      
      // Check if already processed
      const canonicalUrl = this.scraper.getCanonicalUrl(url);
      const existing = await this.db.query(`
        SELECT id, source_hash FROM scraped_documents 
        WHERE canonical_url = $1
      `, [canonicalUrl]);
      
      // Check if content changed
      if (existing.rows.length > 0) {
        const existingHash = existing.rows[0].source_hash;
        // Previously: early return when unchanged. Now always continue parsing for fresh sessions.
      }
      
      // Fetch document
      const fetchResult = await this.scraper.fetchWithRetry(url);
      const { html, contentHash } = fetchResult;
      
      // Extract metadata
      const metadata = this.scraper.extractMetadata(html, url);
      
      // Guard: basic sanity checks on HTML
      const htmlLower = html.slice(0, 2000).toLowerCase();
      if (html.length < 5000 || htmlLower.includes('<frameset') || htmlLower.includes('meta http-equiv="refresh"')) {
        console.warn('Fetched HTML looks incomplete or blocked. Length:', html.length);
        await this.db.query(
          `INSERT INTO scraped_documents (session_id, canonical_url, source_hash, parse_status)
           VALUES ($1, $2, $3, 'failed_incomplete_html')
           ON CONFLICT (canonical_url, source_hash) DO UPDATE SET parse_status = 'failed_incomplete_html'`,
          [sessionId, canonicalUrl, contentHash]
        );
        throw new Error('Fetched HTML incomplete or blocked; aborting parse');
      }

      // Store raw document
      const docResult = await this.db.query(`
        INSERT INTO scraped_documents 
        (session_id, canonical_url, source_hash, raw_html, metadata, parse_status)
        VALUES ($1, $2, $3, $4, $5, 'parsed')
        ON CONFLICT (canonical_url, source_hash) 
        DO UPDATE SET 
          raw_html = EXCLUDED.raw_html,
          metadata = EXCLUDED.metadata,
          parse_status = 'parsed'
        RETURNING id
      `, [sessionId, canonicalUrl, contentHash, html, JSON.stringify(metadata)]);
      
      const documentId = docResult.rows[0].id;
      
      // Parse document
      const parser = this.parsers[parserType];
      if (!parser) {
        throw new Error(`No parser found for type: ${parserType}`);
      }
      
      let parsedResults = parser.parse({ canonicalUrl, html });

      // Fallback: if we parsed suspiciously few sections, do a text-based parse
      if (!Array.isArray(parsedResults) || parsedResults.length < 150) {
        console.warn(`DOM parse yielded ${parsedResults?.length || 0} sections; running text fallback.`);
        const fallback = this.parseByText(canonicalUrl, html);
        // Deduplicate by article-section
        const key = r => `${r?.metadata?.articleNumber}-${r?.metadata?.sectionNumber}`;
        const map = new Map();
        parsedResults.forEach(r => map.set(key(r), r));
        fallback.forEach(r => { if (!map.has(key(r))) map.set(key(r), r); });
        parsedResults = Array.from(map.values());
      }

      // If nothing parsed, mark as failed and surface an error
      if (!Array.isArray(parsedResults) || parsedResults.length === 0) {
        await this.db.query(
          `UPDATE scraped_documents SET parse_status = 'failed_no_nodes' WHERE id = $1`,
          [documentId]
        );
        throw new Error('No content parsed from document');
      }
      
      // Store parsed results and create KB entries
      for (const result of parsedResults) {
        const norm = this.normalizePerEntry(result);
        if (!norm) { continue; }
        // Generate unique identifier for each section to avoid conflicts
        const sectionUrl = result.metadata?.articleNumber && result.metadata?.sectionNumber 
          ? `${result.canonical_url}#art${result.metadata.articleNumber}-sec${result.metadata.sectionNumber}`
          : result.metadata?.preamble 
            ? `${result.canonical_url}#preamble`
            : result.metadata?.ordinance
              ? `${result.canonical_url}#ordinance`
              : `${result.canonical_url}#art${result.metadata?.articleNumber || 'unknown'}`;
        
        const sectionHash = `${contentHash}-${result.sequence_index}`;
        
        // Store in scraped_documents
        await this.db.query(`
          INSERT INTO scraped_documents 
          (session_id, canonical_url, source_hash, extracted_text, metadata, sequence_index, parse_status)
          VALUES ($1, $2, $3, $4, $5, $6, 'parsed')
          ON CONFLICT (canonical_url, source_hash)
          DO UPDATE SET
            extracted_text = EXCLUDED.extracted_text,
            metadata = EXCLUDED.metadata,
            sequence_index = EXCLUDED.sequence_index,
            parse_status = 'parsed'
        `, [
          sessionId,
          sectionUrl,
          sectionHash,
          norm.headerPlusBody,
          JSON.stringify(result.metadata),
          result.sequence_index
        ]);

        // Note: KB entries are now created only through "Generate Entries" process
        // This ensures proper separation between scraping (raw data) and entry generation
      }
      
      console.log(`✅ Processed: ${url} (${parsedResults.length} sections)`);
      return documentId;
      
    } catch (error) {
      console.error(`❌ Failed to process ${url}:`, error.message);
      
      // Mark as failed
      await this.db.query(`
        INSERT INTO scraped_documents 
        (session_id, canonical_url, source_hash, parse_status)
        VALUES ($1, $2, $3, 'failed')
        ON CONFLICT (canonical_url, source_hash)
        DO UPDATE SET parse_status = 'failed'
      `, [sessionId, url, 'failed']);
      
      throw error;
    }
  }

  /**
   * Process 1987 Constitution
   */
  async processConstitution1987(sessionId) {
    const rootUrl = 'https://lawphil.net/consti/cons1987.html';
    return await this.processUrl(sessionId, rootUrl, 'constitution_1987');
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId) {
    try {
      await this.db.query(`
        UPDATE scraping_sessions 
        SET status = 'completed', finished_at = NOW()
        WHERE id = $1
      `, [sessionId]);
      
      console.log(`✅ Session completed: ${sessionId}`);
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId) {
    const result = await this.db.query(`
      SELECT s.*, 
             COUNT(d.id) as total_documents,
             COUNT(CASE WHEN d.parse_status = 'parsed' THEN 1 END) as parsed_documents,
             COUNT(CASE WHEN d.parse_status = 'failed' THEN 1 END) as failed_documents
      FROM scraping_sessions s
      LEFT JOIN scraped_documents d ON s.id = d.session_id
      WHERE s.id = $1
      GROUP BY s.id
    `, [sessionId]);
    
    return result.rows[0] || null;
  }

  /**
   * Get parsed documents for a session
   */
  async getSessionDocuments(sessionId) {
    const result = await this.db.query(`
      SELECT * FROM scraped_documents 
      WHERE session_id = $1 AND parse_status = 'parsed'
      ORDER BY sequence_index
    `, [sessionId]);
    
    return result.rows;
  }

  // Note: KB entry creation has been moved to the "Generate Entries" process
  // This ensures proper separation between scraping (raw data) and entry generation

  /**
   * Generate unique entry ID
   */
  generateEntryId(metadata) {
    const { articleNumber, sectionNumber, preamble } = metadata;
    const topics = Array.isArray(metadata.topics) ? metadata.topics.map(t => String(t).toLowerCase()) : [];

    if (preamble) {
      return 'CONST-1987-PREAMBLE';
    }

    if (topics.includes('ordinance') || /\bordinance\b/i.test(metadata.title || '')) {
      return 'CONST-1987-ORDINANCE';
    }

    if (articleNumber && (sectionNumber == null || sectionNumber === 0 || sectionNumber === '0')) {
      return `CONST-1987-ART${articleNumber}`;
    }
    
    return `CONST-1987-ART${articleNumber}-SEC${sectionNumber}`;
  }

  /**
   * Close database connection
   */
  async close() {
    await this.db.end();
  }
}

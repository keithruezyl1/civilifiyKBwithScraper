import { DocumentScraper } from './DocumentScraper.js';
import ActsParser from '../parsers/ActsParser.js';
import { JSDOM } from 'jsdom';
import { Pool } from 'pg';

/**
 * ActsScraper
 * Specialized scraper for Philippine Acts from LawPhil
 * 
 * Workflow:
 * 1. Takes a year page URL (e.g., act1930/act1930.html)
 * 2. Scrapes all Act numbers from that year page
 * 3. For each Act, scrapes the individual Act page
 * 4. Parses and structures all content
 */
export class ActsScraper {
  constructor(dbConnectionString, options = {}) {
    this.db = new Pool({ connectionString: dbConnectionString });
    this.documentScraper = new DocumentScraper(options.scraper || {});
    this.actsParser = new ActsParser();
    this.maxConcurrency = options.maxConcurrency || 3;
    this.delayBetweenRequests = options.delayBetweenRequests || 1000;
  }

  /**
   * Main method to scrape all Acts from a year page
   */
  async scrapeYearActs(sessionId, yearPageUrl) {
    try {
      console.log(`🚀 Starting Acts scraping for year page: ${yearPageUrl}`);
      
      // Validate URL format
      if (!this.isValidYearPageUrl(yearPageUrl)) {
        throw new Error(`Invalid year page URL format: ${yearPageUrl}`);
      }
      
      // Step 1: Scrape the year page to get all Act numbers
      console.log(`📅 Step 1: Scraping year page...`);
      const yearPageResult = await this.documentScraper.fetchWithRetry(yearPageUrl);
      const yearDoc = new JSDOM(yearPageResult.html).window.document;
      const yearPageParsed = this.actsParser.parse(yearDoc, yearPageUrl);
      
      // Extract Act URLs from year page
      const actUrls = this.extractActUrls(yearPageParsed, yearPageUrl);
      console.log(`📋 Found ${actUrls.length} Acts to scrape`);
      
      // Log first few Acts for verification
      actUrls.slice(0, 5).forEach((url, index) => {
        console.log(`  📄 Act ${index + 1}: ${url}`);
      });
      if (actUrls.length > 5) {
        console.log(`  ... and ${actUrls.length - 5} more Acts`);
      }
      
      if (actUrls.length === 0) {
        throw new Error('No Acts found on year page');
      }
      
      // Step 2: Scrape each individual Act page
      console.log(`📄 Step 2: Scraping individual Act pages...`);
      const allActResults = [];
      
      // Process Acts in batches to avoid overwhelming the server
      const batches = this.createBatches(actUrls, this.maxConcurrency);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} Acts)`);
        
        const batchPromises = batch.map(actUrl => this.scrapeIndividualAct(sessionId, actUrl));
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allActResults.push(...result.value);
            const actNumber = batch[index].match(/act_(\d+)_/)?.[1] || 'unknown';
            console.log(`✅ Successfully scraped Act No. ${actNumber}: ${result.value.length} entries`);
          } else {
            console.error(`❌ Failed to scrape ${batch[index]}:`, result.reason.message);
          }
        });
        
        // Delay between batches
        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenRequests}ms before next batch...`);
          await this.sleep(this.delayBetweenRequests);
        }
      }
      
      console.log(`🎉 Completed scraping! Total results: ${allActResults.length}`);
      return allActResults;
      
    } catch (error) {
      console.error('ActsScraper error:', error);
      throw error;
    }
  }

  /**
   * Scrape a single individual Act page
   */
  async scrapeIndividualAct(sessionId, actUrl) {
    try {
      // Fetch the Act page
      const actResult = await this.documentScraper.fetchWithRetry(actUrl);
      
      // Parse the Act content
      const actDoc = new JSDOM(actResult.html).window.document;
      const parsedResults = this.actsParser.parse(actDoc, actUrl);
      
      // Store raw document in database
      const canonicalUrl = this.documentScraper.getCanonicalUrl(actUrl);
      const contentHash = actResult.contentHash;
      const metadata = this.documentScraper.extractMetadata(actResult.html, actUrl);
      
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
      `, [sessionId, canonicalUrl, contentHash, actResult.html, JSON.stringify(metadata)]);
      
      const documentId = docResult.rows[0].id;
      
      // Store parsed results
      const storedResults = [];
      for (const parsedResult of parsedResults) {
        const storedResult = await this.storeParsedResult(sessionId, parsedResult);
        storedResults.push(storedResult);
      }
      
      return storedResults;
      
    } catch (error) {
      console.error(`Failed to scrape individual Act ${actUrl}:`, error);
      throw error;
    }
  }

  /**
   * Store parsed result in database
   */
  async storeParsedResult(sessionId, parsedResult) {
    const result = await this.db.query(`
      INSERT INTO scraped_documents 
      (session_id, canonical_url, source_hash, extracted_text, metadata, sequence_index, parse_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'parsed')
      RETURNING id
    `, [
      sessionId,
      parsedResult.metadata.canonicalUrl || 'unknown',
      'acts_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      parsedResult.extracted_text,
      JSON.stringify(parsedResult.metadata),
      parsedResult.sequence_index
    ]);
    
    return {
      id: result.rows[0].id,
      ...parsedResult
    };
  }

  /**
   * Extract Act URLs from year page parsing results
   */
  extractActUrls(yearPageResults, baseUrl) {
    const actUrls = [];
    
    yearPageResults.forEach(result => {
      if (result.metadata && result.metadata.canonicalUrl) {
        actUrls.push(result.metadata.canonicalUrl);
      }
    });
    
    return actUrls;
  }

  /**
   * Validate year page URL format
   */
  isValidYearPageUrl(url) {
    return /\/act\d{4}\/act\d{4}\.html$/.test(url);
  }

  /**
   * Create batches for concurrent processing
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close database connection
   */
  async close() {
    await this.db.end();
  }
}

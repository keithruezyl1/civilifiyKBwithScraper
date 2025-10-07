import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import crypto from 'crypto';

/**
 * DocumentScraper
 * Handles fetching and basic processing of documents from LawPhil
 */
export class DocumentScraper {
  constructor(options = {}) {
    this.maxRps = options.maxRps || 1; // requests per second
    this.concurrency = options.concurrency || 1;
    this.userAgent = options.userAgent || 'LawEntryBot/1.0 (contact@example.com)';
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.requestQueue = [];
    this.activeRequests = 0;
    this.lastRequestTime = 0;
  }

  /**
   * Fetch a single document
   */
  async fetchDocument(url, options = {}) {
    const startTime = Date.now();
    
    try {
      // Rate limiting
      await this.rateLimit();
      
      console.log(`🔍 Fetching: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers
        },
        timeout: this.timeout,
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const contentHash = this.generateContentHash(html);
      
      const fetchTime = Date.now() - startTime;
      console.log(`✅ Fetched: ${url} (${fetchTime}ms, ${html.length} chars)`);
      
      return {
        url,
        html,
        contentHash,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        fetchTime
      };
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.fetchDocument(url, options);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // exponential backoff
          console.log(`⏳ Retry ${attempt}/${this.retryAttempts} in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Rate limiting
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.maxRps; // milliseconds between requests
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Generate content hash for change detection
   */
  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Extract basic metadata from HTML
   */
  extractMetadata(html, url) {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const title = document.querySelector('title')?.textContent?.trim() || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      // Extract any structured data
      const structuredData = this.extractStructuredData(document);
      
      return {
        title,
        description,
        url,
        extractedAt: new Date().toISOString(),
        structuredData
      };
    } catch (error) {
      console.warn('Failed to extract metadata:', error.message);
      return {
        title: '',
        description: '',
        url,
        extractedAt: new Date().toISOString(),
        structuredData: {}
      };
    }
  }

  /**
   * Extract comprehensive structured data from document
   * Philosophy: "Extract EVERYTHING that could be useful for parsing"
   */
  extractStructuredData(document) {
    const structuredData = {};
    
    // Extract all headings with context
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    structuredData.headings = headings.map(h => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim(),
      id: h.id || null,
      className: h.className || null,
      parentTag: h.parentElement?.tagName?.toLowerCase() || null
    }));
    
    // Extract all paragraphs with context
    const paragraphs = Array.from(document.querySelectorAll('p'));
    structuredData.paragraphs = paragraphs.map(p => ({
      text: p.textContent.trim(),
      className: p.className || null,
      parentTag: p.parentElement?.tagName?.toLowerCase() || null
    }));
    
    // Extract all lists with detailed structure
    const lists = Array.from(document.querySelectorAll('ul, ol'));
    structuredData.lists = lists.map(list => ({
      type: list.tagName.toLowerCase(),
      className: list.className || null,
      items: Array.from(list.querySelectorAll('li')).map(li => ({
        text: li.textContent.trim(),
        className: li.className || null,
        sublists: Array.from(li.querySelectorAll('ul, ol')).map(sub => ({
          type: sub.tagName.toLowerCase(),
          items: Array.from(sub.querySelectorAll('li')).map(subLi => subLi.textContent.trim())
        }))
      }))
    }));
    
    // Extract all tables
    const tables = Array.from(document.querySelectorAll('table'));
    structuredData.tables = tables.map(table => ({
      className: table.className || null,
      headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()),
      rows: Array.from(table.querySelectorAll('tr')).map(tr => 
        Array.from(tr.querySelectorAll('td, th')).map(cell => cell.textContent.trim())
      )
    }));
    
    // Extract all links with context
    const links = Array.from(document.querySelectorAll('a'));
    structuredData.links = links.map(link => ({
      text: link.textContent.trim(),
      href: link.href || null,
      title: link.title || null,
      className: link.className || null
    }));
    
    // Extract all bold/italic/emphasis elements
    const emphasis = Array.from(document.querySelectorAll('b, i, em, strong, u'));
    structuredData.emphasis = emphasis.map(el => ({
      tag: el.tagName.toLowerCase(),
      text: el.textContent.trim(),
      className: el.className || null
    }));
    
    // Extract all divs with potential legal content
    const divs = Array.from(document.querySelectorAll('div'));
    structuredData.divs = divs
      .filter(div => div.textContent.trim().length > 20) // Only meaningful divs
      .map(div => ({
        text: div.textContent.trim(),
        className: div.className || null,
        id: div.id || null
      }));
    
    // Extract all spans with potential legal content
    const spans = Array.from(document.querySelectorAll('span'));
    structuredData.spans = spans
      .filter(span => span.textContent.trim().length > 10) // Only meaningful spans
      .map(span => ({
        text: span.textContent.trim(),
        className: span.className || null,
        id: span.id || null
      }));
    
    // Extract all text content with position information
    const bodyText = document.body.textContent || '';
    structuredData.fullText = {
      content: bodyText,
      length: bodyText.length,
      wordCount: bodyText.split(/\s+/).length,
      lineCount: bodyText.split('\n').length
    };
    
    // Extract potential legal document patterns
    structuredData.legalPatterns = this.extractLegalPatterns(bodyText);
    
    return structuredData;
  }

  /**
   * Extract potential legal document patterns from text
   */
  extractLegalPatterns(text) {
    const patterns = {
      articles: [],
      sections: [],
      ordinances: [],
      amendments: [],
      resolutions: [],
      declarations: [],
      preambles: []
    };
    
    // Article patterns
    const articleRegex = /ARTICLE\s+([IVX]+|\d+)\s*[-–]?\s*([^\n\r]+)/gi;
    let match;
    while ((match = articleRegex.exec(text)) !== null) {
      patterns.articles.push({
        number: match[1],
        title: match[2].trim(),
        position: match.index
      });
    }
    
    // Section patterns
    const sectionRegex = /Section\s+(\d+[A-Za-z]?)\.?\s*([^\n\r]+)/gi;
    while ((match = sectionRegex.exec(text)) !== null) {
      patterns.sections.push({
        number: match[1],
        title: match[2].trim(),
        position: match.index
      });
    }
    
    // Ordinance patterns
    const ordinanceRegex = /(City|Municipal|Barangay)\s+Ordinance[^]*?(?=ARTICLE|Section|$)/gi;
    while ((match = ordinanceRegex.exec(text)) !== null) {
      patterns.ordinances.push({
        type: match[1],
        content: match[0].trim(),
        position: match.index
      });
    }
    
    // Preamble patterns
    const preambleRegex = /PREAMBLE[^]*?(?=ARTICLE|$)/gi;
    while ((match = preambleRegex.exec(text)) !== null) {
      patterns.preambles.push({
        content: match[0].trim(),
        position: match.index
      });
    }
    
    return patterns;
  }

  /**
   * Check if URL should be fetched (robots.txt compliance)
   */
  async shouldFetch(url) {
    // For now, we'll be conservative and allow all LawPhil URLs
    // In production, you'd want to implement proper robots.txt checking
    return url.includes('lawphil.net');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get canonical URL (remove fragments, normalize)
   */
  getCanonicalUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove fragment and normalize
      urlObj.hash = '';
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }
}

/**
 * BaseParser
 * Abstract base class for all document parsers
 */
export class BaseParser {
  constructor() {
    this.sequenceIndex = 0;
  }

  /**
   * Main parsing method - must be implemented by subclasses
   * @param {Object} input - { canonicalUrl, html }
   * @returns {Array} Array of parsed documents
   */
  parse(input) {
    throw new Error('parse() method must be implemented by subclass');
  }

  /**
   * Reset sequence index for new parsing session
   */
  resetSequenceIndex() {
    this.sequenceIndex = 0;
  }

  /**
   * Generate canonical URL with fragment
   */
  generateCanonicalUrl(baseUrl, fragment) {
    return `${baseUrl}#${fragment}`;
  }

  /**
   * Clean and normalize text content
   */
  cleanText(text) {
    if (!text) return '';
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Remove common artifacts
    text = text.replace(/LawPhil.*?\.net/g, '');
    text = text.replace(/Back to.*?Home/g, '');
    text = text.replace(/^\s*[-–]\s*/g, '');
    
    return text;
  }

  /**
   * Validate parsed document structure
   */
  validateDocument(doc) {
    const required = ['extracted_text', 'metadata', 'sequence_index'];
    const missing = required.filter(field => !doc[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (!doc.metadata.title) {
      throw new Error('Document metadata must include title');
    }
    
    return true;
  }
}

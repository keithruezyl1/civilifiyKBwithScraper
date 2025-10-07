import { JSDOM } from 'jsdom';

/**
 * Constitution1987Parser
 * Intelligent parser that identifies ALL possible legal entries from LawPhil HTML
 * 
 * Philosophy: "If it CAN be a legal entry, it WILL be a legal entry"
 * 
 * Contract:
 * - Input: { canonicalUrl, html }
 * - Output: Array of { extracted_text, metadata, sequence_index, children[] }
 */
export class Constitution1987Parser {
  constructor() {
    this.sequenceIndex = 0;
  }

  /**
   * Main parsing method - intelligently identifies ALL possible entries
   */
  parse({ canonicalUrl, html }) {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const results = [];
      
      // Get all text content for comprehensive analysis
      const bodyText = document.body.textContent || '';
      
      // Identify and parse ALL possible legal entries
      const entries = this.identifyAllEntries(bodyText, canonicalUrl);
      results.push(...entries);
      
      return results;
    } catch (error) {
      console.error('Constitution1987Parser error:', error);
      throw new Error(`Failed to parse 1987 Constitution: ${error.message}`);
    }
  }

  /**
   * Identify ALL possible legal entries from raw text
   * Philosophy: "If it CAN be a legal entry, it WILL be a legal entry"
   */
  identifyAllEntries(bodyText, canonicalUrl) {
    const entries = [];
    
    // 1. Identify Preamble
    const preamble = this.identifyPreamble(bodyText, canonicalUrl);
    if (preamble) entries.push(preamble);
    
    // 2. Identify all Articles (I-XVIII)
    const articles = this.identifyArticles(bodyText, canonicalUrl);
    entries.push(...articles);
    
    // 3. Identify Ordinance (if present)
    const ordinance = this.identifyOrdinance(bodyText, canonicalUrl);
    if (ordinance) entries.push(ordinance);
    
    // 4. Identify any other legal structures
    const otherEntries = this.identifyOtherLegalStructures(bodyText, canonicalUrl);
    entries.push(...otherEntries);
    
    // Sort by sequence for proper ordering
    entries.sort((a, b) => a.sequence_index - b.sequence_index);
    
    return entries;
  }

  /**
   * Identify Preamble entry
   */
  identifyPreamble(bodyText, canonicalUrl) {
    const preamblePatterns = [
      /PREAMBLE\s*([^]*?)(?=ARTICLE\s+[IVX]+|$)/i,
      /We, the sovereign Filipino people[^]*?(?=ARTICLE\s+[IVX]+|$)/i
    ];
    
    for (const pattern of preamblePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const text = this.cleanText(match[1] || match[0]);
        if (text && text.length > 50) {
          return {
            extracted_text: text,
            metadata: {
              title: 'Preamble',
              articleNumber: 0,
              sectionNumber: 0,
              preamble: true,
              topics: ['preamble', 'constitutional_principles']
            },
            sequence_index: this.sequenceIndex++,
            canonical_url: `${canonicalUrl}#preamble`
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Identify all Articles (I-XVIII) with proper hierarchy tracking
   */
  identifyArticles(bodyText, canonicalUrl) {
    const entries = [];
    
    // Parse the entire document sequentially to maintain context
    const lines = bodyText.split('\n');
    let currentArticle = null;
    let currentArticleNumber = null;
    let currentArticleTitle = null;
    let currentArticleContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new article
      const articleMatch = line.match(/^ARTICLE\s+([IVX]+|\d+)\s*[-–]?\s*(.+)$/i);
      if (articleMatch) {
        // Process previous article if exists
        if (currentArticle) {
          const articleEntries = this.processArticle(
            currentArticleNumber, 
            currentArticleTitle, 
            currentArticleContent.join('\n'), 
            canonicalUrl
          );
          entries.push(...articleEntries);
        }
        
        // Start new article
        currentArticleNumber = this.romanToNumber(articleMatch[1]) || parseInt(articleMatch[1]);
        currentArticleTitle = articleMatch[2].trim().replace(/\s+/g, ' ');
        currentArticleContent = [];
        currentArticle = {
          number: currentArticleNumber,
          title: currentArticleTitle,
          content: []
        };
        
        console.log(`Found Article ${currentArticleNumber}: ${currentArticleTitle}`);
        continue;
      }
      
      // If we're in an article, collect content
      if (currentArticle) {
        currentArticleContent.push(line);
      }
    }
    
    // Process the last article
    if (currentArticle) {
      const articleEntries = this.processArticle(
        currentArticleNumber, 
        currentArticleTitle, 
        currentArticleContent.join('\n'), 
        canonicalUrl
      );
      entries.push(...articleEntries);
    }
    
    return entries;
  }

  /**
   * Process a single article and determine if it has sections or is a single entry
   */
  processArticle(articleNumber, articleTitle, articleContent, canonicalUrl) {
    const entries = [];
    
    // Clean the content
    const cleanContent = this.cleanText(articleContent);
    if (!cleanContent || cleanContent.length < 20) return entries;
    
    // Check if this article has explicit sections
    const sectionMatches = cleanContent.match(/Section\s+\d+[A-Za-z]?\./g);
    
    console.log(`Article ${articleNumber} (${articleTitle}): Checking for sections...`);
    console.log(`  - Content length: ${cleanContent.length}`);
    console.log(`  - Section matches found: ${sectionMatches ? sectionMatches.length : 0}`);
    if (sectionMatches) {
      console.log(`  - Section numbers: ${sectionMatches.join(', ')}`);
    }
    
    if (sectionMatches && sectionMatches.length > 0) {
      // Article has sections - parse each section
      const sections = this.parseSectionsFromText(cleanContent, articleNumber, articleTitle);
      
      let ordinanceText = '';
      for (const section of sections) {
        if (!section.text || section.text.length <= 10) continue;
        let sectionText = section.text;
        // Special rule: Article 18 Section 27 stops at 'Adopted:'; remaining goes to Ordinance
        if (articleNumber === 18 && String(section.number).replace(/\D/g,'') === '27') {
          const parts = sectionText.split(/\bAdopted:\b/i);
          if (parts.length > 1) {
            sectionText = parts[0].trim();
            ordinanceText = ('Adopted:' + parts.slice(1).join('Adopted:')).trim();
          }
        }
        
        entries.push({
          extracted_text: sectionText,
          metadata: {
            title: `${articleTitle} - Section ${section.number}`,
            articleNumber: articleNumber,
            sectionNumber: section.number,
            subpart: section.subpart || null,
            preamble: false,
            topics: this.inferTopics(articleNumber, section.number, sectionText)
          },
          sequence_index: this.sequenceIndex++,
          canonical_url: `${canonicalUrl}#article-${articleNumber}-section-${section.number}`
        });
      }
      
      // If ordinance text was captured from Article 18 Section 27, emit as separate entry
      if (ordinanceText) {
        entries.push({
          extracted_text: ordinanceText,
          metadata: {
            title: 'Ordinance',
            articleNumber: null,
            sectionNumber: null,
            preamble: false,
            topics: ['ordinance', 'local_government']
          },
          sequence_index: this.sequenceIndex++,
          canonical_url: `${canonicalUrl}#ordinance`
        });
      }
    } else {
      // Article has no sections - treat as single entry
      entries.push({
        extracted_text: cleanContent,
        metadata: {
          title: articleTitle,
          articleNumber: articleNumber,
          sectionNumber: null,
          preamble: false,
          topics: this.inferTopics(articleNumber, null, cleanContent)
        },
        sequence_index: this.sequenceIndex++,
        canonical_url: `${canonicalUrl}#article-${articleNumber}`
      });
    }
    
    return entries;
  }

  /**
   * Identify Ordinance (if present)
   */
  identifyOrdinance(bodyText, canonicalUrl) {
    const ordinancePatterns = [
      /ORDINANCE\s*([^]*?)(?=ARTICLE\s+[IVX]+|$)/i,
      /City Ordinance[^]*?(?=ARTICLE\s+[IVX]+|$)/i,
      /Municipal Ordinance[^]*?(?=ARTICLE\s+[IVX]+|$)/i
    ];
    
    for (const pattern of ordinancePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const text = this.cleanText(match[1] || match[0]);
        if (text && text.length > 50) {
          return {
            extracted_text: text,
            metadata: {
              title: 'Ordinance',
              articleNumber: null,
              sectionNumber: null,
              preamble: false,
              topics: ['ordinance', 'local_government']
            },
            sequence_index: this.sequenceIndex++,
            canonical_url: `${canonicalUrl}#ordinance`
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Identify other legal structures that might be present
   */
  identifyOtherLegalStructures(bodyText, canonicalUrl) {
    const entries = [];
    
    // Look for other legal document patterns
    const otherPatterns = [
      { pattern: /AMENDMENT\s*([^]*?)(?=ARTICLE\s+[IVX]+|$)/gi, type: 'amendment', topics: ['amendment', 'constitutional_provision'] },
      { pattern: /RESOLUTION\s*([^]*?)(?=ARTICLE\s+[IVX]+|$)/gi, type: 'resolution', topics: ['resolution', 'legislative'] },
      { pattern: /DECLARATION\s*([^]*?)(?=ARTICLE\s+[IVX]+|$)/gi, type: 'declaration', topics: ['declaration', 'constitutional_provision'] }
    ];
    
    for (const { pattern, type, topics } of otherPatterns) {
      let match;
      while ((match = pattern.exec(bodyText)) !== null) {
        const text = this.cleanText(match[1] || match[0]);
        if (text && text.length > 50) {
          entries.push({
            extracted_text: text,
            metadata: {
              title: type.charAt(0).toUpperCase() + type.slice(1),
              articleNumber: null,
              sectionNumber: null,
              preamble: false,
              topics: topics
            },
            sequence_index: this.sequenceIndex++,
            canonical_url: `${canonicalUrl}#${type}`
          });
        }
      }
    }
    
    return entries;
  }

  /**
   * Parse the Preamble (legacy method - keeping for compatibility)
   */
  parsePreamble(document, canonicalUrl) {
    const bodyText = document.body.textContent || '';
    
    // Look for preamble by content patterns
    const preamblePatterns = [
      /PREAMBLE\s*([^]*?)(?=Article\s+[IVX]+|$)/i,
      /We, the sovereign Filipino people[^]*?(?=Article\s+[IVX]+|$)/i
    ];
    
    let preambleText = '';
    for (const pattern of preamblePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        preambleText = match[1] || match[0];
        break;
      }
    }
    
    // If no preamble pattern found, look for the specific text
    if (!preambleText) {
      const preambleStart = bodyText.indexOf('We, the sovereign Filipino people');
      if (preambleStart !== -1) {
        const articleStart = bodyText.indexOf('Article I');
        if (articleStart > preambleStart) {
          preambleText = bodyText.substring(preambleStart, articleStart);
        }
      }
    }
    
    if (preambleText) {
      const cleanedText = this.cleanText(preambleText);
      if (cleanedText.trim()) {
        return {
          extracted_text: cleanedText,
          metadata: {
            title: 'Preamble',
            articleNumber: 0,
            sectionNumber: 0,
            preamble: true,
            topics: ['preamble', 'constitutional_principles']
          },
          sequence_index: this.sequenceIndex++,
          canonical_url: `${canonicalUrl}#preamble`
        };
      }
    }
    
    console.warn('Could not find Preamble in document');
    return null;
  }

  /**
   * Parse all Articles
   */
  parseArticles(document, canonicalUrl) {
    const results = [];
    
    // Get all text content and find article patterns
    const bodyText = document.body.textContent || '';
    
    // Find all article matches in order
    const articleMatches = [];
    // Updated regex to match LawPhil format: "ARTICLE I" followed by title on same or next line
    const articleRegex = /ARTICLE\s+([IVX]+|\d+)([A-Z][A-Z\s]+?)(?=\n|$)/gi;
    let match;
    
    while ((match = articleRegex.exec(bodyText)) !== null) {
      const articleNumber = this.romanToNumber(match[1]) || parseInt(match[1]);
      let articleTitle = match[2].trim();
      
      // Clean up the title - remove extra whitespace and newlines
      articleTitle = articleTitle.replace(/\s+/g, ' ').trim();
      
      const startIndex = match.index;
      
      articleMatches.push({
        number: articleNumber,
        title: articleTitle,
        startIndex: startIndex,
        fullMatch: match[0]
      });
    }
    
    // Sort by article number to ensure proper order
    articleMatches.sort((a, b) => a.number - b.number);
    
    console.log(`Found ${articleMatches.length} articles:`, articleMatches.map(a => `Article ${a.number}: ${a.title}`));
    
    // Parse each article in order
    for (const articleMatch of articleMatches) {
      const articleResult = this.parseArticleByContent(document, articleMatch, canonicalUrl);
      if (articleResult && articleResult.length > 0) {
        results.push(...articleResult);
      }
    }
    
    return results;
  }

  /**
   * Parse a single Article by content match
   */
  parseArticleByContent(document, articleMatch, canonicalUrl) {
    const results = [];
    const { number: articleNumber, title: articleTitle } = articleMatch;
    
    // Find the article content in the DOM
    const bodyText = document.body.textContent || '';
    const articleStart = bodyText.indexOf(articleMatch.fullMatch);
    
    if (articleStart === -1) {
      console.warn(`Could not find article ${articleNumber} in DOM`);
      return results;
    }
    
    // Extract content from this article to the next article or end
    const nextArticleStart = this.findNextArticleStart(bodyText, articleStart + 1);
    let articleContent = bodyText.substring(articleStart, nextArticleStart);
    
    // Remove the article header from the content
    articleContent = articleContent.replace(articleMatch.fullMatch, '').trim();
    
    // Parse sections within this article
    const sections = this.parseSectionsFromText(articleContent, articleNumber, articleTitle);
    
    for (const section of sections) {
      if (section.text.trim()) {
        results.push({
          extracted_text: section.text,
          metadata: {
            title: `${articleTitle} - Section ${section.number}`,
            articleNumber: articleNumber,
            sectionNumber: section.number,
            preamble: false,
            topics: this.inferTopics(articleNumber, section.number, section.text)
          },
          sequence_index: this.sequenceIndex++,
          canonical_url: `${canonicalUrl}#article-${articleNumber}-section-${section.number}`
        });
      }
    }
    
    return results;
  }

  /**
   * Find the start of the next article
   */
  findNextArticleStart(bodyText, startIndex) {
    const articleRegex = /Article\s+([IVX]+|\d+)\s*[-–]/gi;
    articleRegex.lastIndex = startIndex;
    const match = articleRegex.exec(bodyText);
    return match ? match.index : bodyText.length;
  }

  /**
   * Parse sections from article text content with improved accuracy
   */
  parseSectionsFromText(articleContent, articleNumber, articleTitle) {
    const sections = [];
    
    // Split content by lines for better processing
    const lines = articleContent.split('\n');
    let currentSection = null;
    let currentSectionText = [];
    let currentSubpart = null; // Track Article IX subparts (A/B/C)
    
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      
      // Detect subpart headers like "A. THE CIVIL SERVICE COMMISSION"
      if (/^[A-Z]\./.test(line)) {
        const letter = line[0];
        if (articleNumber === 9 && ['A','B','C'].includes(letter)) {
          currentSubpart = letter;
        }
      }
      
      // Check if this line starts a new section
      const sectionMatch = line.match(/^Section\s+(\d+[A-Za-z]?)\.\s*(.*)$/i);
      
      if (sectionMatch) {
        // Save previous section if exists
        if (currentSection) {
          const sectionText = currentSectionText.join('\n').trim();
          if (sectionText && sectionText.length > 10) {
            sections.push({
              number: currentSection,
              subpart: currentSubpart,
              text: this.cleanText(sectionText)
            });
          }
        }
        
        // Start new section
        currentSection = sectionMatch[1];
        currentSectionText = [sectionMatch[2].trim()];
      } else if (currentSection && line) {
        // Add line to current section
        currentSectionText.push(line);
      }
    }
    
    // Save the last section
    if (currentSection) {
      const sectionText = currentSectionText.join('\n').trim();
      if (sectionText && sectionText.length > 10) {
        sections.push({
          number: currentSection,
          subpart: currentSubpart,
          text: this.cleanText(sectionText)
        });
      }
    }
    
    console.log(`Article ${articleNumber} (${articleTitle}): Found ${sections.length} sections`);
    sections.forEach(s => {
      console.log(`  - Section ${s.number}: ${s.text.substring(0, 50)}...`);
    });
    
    return sections;
  }

  /**
   * Parse a single Article (legacy method - keeping for compatibility)
   */
  parseArticle(articleElement, canonicalUrl) {
    const results = [];
    
    // Extract article number
    const articleText = articleElement.textContent.trim();
    const articleMatch = articleText.match(/Article\s+([IVX]+|\d+)/i);
    if (!articleMatch) return results;
    
    const articleNumber = this.romanToNumber(articleMatch[1]) || parseInt(articleMatch[1]);
    const articleTitle = this.extractArticleTitle(articleText);
    
    // Find sections within this article
    const sections = this.findSectionsInArticle(articleElement, articleNumber);
    
    for (const section of sections) {
      let body = '';
      if (Array.isArray(section.elements) && section.elements.length > 0) {
        body = section.elements.map(el => this.extractCleanText(el)).join('\n\n');
      } else if (section.element) {
        body = this.extractCleanText(section.element);
      }
      if (!body.trim()) continue;

      // If this body contains multiple Section headers, split them into distinct entries
      const segs = [];
      const re = /(Section\s+(\d+[A-Za-z]?)\.)/gi;
      let m, last = 0, lastNum = null;
      while ((m = re.exec(body)) !== null) {
        if (lastNum !== null) {
          segs.push({ num: lastNum, text: body.substring(last, m.index).trim() });
        }
        lastNum = m[2];
        last = m.index + m[0].length;
      }
      if (lastNum !== null) {
        segs.push({ num: lastNum, text: body.substring(last).trim() });
      }

      const emit = (num, text) => {
        if (!num || !text) return;
        results.push({
          extracted_text: text,
          metadata: {
            title: `${articleTitle} - Section ${num}`,
            articleNumber: articleNumber,
            sectionNumber: num,
            preamble: false,
            topics: this.inferTopics(articleNumber, num, text)
          },
          sequence_index: this.sequenceIndex++,
          canonical_url: `${canonicalUrl}#article-${articleNumber}-section-${num}`
        });
      };

      if (segs.length > 0) {
        segs.forEach(s => emit(s.num, s.text));
      } else {
        emit(section.number, body);
      }
    }
    
    return results;
  }

  /**
   * Find sections within an article
   */
  findSectionsInArticle(articleElement, articleNumber) {
    const sections = [];

    let node = articleElement.nextElementSibling;
    let current = null;

    const commit = () => {
      if (!current) return;
      current.elements = (current.elements || []).filter(el => (el.textContent || '').trim().length > 0);
      if (current.elements.length > 0) sections.push(current);
      current = null;
    };

    const isArticleHeading = (txt) => /^Article\s+/i.test(txt);

    while (node) {
      const txt = (node.textContent || '').trim();
      if (!txt) { node = node.nextElementSibling; continue; }
      if (isArticleHeading(txt)) { commit(); break; }

      const m = txt.match(/^Section\s+(\d+[A-Za-z]?)/i);
      if (m) {
        commit();
        current = { number: m[1], title: txt, elements: [] };
      } else if (current) {
        current.elements.push(node);
      }
      node = node.nextElementSibling;
    }

    commit();
    return sections;
  }

  /**
   * Extract clean text from element
   */
  extractCleanText(element) {
    if (!element) return '';
    
    // Remove navigation, footers, and other non-content elements
    const clone = element.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('nav, footer, .nav, .footer, .menu, .sidebar');
    elementsToRemove.forEach(el => el.remove());
    
    // Get text content and clean it up
    let text = clone.textContent || '';
    
    return this.cleanText(text);
  }

  /**
   * Clean and normalize text content
   */
  cleanText(text) {
    if (!text) return '';
    
    // Normalize whitespace but preserve line breaks for sections
    text = text.replace(/[ \t]+/g, ' ').trim();
    
    // Remove common LawPhil artifacts
    text = text.replace(/LawPhil.*?\.net/g, '');
    text = text.replace(/Back to.*?Home/g, '');
    text = text.replace(/The Lawphil Project.*?Foundation/g, '');
    text = text.replace(/javascript:history\.back\(\)/g, '');
    text = text.replace(/\[#top\]/g, '');
    
    // Remove article headers that might be embedded
    text = text.replace(/^.*?Article\s+[IVX\d]+\s*[-–]\s*/i, '');
    
    // Ensure proper section formatting
    text = text.replace(/^Section\s+(\d+[A-Za-z]?)\.?\s*/i, 'Section $1. ');
    
    return text;
  }

  /**
   * Extract article title
   */
  extractArticleTitle(articleText) {
    // Remove "Article X -" prefix and clean up
    const title = articleText.replace(/^Article\s+[IVX\d]+\s*[-–]\s*/i, '').trim();
    return title || 'Untitled Article';
  }

  /**
   * Convert Roman numerals to numbers
   */
  romanToNumber(roman) {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let result = 0;
    let prev = 0;
    
    for (let i = roman.length - 1; i >= 0; i--) {
      const current = map[roman[i]];
      if (current < prev) {
        result -= current;
      } else {
        result += current;
      }
      prev = current;
    }
    
    return result;
  }

  /**
   * Infer topics based on article and section numbers
   */
  inferTopics(articleNumber, sectionNumber, body) {
    const topics = [];
    
    // Article-based topics - more accurate mapping
    const articleTopics = {
      1: ['national_territory', 'territory', 'constitutional_provision'],
      2: ['declaration_of_principles', 'state_policies', 'constitutional_provision'],
      3: ['bill_of_rights', 'civil_rights', 'human_rights', 'constitutional_provision'],
      4: ['citizenship', 'constitutional_provision'],
      5: ['suffrage', 'voting', 'constitutional_provision'],
      6: ['legislative_department', 'congress', 'constitutional_provision'],
      7: ['executive_department', 'president', 'constitutional_provision'],
      8: ['judicial_department', 'courts', 'constitutional_provision'],
      9: ['constitutional_commissions', 'constitutional_provision'],
      10: ['local_government', 'constitutional_provision'],
      11: ['accountability_of_public_officers', 'constitutional_provision'],
      12: ['national_economy', 'patrimony', 'constitutional_provision'],
      13: ['social_justice', 'human_rights', 'constitutional_provision'],
      14: ['education', 'science', 'technology', 'constitutional_provision'],
      15: ['family', 'constitutional_provision'],
      16: ['general_provisions', 'constitutional_provision'],
      17: ['amendments', 'revisions', 'constitutional_provision'],
      18: ['transitory_provisions', 'constitutional_provision']
    };
    
    if (articleTopics[articleNumber]) {
      topics.push(...articleTopics[articleNumber]);
    } else {
      // Fallback for unknown articles
      topics.push('constitutional_provision');
    }
    
    // Add specific section topics only if we have a valid section number
    if (sectionNumber && articleNumber === 3) { // Bill of Rights
      const sectionTopics = {
        1: ['due_process', 'equal_protection'],
        2: ['search_warrant', 'privacy'],
        3: ['privacy', 'communication'],
        4: ['freedom_of_speech', 'expression'],
        5: ['freedom_of_religion'],
        6: ['liberty_of_abode', 'travel'],
        7: ['right_to_information'],
        8: ['freedom_of_association'],
        9: ['private_property'],
        10: ['non_impairment_clause'],
        11: ['free_access_to_courts'],
        12: ['rights_of_accused'],
        13: ['habeas_corpus'],
        14: ['right_to_speedy_trial'],
        15: ['writ_of_habeas_data'],
        16: ['right_to_speedy_disposition'],
        17: ['self_incrimination'],
        18: ['right_to_counsel'],
        19: ['ex_post_facto'],
        20: ['double_jeopardy'],
        21: ['excessive_fines'],
        22: ['ex_post_facto']
      };
      
      if (sectionTopics[sectionNumber]) {
        topics.push(...sectionTopics[sectionNumber]);
      }
    }
    
    return [...new Set(topics)]; // Remove duplicates
  }
}

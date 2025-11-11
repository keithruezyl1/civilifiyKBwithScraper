import { JSDOM } from 'jsdom';

class ActsParser {
  constructor() {
    this.sequenceIndex = 0;
  }

  /**
   * Parse Acts page based on URL pattern
   */
  parse(document, canonicalUrl) {
    try {
      console.log(`📄 Parsing Acts page: ${canonicalUrl}`);
      
      // Determine page type based on URL pattern
      if (this.isYearPage(canonicalUrl)) {
        return this.parseYearPage(document, canonicalUrl);
      } else if (this.isIndividualActPage(canonicalUrl)) {
        return this.parseIndividualAct(document, canonicalUrl);
      } else {
        throw new Error(`Unknown page type for URL: ${canonicalUrl}`);
      }
    } catch (error) {
      console.error('ActsParser error:', error);
      throw new Error(`Failed to parse Acts page: ${error.message}`);
    }
  }

  /**
   * Check if URL is a year page (e.g., act1930/act1930.html)
   */
  isYearPage(url) {
    return /\/act\d{4}\/act\d{4}\.html$/.test(url);
  }

  /**
   * Check if URL is an individual Act page (e.g., act_3817_1930.html)
   */
  isIndividualActPage(url) {
    return /\/act_\d+_\d{4}\.html$/.test(url);
  }

  /**
   * Parse year page to extract all Act numbers and their links
   */
  parseYearPage(document, canonicalUrl) {
    const results = [];
    const bodyText = document.body.textContent || '';
    
    console.log(`📋 Parsing year page: ${canonicalUrl}`);
    
    // Try to extract Acts from HTML links first
    const acts = this.extractActsFromLinks(document, canonicalUrl);
    
    if (acts.length > 0) {
      console.log(`  📄 Found ${acts.length} Acts from HTML links`);
      acts.forEach(act => {
        results.push({
          extracted_text: `Act No. ${act.actNumber} - ${act.title}`,
          metadata: {
            actNumber: act.actNumber,
            title: act.title,
            approvalDate: act.approvalDate,
            canonicalUrl: act.url,
            pageType: 'act_link',
            sequence_index: this.sequenceIndex++
          },
          sequence_index: this.sequenceIndex - 1,
          children: []
        });
      });
    } else {
      // Fallback to text extraction
      const textActs = this.extractActsFromText(bodyText, canonicalUrl);
      console.log(`  📄 Found ${textActs.length} Acts from text extraction`);
      textActs.forEach(act => {
        results.push({
          extracted_text: `Act No. ${act.actNumber} - ${act.title}`,
          metadata: {
            actNumber: act.actNumber,
            title: act.title,
            approvalDate: act.approvalDate,
            canonicalUrl: act.url,
            pageType: 'act_link',
            sequence_index: this.sequenceIndex++
          },
          sequence_index: this.sequenceIndex - 1,
          children: []
        });
      });
    }
    
    return results;
  }

  /**
   * Extract Acts from HTML links
   */
  extractActsFromLinks(document, canonicalUrl) {
    const acts = [];
    const links = document.querySelectorAll('a[href*="act_"]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      
      // Extract Act number from link text or href
      const actMatch = text.match(/Act No\.\s*(\d+)/i) || href.match(/act_(\d+)_/);
      if (actMatch) {
        const actNumber = actMatch[1];
        
        // Get the next sibling text for date and title
        let nextText = '';
        let nextElement = link.nextSibling;
        while (nextElement && nextText.length < 200) {
          if (nextElement.nodeType === 3) { // Text node
            nextText += nextElement.textContent;
          }
          nextElement = nextElement.nextSibling;
        }
        
        // Extract date and title from next text
        const dateMatch = nextText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
        const approvalDate = dateMatch ? dateMatch[1] : 'Unknown date';
        
        // Extract title (everything after the date)
        const titleMatch = nextText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})([^]*?)(?=Act No\.|$)/);
        const title = titleMatch ? titleMatch[2].trim() : 'Unknown title';
        
        // Construct URL
        const yearMatch = canonicalUrl.match(/\/act(\d{4})\//);
        const year = yearMatch ? yearMatch[1] : 'unknown';
        const url = canonicalUrl.replace(/\/[^\/]+\.html$/, `/act_${actNumber}_${year}.html`);
        
        acts.push({
          actNumber,
          approvalDate,
          title: this.cleanTitle(title),
          url
        });
      }
    });
    
    return acts;
  }

  /**
   * Extract Acts from text patterns (fallback method)
   */
  extractActsFromText(bodyText, canonicalUrl) {
    const acts = [];
    
    // Pattern to match Act entries from LawPhil format
    // Format: [Act No. 3817](act_3817_1930.html)December 09, 1930An Act to Relieve...
    const actPattern = /\[Act No\.\s*(\d+)\]\([^)]+\)([A-Za-z]+\s+\d{1,2},?\s+\d{4})([^]*?)(?=\[Act No\.|$)/gi;
    let match;
    
    while ((match = actPattern.exec(bodyText)) !== null) {
      const actNumber = match[1];
      const approvalDate = match[2].trim();
      const title = match[3].trim();
      
      // Clean up the title - remove any trailing artifacts
      const cleanTitle = this.cleanTitle(title);
      
      // Construct URL
      const yearMatch = canonicalUrl.match(/\/act(\d{4})\//);
      const year = yearMatch ? yearMatch[1] : 'unknown';
      const url = canonicalUrl.replace(/\/[^\/]+\.html$/, `/act_${actNumber}_${year}.html`);
      
      acts.push({
        actNumber,
        approvalDate,
        title: cleanTitle,
        url
      });
    }
    
    return acts;
  }

  /**
   * Clean and normalize title text
   */
  cleanTitle(title) {
    return title
      .replace(/\s*$/, '') // Remove trailing whitespace
      .replace(/^An\s+Act\s+/i, 'AN ACT ') // Normalize "An Act" to "AN ACT"
      .replace(/^A\s+Act\s+/i, 'AN ACT ') // Fix "A Act" to "AN ACT"
      .trim();
  }

  /**
   * Parse individual Act page to extract full content
   */
  parseIndividualAct(document, canonicalUrl) {
    const results = [];
    const bodyText = document.body.textContent || '';
    
    console.log(`📄 Parsing individual Act page: ${canonicalUrl}`);
    
    // Extract Act metadata
    const actMetadata = this.extractActMetadata(bodyText, canonicalUrl);
    console.log(`  📋 Act No. ${actMetadata.actNumber}: ${actMetadata.title.substring(0, 80)}...`);
    
    // Extract content using dynamic hierarchy detection
    const contentEntries = this.extractContentByHierarchy(bodyText, canonicalUrl);
    console.log(`  📑 Found ${contentEntries.length} content entries in Act No. ${actMetadata.actNumber}`);
    
    // Create entries for each content item
    contentEntries.forEach((entry, index) => {
      console.log(`    📝 ${entry.type.toUpperCase()} ${entry.number}: ${entry.text.substring(0, 50)}...`);
      
      // Store ONLY the sanitized body text (no title/metadata)
      const sanitizedText = entry.text.trim();
      
      results.push({
        extracted_text: sanitizedText,
        metadata: {
          ...actMetadata,
          sectionNumber: entry.number,
          sectionTitle: entry.title,
          sectionType: entry.type,
          contextPath: entry.contextPath,
          fullContext: entry.fullContext,
          pageType: 'act_content',
          sequence_index: this.sequenceIndex++
        },
        sequence_index: this.sequenceIndex - 1,
        children: []
      });
    });
    
    return results;
  }

  /**
   * Extract Act metadata from individual Act page
   */
  extractActMetadata(bodyText, canonicalUrl) {
    // Extract Act number from URL
    const actMatch = canonicalUrl.match(/act_(\d+)_/);
    const actNumber = actMatch ? actMatch[1] : 'unknown';
    
    // Extract year from URL
    const yearMatch = canonicalUrl.match(/act_(\d+)_(\d{4})/);
    const year = yearMatch ? yearMatch[2] : 'unknown';
    
    // Extract title from text
    const titleMatch = bodyText.match(/AN ACT[^]*?(?=Be it enacted|$)/i);
    const title = titleMatch ? titleMatch[0].trim() : 'Unknown title';
    
    // Extract approval date
    const approvalMatch = bodyText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    const approvalDate = approvalMatch ? approvalMatch[1] : 'Unknown date';
    
    // Extract effective date
    const effectiveMatch = bodyText.match(/Effective,?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
    const effectiveDate = effectiveMatch ? effectiveMatch[1] : approvalDate;
    
    return {
      actNumber,
      year,
      title: this.cleanTitle(title),
      approvalDate,
      effectiveDate,
      canonicalUrl
    };
  }

  /**
   * Extract content using dynamic hierarchy detection
   */
  extractContentByHierarchy(bodyText, canonicalUrl) {
    const cleanText = this.cleanActText(bodyText);
    
    // Detect the hierarchy structure dynamically
    const hierarchy = this.detectHierarchy(cleanText);
    console.log(`  🏗️ Detected hierarchy: ${hierarchy.map(h => h.type).join(' → ')}`);
    
    // Extract content based on detected hierarchy
    const contentEntries = this.processHierarchyContent(cleanText, hierarchy);
    
    return contentEntries;
  }

  /**
   * Detect the hierarchy structure of an Act
   */
  detectHierarchy(text) {
    const hierarchy = [];
    
    // Define all possible hierarchy patterns
    // Require headings to be at line starts to avoid matching inline references
    const patterns = [
      { type: 'book', regex: /(^|\n)\s*BOOK\s+([A-Z][A-Z\s]*)\s*(?=\n)/g },
      { type: 'title', regex: /(^|\n)\s*TITLE\s+([A-Z][A-Z\s]*)\s*(?=\n)/g },
      { type: 'chapter', regex: /(^|\n)\s*CHAPTER\s+([A-Z][A-Z\s]*)\s*(?=\n)/g },
      // Articles: start of line, allow trailing title on same line, capture number only; content extracted later
      { type: 'article', regex: /(^|\n)\s*Article\s+(\d+[A-Za-z]?)\b[\s.:\-]*([^\n]*)/g },
      // Sections: start of line, capture section number only; content extracted later
      { type: 'section', regex: /(^|\n)\s*Section\s+(\d+[A-Za-z]?)\b[\s.:\-]*([^\n]*)/g }
    ];
    
    // Find all hierarchy elements in order
    const allMatches = [];
    
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          type: pattern.type,
          match: match,
          index: match.index + (match[1] ? match[1].length : 0), // account for (^|\n)
          content: match[0],
          identifier: (match[2] || match[1] || '').toString(),
          fullText: match[0]
        });
      }
    });
    
    // Sort by position in text
    allMatches.sort((a, b) => a.index - b.index);
    
    // Build hierarchy structure
    let currentContext = [];
    
    allMatches.forEach(match => {
      // Update context based on hierarchy level
      if (match.type === 'book') {
        currentContext = [{ type: 'book', name: match.identifier.trim() }];
      } else if (match.type === 'title') {
        // Keep book context, add title
        const bookContext = currentContext.find(c => c.type === 'book');
        currentContext = bookContext ? [bookContext] : [];
        currentContext.push({ type: 'title', name: match.identifier.trim() });
      } else if (match.type === 'chapter') {
        // Keep book/title context, add chapter
        const bookContext = currentContext.find(c => c.type === 'book');
        const titleContext = currentContext.find(c => c.type === 'title');
        currentContext = [bookContext, titleContext].filter(Boolean);
        currentContext.push({ type: 'chapter', name: match.identifier.trim() });
      } else if (match.type === 'article' || match.type === 'section') {
        // Add article/section to current context
        const contextCopy = [...currentContext];
        contextCopy.push({ 
          type: match.type, 
          name: match.identifier.trim(),
          content: match.fullText,
          index: match.index
        });
        
        hierarchy.push({
          type: match.type,
          identifier: match.identifier.trim(),
          context: contextCopy,
          content: match.fullText,
          index: match.index
        });
      }
    });
    
    return hierarchy;
  }

  /**
   * Process hierarchy content into structured entries
   */
  processHierarchyContent(text, hierarchy) {
    const entries = [];
    // Prepare boundaries for each heading to slice content until next true heading
    const headingIndices = hierarchy
      .filter(h => h.type === 'article' || h.type === 'section')
      .map(h => h.index)
      .sort((a,b) => a-b);
    
    hierarchy.forEach(item => {
      // Process the content
      // Compute content block from this heading start to next heading start
      let block = '';
      if (item.type === 'article' || item.type === 'section') {
        const start = item.index;
        const nextIdx = headingIndices.find(i => i > start) ?? text.length;
        block = text.slice(start, nextIdx);
      } else {
        block = item.content;
      }

      let processedContent = this.processSectionContent(block, item.identifier);
      
      // Extract title and content
      let title = '';
      let content = processedContent;
      
      // Try to extract title from the content
      const titlePatterns = [
        /^(Article|Section)\s+\d+[A-Za-z]*\.?\s*([^\n.-]+)[.-]\s*([\s\S]*)/,
        /^(Article|Section)\s+\d+[A-Za-z]*\.?\s*([^\n:]+):\s*([\s\S]*)/,
        /^(Article|Section)\s+\d+[A-Za-z]*\.?\s*([\s\S]*)/
      ];
      
      for (const pattern of titlePatterns) {
        const match = content.match(pattern);
        if (match) {
          title = match[2] ? match[2].trim() : '';
          content = match[3] ? match[3].trim() : match[2] ? match[2].trim() : content;
          break;
        }
      }
      
      // Pre-clean to check for weak starts
      const preClean = content
        .replace(/\n\s*\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

      // Heuristic: merge obviously truncated starts like "one.", "one fall", "six hundred" into previous header block
      // If content is too short or starts with a weak fragment, try to pull preceding line content
      const weakStart = /^(one\.?|one\s+fall\b|six\s+hundred\b|provided\b|whenever\b|and\b|or\b)/i;
      if (weakStart.test(preClean) && item.type === 'section') {
        // Attempt to extend content by including the heading line's trailing text
        const headingLine = (item.fullContextText || item.content || '').split('\n')[0] || '';
        const merged = headingLine.replace(/^(?:\s*Section\s+\d+[A-Za-z]*[.:\-]?\s*)/i, '').trim();
        if (merged && !preClean.startsWith(merged)) {
          // Prepend the heading's trailing words to complete the sentence
          content = `${merged} ${preClean}`.replace(/\s+/g, ' ').trim();
        }
      }

      // Build context path for the entry
      const contextPath = item.context.map(c => c.name).join(' - ');
      
      // Clean up content
      const cleanContent = content
        .replace(/\n\s*\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
      
      // Only add if we have meaningful content
      if (cleanContent.length > 10) {
        entries.push({
          number: item.identifier,
          title: title,
          text: cleanContent,
          type: item.type,
          contextPath: contextPath,
          fullContext: item.context
        });
      }
    });
    
    return entries;
  }

  /**
   * Clean and normalize Act text
   */
  cleanActText(text) {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      // Join hyphenated line breaks like "thirty-\none" -> "thirty-one"
      .replace(/-\s*\n\s*/g, '-')
      // Collapse soft-wrapped lines that break mid-sentence (single newline between non-heading text)
      .replace(/([^\n])\n(?!\s*(BOOK|TITLE|CHAPTER|Article|Section)\b)/g, '$1 ')
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Reduce multiple empty lines to double
      // Remove LawPhil artifacts
      .replace(/\b(?:lawphil|1awphi1|1aшphi1)\b/gi, '') // Remove LawPhil markers
      .replace(/\d+[a-zа-я]phi\d+/gi, '') // Remove other phi artifacts
      .replace(/The Lawphil Project[^]*?Foundation/gi, '') // Remove LawPhil footer
      .replace(/Arellano Law Foundation/gi, '') // Remove foundation name
      .replace(/The LAWPHIL Project/gi, '') // Remove project name
      .replace(/Today is[^]*?2025/gi, '') // Remove date stamps
      .replace(/Enhanced by Google/gi, '') // Remove Google enhancement text
      .replace(/Back to top/gi, '') // Remove navigation text
      .replace(/▲ TOP/gi, '') // Remove top navigation
      .replace(/◄ BACK/gi, '') // Remove back navigation
      .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs but preserve line breaks
      .trim();
  }

  /**
   * Process section content to handle nested section references
   */
  processSectionContent(sectionText, sectionNumber) {
    // Handle cases where a section amends another section and quotes its full text.
    // We should merge the quoted inner section into the same entry, not split it.
    
    // Look for amending sections pattern
    const amendingLeadIn = /(is\s+hereby\s+amended\s+to\s+read\s+as\s+follows:)\s*/i;
    let amendingMatch = sectionText.match(amendingLeadIn);
    
    if (amendingMatch) {
      // Capture any immediately following quoted or block "Section NNN." and its content until the next true heading.
      const quotedPattern = /(“|"|')?\s*Section\s+(\d+[A-Za-z]?)\.?\s*([^\n]*)([\s\S]*)/i;
      const m = sectionText.slice(amendingMatch.index + amendingMatch[0].length).match(quotedPattern);
      if (m) {
        const innerNum = m[2];
        const innerRest = (m[3] + m[4]).trim();
        // Do not create a separate entry; include full inner section text inline
        return sectionText.replace(amendingLeadIn, amendingMatch[0])
          .replace(quotedPattern, `Section ${innerNum}. ${innerRest}`);
      }
    }
    
    // Handle regular sections that might have colons in content
    // Look for section headers with colons and extract title/content properly
    const sectionWithColonPattern = /^Section\s+(\d+[A-Za-z]+)\.?\s*([^:]+):\s*(.*)/;
    const colonMatch = sectionText.match(sectionWithColonPattern);
    
    if (colonMatch) {
      const sectionNum = colonMatch[1];
      const title = colonMatch[2].trim();
      const content = colonMatch[3].trim();
      
      return `Section ${sectionNum}. ${title}: ${content}`;
    }
    
    return sectionText;
  }
}

export default ActsParser;
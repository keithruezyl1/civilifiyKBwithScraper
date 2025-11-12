import OpenAI from 'openai';
import { ENRICHMENT_GUIDELINES, getEnrichmentReminder } from './enrichment-guidelines.js';

let openai = null;

// Initialize OpenAI only if API key is available
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Enrich a KB entry using GPT-4o to fill in missing fields
 * Comprehensive enrichment for all entry and sub-entry types
 * @param {Object} entryData - The entry data to enrich
 * @param {Object} options - Optional parameters
 * @param {number} options.entryIndex - The index of this entry in the batch (0-based)
 * @returns {Object} - Enriched entry data
 */
/**
 * Get appropriate fallback related law based on entry type and subtype
 */
function getRelatedLawsFallback(entryType, entrySubtype, entryData) {
  const cit = String(entryData?.canonical_citation || '').toLowerCase();
  const ttl = String(entryData?.title || '').toLowerCase();
  // Try to get metadata from entryData or from entry_id pattern
  const metadata = entryData?.metadata || {};
  let actNumber = metadata?.actNumber || null;
  
  // If actNumber not in metadata, try to extract from entry_id or canonical_citation
  if (!actNumber) {
    const entryId = String(entryData?.entry_id || '').toUpperCase();
    const actMatch = entryId.match(/ACT-(\d+)-/);
    if (actMatch) {
      actNumber = actMatch[1];
    } else {
      // Try to extract from citation
      const citActMatch = cit.match(/act\s+(?:no\.?\s*)?(\d+)/i);
      if (citActMatch) {
        actNumber = citActMatch[1];
      }
    }
  }
  
  // Constitution entries
  if (entryType === 'constitution_provision') {
    // If already in Article III, use general Constitution
    if (cit.includes('article iii') || cit.includes('article 3') || ttl.includes('article iii') || ttl.includes('article 3')) {
      return {
        citation: '1987 Constitution of the Philippines (General)',
        url: 'https://lawphil.net/consti/cons1987.html'
      };
    }
    // Otherwise, use Article III (Bill of Rights) as fallback
    return {
      citation: '1987 Constitution, Article III - Bill of Rights',
      url: 'https://lawphil.net/consti/cons1987.html'
    };
  }
  
  // Statute entries
  if (entryType === 'statute_section') {
    // Revised Penal Code (Act 3815) - use Bill of Rights
    if (entrySubtype === 'act' && 
        (actNumber === '3815' || actNumber === 3815 || 
         cit.includes('act 3815') || cit.includes('act no. 3815') || 
         cit.includes('revised penal code') || ttl.includes('revised penal code'))) {
      return {
        citation: '1987 Constitution, Article III - Bill of Rights',
        url: 'https://lawphil.net/consti/cons1987.html'
      };
    }
    
    // Other 1930 Acts - use Constitution or Administrative Code based on content
    if (entrySubtype === 'act') {
      // Check if it's administrative/organizational
      if (ttl.includes('administrative') || ttl.includes('supreme court') || 
          ttl.includes('judiciary') || ttl.includes('personnel') || 
          cit.includes('administrative code')) {
        return {
          citation: 'Administrative Code of 1987 (Executive Order 292)',
          url: 'https://lawphil.net/executive/execord/eo1987/eo_292_1987.html'
        };
      }
      // Default to Constitution
      return {
        citation: '1987 Constitution of the Philippines (General)',
        url: 'https://lawphil.net/consti/cons1987.html'
      };
    }
    
    // Commonwealth Acts - use Constitution or Administrative Code
    if (entrySubtype === 'commonwealth_act') {
      // Check if administrative
      if (ttl.includes('administrative') || cit.includes('administrative code')) {
        return {
          citation: 'Administrative Code of 1987 (Executive Order 292)',
          url: 'https://lawphil.net/executive/execord/eo1987/eo_292_1987.html'
        };
      }
      return {
        citation: '1987 Constitution of the Philippines (General)',
        url: 'https://lawphil.net/consti/cons1987.html'
      };
    }
    
    // Republic Acts - use Constitution
    if (entrySubtype === 'republic_act') {
      return {
        citation: '1987 Constitution of the Philippines (General)',
        url: 'https://lawphil.net/consti/cons1987.html'
      };
    }
    
    // Batas Pambansa - use Constitution
    if (entrySubtype === 'mga_batas_pambansa') {
      return {
        citation: '1987 Constitution of the Philippines (General)',
        url: 'https://lawphil.net/consti/cons1987.html'
      };
    }
    
    // Default for other statute types
    return {
      citation: '1987 Constitution of the Philippines (General)',
      url: 'https://lawphil.net/consti/cons1987.html'
    };
  }
  
  // City Ordinance entries
  if (entryType === 'city_ordinance_section') {
    return {
      citation: 'Local Government Code of 1991 (Republic Act 7160)',
      url: 'https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html'
    };
  }
  
  // Rule of Court entries
  if (entryType === 'rule_of_court') {
    // Check if already in judicial/constitutional context
    if (cit.includes('article viii') || cit.includes('article 8') || 
        ttl.includes('article viii') || ttl.includes('article 8')) {
      return {
        citation: 'Rules of Court (General)',
        url: 'https://lawphil.net/courts/rules/rules.html'
      };
    }
    return {
      citation: '1987 Constitution, Article VIII - Judicial Department',
      url: 'https://lawphil.net/consti/cons1987.html'
    };
  }
  
  // Agency Circular entries
  if (entryType === 'agency_circular') {
    // Try to find enabling statute from metadata or use Administrative Code
    const agencyName = metadata?.agency || '';
    if (agencyName) {
      return {
        citation: `Administrative Code of 1987 (Executive Order 292) - ${agencyName}`,
        url: 'https://lawphil.net/executive/execord/eo1987/eo_292_1987.html'
      };
    }
    return {
      citation: 'Administrative Code of 1987 (Executive Order 292)',
      url: 'https://lawphil.net/executive/execord/eo1987/eo_292_1987.html'
    };
  }
  
  // Default fallback for unknown types
  return {
    citation: '1987 Constitution of the Philippines (General)',
    url: 'https://lawphil.net/consti/cons1987.html'
  };
}

export async function enrichEntryWithGPT(entryData, options = {}) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  // Accept both legacy keys (entry_type/entry_subtype) and current keys (type/entry_subtype)
  const {
    title,
    text,
    canonical_citation,
    entry_type: legacyEntryType,
    entry_subtype: legacyEntrySubtype,
    type: currentType,
    entry_subtype: currentSubtype
  } = entryData;

  const effectiveEntryType = legacyEntryType || currentType || 'constitution_provision';
  const effectiveEntrySubtype = legacyEntrySubtype || currentSubtype || null;

  // Get type-specific enrichment instructions
  const typeInstructions = getTypeSpecificInstructions(effectiveEntryType, effectiveEntrySubtype);

  // Add extra reminder if this is entry #21, #41, #61, etc. (every 20 entries)
  const entryIndex = options.entryIndex ?? -1;
  const isReminderInterval = entryIndex >= 0 && (entryIndex + 1) % 20 === 0;
  const intervalReminder = isReminderInterval 
    ? `\n\n🚨 CRITICAL REMINDER - ENTRY #${entryIndex + 1} (Every 20 entries checkpoint):\n` +
      `You are processing entry #${entryIndex + 1} in this batch. This is a CHECKPOINT to ensure you are following ALL enrichment rules.\n` +
      `PLEASE REVIEW AND STRICTLY FOLLOW:\n` +
      `1. TITLE FORMAT: Constitution = "Article X Section Y - [Description]" (X=ROMAN, Y=ARABIC). Statutes = "[Act Type] [Number], Section [Y] - [Description]"\n` +
      `2. NO DUPLICATES in any array fields (tags, rights_callouts, advice_points, jurisprudence, related_laws)\n` +
      `3. REQUIRED ARRAYS (must have at least one item):\n` +
      `   - tags: Minimum 3, provide as many as applicable (NO maximum)\n` +
      `   - rights_callouts: Minimum 1, provide AS MANY AS POSSIBLE (be thorough, list ALL applicable rights)\n` +
      `   - advice_points: Minimum 1, provide AS MANY AS POSSIBLE (be thorough, list ALL applicable guidance)\n` +
      `   - jurisprudence: Minimum 1, target 3+ when applicable (provide ALL applicable citations with case names/G.R. numbers)\n` +
      `   - related_laws: Minimum 1, target 3 (max 3), format "Citation\\nURL" with REAL working LawPhil URLs\n` +
      `4. STATUTE-SPECIFIC FIELDS (elements, penalties, defenses):\n` +
      `   - Provide ONLY if they exist in the text - do NOT fabricate content\n` +
      `   - For penal sections: Extract ALL applicable elements, penalties, defenses if present\n` +
      `   - For non-penal sections: Leave empty [] or null (no penal clause present)\n` +
      `   - If content doesn't exist, leave empty [] or null - accuracy over completeness\n` +
      `5. Citations MUST be SPECIFIC (case names, G.R. numbers, dates, article/section references) - NO generic placeholders\n` +
      `6. Use null (not "NA") for non-applicable string fields\n` +
      `\nDO NOT SKIP OR ABBREVIATE ANY OF THESE REQUIREMENTS. BE THOROUGH AND COMPREHENSIVE. ONLY EXTRACT WHAT EXISTS - DO NOT FABRICATE.\n\n`
    : '';

  // Construct the comprehensive prompt for GPT
  const prompt = `${ENRICHMENT_GUIDELINES}${getEnrichmentReminder()}${intervalReminder}You are a legal expert specializing in Philippine law. Your task is to analyze a legal document entry and provide comprehensive enriched metadata in JSON format.

ENTRY DETAILS:
- Title: ${title}
- Type: ${effectiveEntryType}
- Subtype: ${effectiveEntrySubtype}
- Citation: ${canonical_citation}
- Content: ${text.substring(0, 3000)}${text.length > 3000 ? '...' : ''}

${typeInstructions}

Please provide a JSON response with the following comprehensive fields:
{
  "title": "For constitution entries: Format EXACTLY as 'Article X Section Y - [Description]' where X is ROMAN NUMERAL and Y is ARABIC NUMERAL (e.g., 'Article II Section 3 - Declaration of Principles and State Policies'). If no section, use 'Article X - [Description]' where X is ROMAN NUMERAL. For statutes: 'Act 3817, Section 1 - Property Relief' (for 1930 Acts: if no clear section description, use act short title or first sentence summary)",
  "summary": "A concise 2-3 sentence summary of this legal provision",
  "topics": ["array", "of", "relevant", "legal", "topics"],
  "tags": ["array", "of", "specific", "tags", "MINIMUM 3 TAGS REQUIRED"],
  "jurisdiction": "Philippines",
  "law_family": "constitution|statute|rule_of_court|executive_issuance|judicial_issuance|agency_issuance|lgu_ordinance (for 1930 Acts: set 'Revised Penal Code' ONLY for Act No. 3815; others use domain-specific or null)",
  "effective_date": "YYYY-MM-DD format date when this provision became effective (for 1930 Acts: prefer 'Effective, [date]' pattern, fallback to 'Approved, [date]' pattern; normalize month abbreviations like 'Sept.' → 'September')",
  "amendment_date": "YYYY-MM-DD format date if this provision was amended, otherwise null",
  
  "applicability": "Who this provision applies to",
  "penalties": "Any penalties or consequences mentioned (REQUIRED for penal sections, null/empty for non-penal sections like appropriations/franchises). For statute sections: provide as array of strings",
  "defenses": "Any defenses or exceptions mentioned (REQUIRED for penal sections, null/empty for non-penal sections). For statute sections: provide as array of strings",
  "time_limits": "Any time limits or deadlines mentioned (extract if 'within', 'not later than', 'period of' appear; else 'As provided by law' or null)",
  "required_forms": "Any forms or procedures required (search for 'form', 'application', 'permit'; else 'As required by implementing rules' or null)",
  "related_laws": ["array", "of", "related", "law", "references"],
  "elements": "Key elements or components of this provision (REQUIRED for penal sections, null/empty for non-penal sections). For statute sections: provide as array of strings",
  "prescriptive_period": "Prescriptive period for statute sections (object with 'value' as number or 'NA', and optional 'unit' as 'days'|'months'|'years'|'NA'). Extract if time limits mentioned; else null",
  "standard_of_proof": "Standard of proof required (e.g., 'beyond reasonable doubt', 'preponderance of evidence'). Extract if mentioned; else null",
  "triggers": "What triggers this provision or when it applies",
  "violation_code": "Any violation codes or classifications",
  "violation_name": "Name of violations under this provision",
  "fine_schedule": "Any fines or penalties specified",
  "license_action": "Any licensing actions or requirements",
  "apprehension_flow": "Process for apprehension or enforcement",
  "incident": "What constitutes an incident under this provision",
  "phases": "Any phases or stages in the process",
  "forms": "Required forms or documents",
  "handoff": "Handoff procedures or next steps",
  "rights_callouts": ["array", "of", "constitutional", "rights", "mentioned"],
  "rights_scope": "Scope of rights or protections",
  "advice_points": ["array", "of", "practical", "constitutional", "guidance"],
  "jurisprudence": ["exactly 3 strings, each a citation only (no URL); tolerate both 'v.' and 'vs.'; capture optional parenthetical years"],
  
}

IMPORTANT (STRICT):
- Return ONLY valid JSON, no other text
- Do NOT use quotation marks or curly braces inside string values (no embedded { } or ")
- Do NOT abbreviate: write "Article 1", "Section 3" (never ART1, Sec. 3)
- For constitution entries: ALWAYS provide arrays for tags, rights_callouts, advice_points, jurisprudence, related_laws
- ALL MULTI-ITEM FIELDS MUST contain AT LEAST ONE item (never empty []):
  - tags: AT LEAST 3 TAGS REQUIRED (minimum 3, provide as many as applicable, no maximum)
  - rights_callouts: AT LEAST ONE item required (provide AS MANY AS POSSIBLE - be thorough, list all applicable constitutional rights mentioned)
  - advice_points: AT LEAST ONE item required (provide AS MANY AS POSSIBLE - be thorough, list all applicable practical guidance)
  - jurisprudence: 
    * For pre-1935 Acts (1930s and earlier): OPTIONAL (target ≥1 when available, do NOT force 3+; may return empty [] if none available)
    * For post-1935 Acts: AT LEAST ONE citation required (if applicable, provide 3+ as target/minimum but CAN GO BEYOND 3 - provide ALL applicable SPECIFIC citations with case names/numbers; if not applicable, provide 1 general citation)
  
  - related_laws: Provide 1–3 non-self related laws (minimum 1, maximum 3). Do NOT cite the entry itself. If truly none apply, return an empty array [] (do not fabricate).
  - For statutes: elements, penalties, defenses should be provided ONLY if they exist in the text:
    * Penal sections: Provide elements, penalties, defenses if they exist in the text (keywords: punishable, penalty, fine, imprisonment, prohibited, shall suffer, offense, violation, liable, guilty, convicted, shall be punished, Article [number] for RPC). If none exist, leave empty [] or null
    * Non-penal sections (appropriations, franchises, reliefs, administrative): Should be empty [] or null (no penal clause present)
- IMPORTANT: Only extract what actually exists in the text. Do not fabricate content. If a field has no applicable content, leave empty [] or null.
- CRITICAL: Citations must be SPECIFIC (include case names, G.R. numbers, dates, specific article/section references) - avoid generic placeholders
- For Relations field (related_laws): Provide 1–3 non-self items. Format: "Citation\\nURL" (Citation on first line, REAL WORKING LawPhil URL on second line). NEVER cite the same entry.
  * CRITICAL: Actively identify specific, thematically related laws or constitutional articles/sections
  * Do NOT rely on generic defaults - identify specific related statutes, acts, or constitutional provisions
  * Citations MUST be SPECIFIC: Include full act names, article/section numbers
  * Example: "1987 Constitution, Article III Section 1 - Bill of Rights" or "Republic Act 386, Article 123"
  * NOT: "Constitutional provisions" or "Related laws" or "Applicable laws"
  * URLs MUST be actual, accessible LawPhil URLs:
    - Constitution: https://lawphil.net/consti/cons1987.html
    - Republic Acts: https://lawphil.net/statutes/repacts/ra[NUMBER]/ra[NUMBER].html
    - Commonwealth Acts: https://lawphil.net/statutes/comacts/ca[NUMBER]/ca[NUMBER].html
    - 1930 Acts: https://lawphil.net/statutes/acts/act1930/act_[NUMBER]_1930.html or act[NUMBER]_1930.html (check both underscore formats: act_[NUMBER]_[YEAR].html and act[NUMBER]_[YEAR].html)
    - Other Acts: Use appropriate year folder (e.g., act1931, act1932, etc.)
  * NEVER use placeholders like "LawPhil URL" or "localhost" - only real, working URLs
  * IMPORTANT: "3+" means minimum/target of 3 - provide ALL applicable items, not limited to just 3
  * For statutes: If truly none apply after careful analysis, system will provide Constitution as fallback
- If a field does not apply for string fields, put null (not "NA"); arrays MUST NEVER be empty []
- Use appropriate law_family based on entry_type
- Provide REAL, verifiable citations only; include a working URL (prefer LawPhil) for each citation in related_laws when possible
- Be specific and accurate to Philippine law
- Focus on practical, actionable information`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a legal expert specializing in Philippine law. Provide accurate, specific, and comprehensive analysis of legal documents in JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, factual responses
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const enrichedData = JSON.parse(response.choices[0].message.content);

    // Identify NA tokens strictly (full-string), case-insensitive
    const isNaToken = (v) => {
      if (v === undefined || v === null) return true;
      const s = String(v).trim();
      return /^(?:NA|N\/A|Not\s+Available)$/i.test(s);
    };

    // Helper: normalize and sanitize strings (strip braces/quotes, expand common abbreviations)
    const sanitizeString = (val) => {
      if (val === undefined || val === null) return 'N/A';
      let s = String(val).trim();
      // If the entire value is effectively NA, collapse to single standardized token "N/A"
      if (/^(?:\s*(?:NA|N\/A|Not\s+Available)\s*)+$/i.test(s)) return 'N/A';
      // strip curly braces and double quotes inside values
      s = s.replace(/[{}\"]+/g, '').trim();
      // expand abbreviations (avoid touching normal words like "National")
      s = s
        .replace(/\bART\.?\s*(\d+)\b/gi, 'Article $1')
        .replace(/\bSEC\.?\s*(\d+)\b/gi, 'Section $1')
        .replace(/\bArt\.?\s*(\d+)\b/g, 'Article $1')
        .replace(/\bSec\.?\s*(\d+)\b/g, 'Section $1');
      if (s.length === 0) return 'N/A';
      return s;
    };

    const sanitizeMaybeString = (val) => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') {
        const sanitized = sanitizeString(val);
        return isNaToken(sanitized) ? null : sanitized;
      }
      // If GPT returned an object for a string field, fall back to null
      if (typeof val === 'object') return null;
      const sanitized = sanitizeString(val);
      return isNaToken(sanitized) ? null : sanitized;
    };

    const sanitizeArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      const sanitized = arr
        .map((v) => (typeof v === 'string' ? sanitizeString(v) : v))
        .filter((v) => !isNaToken(v) && v !== null && v !== undefined && String(v).trim() !== '');
      // Remove duplicates
      const seen = new Set();
      return sanitized.filter((v) => {
        const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const sanitizeConstitutionArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      // For constitution fields, be more lenient - only filter out truly empty values
      return arr
        .map((v) => (typeof v === 'string' ? sanitizeString(v) : v))
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    };

    // Collapse repeated NA values in arrays:
    // - If array has only NA values (e.g., ["NA","NA","NA"]) → ["NA"]
    // - If array has real values plus NA, drop NA entries
    // - Remove duplicates to ensure uniqueness
    const collapseNaArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      const items = arr.map((v) => (typeof v === 'string' ? v.trim() : v));
      const hasReal = items.some((v) => typeof v === 'string' ? !isNaToken(v) : true);
      if (!hasReal) {
        return items.length > 0 ? ['N/A'] : [];
      }
      const filtered = items.filter((v) => !(typeof v === 'string' && isNaToken(v)));
      // Remove duplicates: use Set with stringified values for objects, direct comparison for primitives
      const seen = new Set();
      return filtered.filter((v) => {
        const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // For relations fields, if all NA → return empty array (not ["N/A"]) per UI requirement
    // Also remove duplicates to ensure uniqueness
    const collapseNaArrayEmpty = (arr) => {
      if (!Array.isArray(arr)) return [];
      const filtered = arr.filter((v) => !(typeof v === 'string' && isNaToken(v)));
      // Remove duplicates: use Set with stringified values for objects, direct comparison for primitives
      const seen = new Set();
      return filtered.filter((v) => {
        const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Validate and clean the comprehensive response (no nulls/{} for strings)
    return {
      title: sanitizeMaybeString(enrichedData.title),
      summary: sanitizeMaybeString(enrichedData.summary),
      topics: sanitizeArray(enrichedData.topics),
      tags: (() => {
        const arr = sanitizeConstitutionArray(enrichedData.tags);
        // Ensure at least 3 tags - if less than 3, add generic tags based on entry type
        if (arr.length === 0) {
          return effectiveEntryType === 'constitution_provision' 
            ? ['Constitutional Provision', 'Philippine Law', 'Legal Framework']
            : ['Legal Provision', 'Philippine Law', 'Statute'];
        }
        // If less than 3 tags, pad with generic tags
        while (arr.length < 3) {
          if (effectiveEntryType === 'constitution_provision') {
            arr.push('Constitutional Law');
          } else if (effectiveEntryType === 'statute_section') {
            arr.push('Statute');
          } else {
            arr.push('Philippine Law');
          }
        }
        return arr;
      })(),
      jurisdiction: sanitizeMaybeString(enrichedData.jurisdiction) || 'Philippines',
      law_family: sanitizeMaybeString(enrichedData.law_family) || 'constitution',
      effective_date: sanitizeMaybeString(enrichedData.effective_date),
      amendment_date: sanitizeMaybeString(enrichedData.amendment_date),
      
      applicability: sanitizeMaybeString(enrichedData.applicability),
      penalties: (() => {
        // For statutes, penalties should be an array of strings
        if (effectiveEntryType === 'statute_section' || effectiveEntryType === 'city_ordinance_section') {
          // Handle both string and array formats
          if (Array.isArray(enrichedData.penalties)) {
            return sanitizeArray(enrichedData.penalties);
          }
          // If string, convert to array (split by newlines or commas)
          const pen = sanitizeMaybeString(enrichedData.penalties);
          if (pen && pen !== '') {
            return pen.split(/\n|,|;/).map(s => s.trim()).filter(s => s.length > 0);
          }
          // Allow null/empty for non-penal sections (appropriations, franchises, etc.)
          return null;
        }
        return sanitizeMaybeString(enrichedData.penalties);
      })(),
      defenses: (() => {
        // For statutes, defenses should be an array of strings
        if (effectiveEntryType === 'statute_section' || effectiveEntryType === 'city_ordinance_section') {
          // Handle both string and array formats
          if (Array.isArray(enrichedData.defenses)) {
            return sanitizeArray(enrichedData.defenses);
          }
          // If string, convert to array (split by newlines or commas)
          const def = sanitizeMaybeString(enrichedData.defenses);
          if (def && def !== '') {
            return def.split(/\n|,|;/).map(s => s.trim()).filter(s => s.length > 0);
          }
          // Allow null/empty for non-penal sections
          return null;
        }
        return sanitizeMaybeString(enrichedData.defenses);
      })(),
      time_limits: sanitizeMaybeString(enrichedData.time_limits),
      required_forms: sanitizeMaybeString(enrichedData.required_forms),
      related_laws: (() => {
        // Back-compat: accept related_sections if model still returns old key
        const raw = Array.isArray(enrichedData.related_laws)
          ? enrichedData.related_laws
          : (Array.isArray(enrichedData.related_sections) ? enrichedData.related_sections : []);
        const items = collapseNaArrayEmpty(sanitizeConstitutionArray(raw));
        const selfSignals = new Set([
          String(entryData?.canonical_citation || '').toLowerCase(),
          String(entryData?.title || '').toLowerCase(),
          String(entryData?.entry_id || '').toLowerCase()
        ]);
        const notSelf = (val) => {
          const s = String(val || '').toLowerCase();
          // A self-citation if it contains canonical citation, exact title, or entry_id
          return !Array.from(selfSignals).some(sig => sig && s.includes(sig));
        };
        let filtered = items.filter(notSelf);
        
        // Use type/subtype-specific fallback if empty
        if (filtered.length === 0) {
          const fallback = getRelatedLawsFallback(effectiveEntryType, effectiveEntrySubtype, entryData);
          filtered = [`${fallback.citation}\n${fallback.url}`];
        }
        // Enforce maximum of 3 items
        return filtered.slice(0, 3);
      })(),
      elements: (() => {
        // For statutes, elements should be an array of strings
        if (effectiveEntryType === 'statute_section' || effectiveEntryType === 'city_ordinance_section') {
          // Handle both string and array formats
          if (Array.isArray(enrichedData.elements)) {
            return sanitizeArray(enrichedData.elements);
          }
          // If string, convert to array (split by newlines or commas)
          const elem = sanitizeMaybeString(enrichedData.elements);
          if (elem && elem !== '') {
            return elem.split(/\n|,|;/).map(s => s.trim()).filter(s => s.length > 0);
          }
          // Allow null/empty for non-penal sections (appropriations, franchises, etc.)
          return null;
        }
        return sanitizeMaybeString(enrichedData.elements);
      })(),
      prescriptive_period: (() => {
        // For statute sections, prescriptive_period should be an object or null
        if (effectiveEntryType === 'statute_section') {
          if (enrichedData.prescriptive_period && typeof enrichedData.prescriptive_period === 'object') {
            return enrichedData.prescriptive_period;
          }
          return null;
        }
        return null;
      })(),
      standard_of_proof: (() => {
        // For statute sections, standard_of_proof should be a string or null
        if (effectiveEntryType === 'statute_section') {
          return sanitizeMaybeString(enrichedData.standard_of_proof);
        }
        return null;
      })(),
      triggers: sanitizeMaybeString(enrichedData.triggers),
      violation_code: sanitizeMaybeString(enrichedData.violation_code),
      violation_name: sanitizeMaybeString(enrichedData.violation_name),
      fine_schedule: sanitizeMaybeString(enrichedData.fine_schedule),
      license_action: sanitizeMaybeString(enrichedData.license_action),
      apprehension_flow: sanitizeMaybeString(enrichedData.apprehension_flow),
      incident: sanitizeMaybeString(enrichedData.incident),
      phases: sanitizeMaybeString(enrichedData.phases),
      forms: sanitizeMaybeString(enrichedData.forms),
      handoff: sanitizeMaybeString(enrichedData.handoff),
      rights_callouts: (() => {
        const arr = collapseNaArray(sanitizeConstitutionArray(enrichedData.rights_callouts));
        // Ensure at least one item - if empty, add general constitutional rights reference
        if (arr.length === 0 && effectiveEntryType === 'constitution_provision') {
          return ['Constitutional Rights and Protections'];
        }
        return arr;
      })(),
      rights_scope: sanitizeMaybeString(enrichedData.rights_scope),
      advice_points: (() => {
        const arr = collapseNaArray(sanitizeConstitutionArray(enrichedData.advice_points));
        // Ensure at least one item - if empty, add general guidance
        if (arr.length === 0 && effectiveEntryType === 'constitution_provision') {
          return ['Interpret in accordance with constitutional principles and legal precedents'];
        }
        return arr;
      })(),
      jurisprudence: (() => {
        const citations = collapseNaArray(sanitizeConstitutionArray(enrichedData.jurisprudence)).map((v) => {
          if (typeof v !== 'string') return v;
          const lines = v.split('\n').map(s => s.trim()).filter(Boolean);
          // Keep only the citation (first line); drop any URL lines
          return lines[0] || v;
        });
        // Remove duplicates after URL stripping (same citation may have appeared with different URLs)
        const seen = new Set();
        const uniqueCitations = citations.filter((v) => {
          const key = String(v).trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // Ensure at least one citation - if empty, add general legal principle
        if (uniqueCitations.length === 0) {
          return effectiveEntryType === 'constitution_provision' 
            ? ['General principles of constitutional law applicable']
            : ['General legal principles and precedents applicable'];
        }
        return uniqueCitations;
      })(),
      
    };

  } catch (error) {
    console.error('GPT enrichment error:', error);
    throw new Error(`GPT enrichment failed: ${error.message}`);
  }
}

/**
 * Get type-specific enrichment instructions
 */
function getTypeSpecificInstructions(entry_type, entry_subtype) {
  // Handle statute subtypes specifically
  if (entry_type === 'statute_section') {
    const subtypeInstructions = {
      'republic_act': `
REPUBLIC ACT ANALYSIS:
- This is a Republic Act (RA) - a law passed by Congress
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances
- Provide elements array if they exist in the text (extract ALL applicable elements, be thorough). If none exist, leave empty [] or null
- Provide penalties array if they exist in the text (extract ALL applicable penalties, be thorough). If none exist, leave empty [] or null
- Provide defenses array if they exist in the text (extract ALL applicable defenses, be thorough). If none exist, leave empty [] or null
- Tags: MUST contain AT LEAST 3 tags (minimum 3, provide as many as applicable, no maximum)
- Related laws: MUST provide at least ONE non-self item (target 3; max 3). Actively identify specific, thematically related laws or constitutional articles/sections. Do NOT rely on generic defaults. Citations MUST be SPECIFIC with full act names, article/section numbers and REAL working LawPhil URLs. If truly none apply after careful analysis, system will provide Constitution as fallback.
- CRITICAL: Only extract what actually exists in the text - do not fabricate content. Be thorough when content exists, but leave empty if not present.
- Focus on practical enforcement and compliance aspects`,

      'commonwealth_act': `
COMMONWEALTH ACT ANALYSIS:
- This is a Commonwealth Act (CA) - a law from the Commonwealth period
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances
- Provide elements array if they exist in the text (extract ALL applicable elements, be thorough). If none exist, leave empty [] or null
- Provide penalties array if they exist in the text (extract ALL applicable penalties, be thorough). If none exist, leave empty [] or null
- Provide defenses array if they exist in the text (extract ALL applicable defenses, be thorough). If none exist, leave empty [] or null
- Tags: MUST contain AT LEAST 3 tags (minimum 3, provide as many as applicable, no maximum)
- CRITICAL: Only extract what actually exists in the text - do not fabricate content. Be thorough when content exists, but leave empty if not present.
- Consider historical context and current applicability`,

      'mga_batas_pambansa': `
MGA BATAS PAMBANSA ANALYSIS:
- This is a Batas Pambansa (BP) - a law from the Marcos era
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances
- Provide elements array if they exist in the text (extract ALL applicable elements, be thorough). If none exist, leave empty [] or null
- Provide penalties array if they exist in the text (extract ALL applicable penalties, be thorough). If none exist, leave empty [] or null
- Provide defenses array if they exist in the text (extract ALL applicable defenses, be thorough). If none exist, leave empty [] or null
- Tags: MUST contain AT LEAST 3 tags (minimum 3, provide as many as applicable, no maximum)
- CRITICAL: Only extract what actually exists in the text - do not fabricate content. Be thorough when content exists, but leave empty if not present.
- Consider historical context and current applicability`,

      'act': `
GENERAL ACT ANALYSIS (1930 Acts and earlier):
- This is a general Act - a law passed by the legislature (pre-Commonwealth period)
- CRITICAL: Determine if this is a PENAL section or NON-PENAL section:
  * PENAL sections (provide elements, penalties, defenses if they exist):
    - Contains prohibitory verbs: "punishable", "penalty", "fine", "imprisonment", "prohibited", "shall suffer", "offense", "violation", "liable", "guilty", "convicted", "shall be punished"
    - Is within Revised Penal Code (Act No. 3815) - check for "Article [number]" references
    - Defines criminal acts or violations
    - Provide elements array if they exist in the text (extract ALL applicable elements, be thorough). If none exist, leave empty [] or null
    - Provide penalties array if they exist in the text (extract ALL applicable penalties, be thorough). If none exist, leave empty [] or null
    - Provide defenses array if they exist in the text (extract ALL applicable defenses, be thorough). If none exist, leave empty [] or null
  * NON-PENAL sections (elements/penalties/defenses should be empty):
    - Appropriations, franchises, reliefs, street renamings, codifications
    - Administrative acts, civil service provisions, organizational acts
    - Type inference keywords for categorization:
      * Appropriations: "Appropriating", "Public Works", "appropriation", "budget"
      * Franchise: "Franchise", "granted to", "franchisee", "concession"
      * Relief/Administrative: "Relieving", "changing name", "relief", "administrative"
      * Codification: "Amending", "codifying", "codification", "revision"
    - If no penal clause present, set elements/penalties/defenses to empty [] or null
    - Add type_notes: "no penal clause present" if applicable
- Effective date extraction:
  * Prefer "Effective, [date]" pattern if present
  * Fallback to "Approved, [date]" pattern if "Effective" not found
  * Convert to YYYY-MM-DD format
  * Normalize ambiguous month abbreviations: "Sept." → "September", "Dec." → "December", "Jan." → "January", "Feb." → "February", "Mar." → "March", "Apr." → "April", "Jun." → "June", "Jul." → "July", "Aug." → "August", "Oct." → "October", "Nov." → "November"
  * Regex should capture both "Effective," and "Approved," patterns (case-insensitive)
- Title format: "Act [Number], Section [Y] - [Description]"
  * If no clear section description, use act short title or first sentence summary
- Law family assignment:
  * Set law_family = "Revised Penal Code" ONLY for Act No. 3815
  * For other acts: Use domain-specific law_family (e.g., "Appropriations", "Franchise") or null
- Jurisprudence: OPTIONAL for pre-1935 acts (target ≥1 when available, do NOT force 3+)
- Related laws: MUST provide at least ONE non-self item (target 3; max 3). Actively identify specific, thematically related laws or constitutional articles/sections. Do NOT rely on generic defaults. Citations MUST be SPECIFIC with full act names, article/section numbers and REAL working LawPhil URLs. Accept both Commonwealth Act URLs and Act URLs:
  * CA: https://lawphil.net/statutes/comacts/ca[number]/ca[number].html
  * Act: https://lawphil.net/statutes/acts/act[year]/act_[number]_[year].html or act[number]_[year].html (check both underscore formats)
  * For Revised Penal Code (Act 3815): Prefer Constitution Article III (Bill of Rights) as related law
  * For other Acts: Prefer Constitution or related statutes in the same domain
  * If truly none apply after careful analysis, system will provide Constitution as fallback
- Tags: MUST contain AT LEAST 3 tags (minimum 3, provide as many as applicable, no maximum)
- Jurisprudence case pattern: Tolerate both "v." and "vs."; capture optional parenthetical years (e.g., "Tañada v. Angara" or "Tañada vs. Angara (1997)")
- CRITICAL: Only extract what actually exists in the text - do not fabricate content. Be thorough when content exists (extract ALL applicable elements, penalties, and defenses), but leave empty [] or null if not present.
- Focus on practical enforcement and compliance aspects`
    };
    
    return subtypeInstructions[entry_subtype] || subtypeInstructions['act'];
  }
  const instructions = {
    'constitution_provision': `
CONSTITUTION PROVISION ANALYSIS (PHILIPPINE CONSTITUTION):
- CRITICAL: Title format MUST be "Article X Section Y - [Description]" (e.g., "Article II Section 3 - Declaration of Principles and State Policies")
  - If the entry has a section number, use "Article X Section Y - [Description]"
  - If no section number, use "Article X - [Description]"
  - Article numbers MUST use ROMAN NUMERALS (I, II, III, IV, V, etc.)
  - Section numbers MUST use ARABIC NUMERALS (1, 2, 3, 4, 5, etc.)
- Analyze this constitutional provision and provide comprehensive metadata
- ALWAYS provide arrays of strings for these fields (MUST contain AT LEAST ONE item each, never empty []):
  - tags: MUST contain AT LEAST ONE tag (provide as many as applicable, no maximum). Examples: "Civilian Supremacy", "Military", "State Policy", etc.
  - rights_callouts: MUST contain AT LEAST ONE item (provide AS MANY AS POSSIBLE - be thorough and list all applicable constitutional rights mentioned)
  - advice_points: MUST contain AT LEAST ONE item (provide AS MANY AS POSSIBLE - be thorough and list all applicable practical guidance on constitutional interpretation)
  - jurisprudence: MUST contain AT LEAST ONE citation (citations only, no URLs). If applicable, provide 3+ as target/minimum but CAN GO BEYOND 3 - provide ALL applicable SPECIFIC citations with full case names, G.R. numbers, and dates. If no specific jurisprudence exists, provide 1 general constitutional/legal principle citation.
  - legal_bases: MUST contain AT LEAST ONE item. Each as "Citation\nURL" (URL must be REAL, WORKING LawPhil URL - never placeholders like "LawPhil URL" or localhost). If applicable, provide 3+ as target/minimum but CAN GO BEYOND 3 - provide ALL applicable SPECIFIC items with proper citations (full act names, article/section numbers). If not applicable, provide 1 SPECIFIC general/connected legal basis.
  - related_laws: Provide 1–3 non-self items. Each as "Citation\nURL" (URL must be REAL, WORKING LawPhil URL - never placeholders like "LawPhil URL" or localhost).
    IMPORTANT: Actively identify specific, thematically related laws or constitutional articles/sections. Do NOT rely on generic defaults.
    Only if absolutely none apply after careful analysis, return an empty array [].
  - IMPORTANT: "3+" means target/minimum of 3 - provide ALL applicable items, NO maximum limit; do not fabricate when none apply
- For non-constitutional fields, use null (not "NA") if not applicable:
  - penalties, defenses, time_limits, required_forms, elements, triggers
  - violation_code, violation_name, fine_schedule, license_action
  - apprehension_flow, incident, phases, forms, handoff
- Set jurisdiction to "Philippines"
- For 1987 Constitution, set effective_date to "1987-02-02"`,

    'statute_section': `
STATUTE SECTION ANALYSIS:
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances
- ALWAYS provide elements array for criminal/prohibited acts
- ALWAYS provide penalties array for violations
- ALWAYS provide defenses array for legal defenses
- Focus on practical enforcement and compliance aspects`,

    'rule_of_court_provision': `
RULE OF COURT ANALYSIS:
- Focus on procedural requirements and court processes
- Identify filing requirements, deadlines, and procedural steps
- Look for evidentiary standards, burden of proof, and procedural safeguards
- Note any forms, documents, or procedural requirements
- Identify any sanctions or consequences for non-compliance`,

    'executive_issuance': `
EXECUTIVE ISSUANCE ANALYSIS:
- Focus on administrative policies, procedures, and regulations
- Identify implementing rules, guidelines, and administrative requirements
- Look for agency powers, responsibilities, and enforcement mechanisms
- Note any reporting requirements, compliance procedures, or administrative processes
- Identify any penalties, sanctions, or administrative remedies`,

    'judicial_issuance': `
JUDICIAL ISSUANCE ANALYSIS:
- Focus on court procedures, evidentiary rules, and judicial processes
- Identify case management procedures, filing requirements, and deadlines
- Look for standards of review, burden of proof, and procedural safeguards
- Note any forms, documents, or procedural requirements
- Identify any sanctions, contempt powers, or judicial remedies`,

    'agency_issuance': `
AGENCY ISSUANCE ANALYSIS:
- Focus on regulatory requirements, compliance procedures, and enforcement
- Identify licensing requirements, permits, and regulatory approvals
- Look for inspection procedures, compliance monitoring, and enforcement actions
- Note any reporting requirements, record-keeping, or administrative procedures
- Identify any penalties, fines, or regulatory sanctions`,

    'lgu_ordinance': `
LGU ORDINANCE ANALYSIS:
- Focus on local government powers, local regulations, and municipal requirements
- Identify local licensing, permits, and local compliance requirements
- Look for local enforcement mechanisms, local penalties, and municipal procedures
- Note any local forms, local requirements, or municipal processes
- Identify any local exemptions, local defenses, or municipal remedies`
  };

  return instructions[entry_type] || instructions['constitution_provision'];
}

/**
 * Check if GPT service is available
 * @returns {boolean}
 */
export function isGPTAvailable() {
  return openai !== null;
}

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
 * @returns {Object} - Enriched entry data
 */
export async function enrichEntryWithGPT(entryData) {
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

  // Construct the comprehensive prompt for GPT
  const prompt = `${ENRICHMENT_GUIDELINES}${getEnrichmentReminder()}You are a legal expert specializing in Philippine law. Your task is to analyze a legal document entry and provide comprehensive enriched metadata in JSON format.

ENTRY DETAILS:
- Title: ${title}
- Type: ${effectiveEntryType}
- Subtype: ${effectiveEntrySubtype}
- Citation: ${canonical_citation}
- Content: ${text.substring(0, 3000)}${text.length > 3000 ? '...' : ''}

${typeInstructions}

Please provide a JSON response with the following comprehensive fields:
{
  "title": "For constitution entries: Format EXACTLY as 'Article X Section Y - [Description]' where X is ROMAN NUMERAL and Y is ARABIC NUMERAL (e.g., 'Article II Section 3 - Declaration of Principles and State Policies'). If no section, use 'Article X - [Description]' where X is ROMAN NUMERAL. For statutes: 'Act 3817, Section 1 - Property Relief'",
  "summary": "A concise 2-3 sentence summary of this legal provision",
  "topics": ["array", "of", "relevant", "legal", "topics"],
  "tags": ["array", "of", "specific", "tags"],
  "jurisdiction": "Philippines",
  "law_family": "constitution|statute|rule_of_court|executive_issuance|judicial_issuance|agency_issuance|lgu_ordinance",
  "effective_date": "YYYY-MM-DD format date when this provision became effective",
  "amendment_date": "YYYY-MM-DD format date if this provision was amended, otherwise null",
  
  "applicability": "Who this provision applies to",
  "penalties": "Any penalties or consequences mentioned",
  "defenses": "Any defenses or exceptions mentioned",
  "time_limits": "Any time limits or deadlines mentioned",
  "required_forms": "Any forms or procedures required",
  "related_laws": ["array", "of", "related", "law", "references"],
  "elements": "Key elements or components of this provision",
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
  "jurisprudence": ["exactly 3 strings, each a citation only (no URL)"],
  
}

IMPORTANT (STRICT):
- Return ONLY valid JSON, no other text
- Do NOT use quotation marks or curly braces inside string values (no embedded { } or ")
- Do NOT abbreviate: write "Article 1", "Section 3" (never ART1, Sec. 3)
- For constitution entries: ALWAYS provide arrays for tags, rights_callouts, advice_points, jurisprudence, related_laws
- ALL MULTI-ITEM FIELDS MUST contain AT LEAST ONE item (never empty []):
  - tags: AT LEAST ONE tag required (provide as many as applicable, no maximum)
  - rights_callouts: AT LEAST ONE item required (provide AS MANY AS POSSIBLE - be thorough, list all applicable constitutional rights mentioned)
  - advice_points: AT LEAST ONE item required (provide AS MANY AS POSSIBLE - be thorough, list all applicable practical guidance)
  - jurisprudence: AT LEAST ONE citation required (if applicable, provide 3+ as target/minimum but CAN GO BEYOND 3 - provide ALL applicable SPECIFIC citations with case names/numbers; if not applicable, provide 1 general citation)
  
  - related_laws: Provide 1–3 non-self related laws (minimum 1, maximum 3). Do NOT cite the entry itself. If truly none apply, return an empty array [] (do not fabricate).
  - For statutes: elements, penalties, defenses MUST contain AT LEAST ONE item each (provide as many as applicable)
- IMPORTANT: Provide as many items as applicable/possible. Only provide ONE item if the field truly has no specific entries - then use a general/principle-based/connected item. Never return empty []
- CRITICAL: Citations must be SPECIFIC (include case names, G.R. numbers, dates, specific article/section references) - avoid generic placeholders
- For Relations field (related_laws): Provide 1–3 non-self items. Format: "Citation\\nURL" (Citation on first line, REAL WORKING LawPhil URL on second line). NEVER cite the same entry.
  * URLs MUST be actual, accessible LawPhil URLs (e.g., "https://lawphil.net/consti/cons1987.html")
  * NEVER use placeholders like "LawPhil URL" or "localhost" - only real, working URLs
  * Verify URL format: Constitution → /consti/cons1987.html, RA → /statutes/repacts/ra[NUMBER]/ra[NUMBER].html
  * IMPORTANT: "3+" means minimum/target of 3 - provide ALL applicable items, not limited to just 3
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
        // Ensure at least one tag - if empty, add a general tag based on entry type
        if (arr.length === 0) {
          return effectiveEntryType === 'constitution_provision' ? ['Constitutional Provision'] : ['Legal Provision'];
        }
        return arr;
      })(),
      jurisdiction: sanitizeMaybeString(enrichedData.jurisdiction) || 'Philippines',
      law_family: sanitizeMaybeString(enrichedData.law_family) || 'constitution',
      effective_date: sanitizeMaybeString(enrichedData.effective_date),
      amendment_date: sanitizeMaybeString(enrichedData.amendment_date),
      
      applicability: sanitizeMaybeString(enrichedData.applicability),
      penalties: (() => {
        // For statutes, ensure penalties is never null/empty
        if (effectiveEntryType === 'statute_section' || effectiveEntryType === 'city_ordinance_section') {
          const pen = sanitizeMaybeString(enrichedData.penalties);
          return pen || 'As provided by law';
        }
        return sanitizeMaybeString(enrichedData.penalties);
      })(),
      defenses: (() => {
        // For statutes, ensure defenses is never null/empty
        if (effectiveEntryType === 'statute_section' || effectiveEntryType === 'city_ordinance_section') {
          const def = sanitizeMaybeString(enrichedData.defenses);
          return def || 'As provided by law and applicable legal defenses';
        }
        return sanitizeMaybeString(enrichedData.defenses);
      })(),
      time_limits: sanitizeMaybeString(enrichedData.time_limits),
      required_forms: sanitizeMaybeString(enrichedData.required_forms),
      related_laws: (() => {
        // Do NOT auto-fallback. Require GPT to provide at least one when applicable.
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
        // Heuristic fallback: if empty, synthesize 1 non-self related law
        if (filtered.length === 0) {
          // Try to infer from canonical citation or title
          const cit = String(entryData?.canonical_citation || '').toLowerCase();
          const ttl = String(entryData?.title || '').toLowerCase();
          let citation = '';
          let url = 'https://lawphil.net';
          if (cit.includes('article') || ttl.includes('article')) {
            // Default to Bill of Rights as a generally related law
            citation = '1987 Constitution, Article III - Bill of Rights';
            url = 'https://lawphil.net/consti/cons1987.html';
          } else {
            // Generic constitution root as last resort
            citation = '1987 Constitution of the Philippines (General)';
            url = 'https://lawphil.net/consti/cons1987.html';
          }
          filtered = [`${citation}\n${url}`];
        }
        // Enforce maximum of 3 items
        return filtered.slice(0, 3);
      })(),
      elements: (() => {
        // For statutes, ensure elements is never null/empty
        if (effectiveEntryType === 'statute_section' || effectiveEntryType === 'city_ordinance_section') {
          const elem = sanitizeMaybeString(enrichedData.elements);
          return elem || 'As provided by law and applicable legal principles';
        }
        return sanitizeMaybeString(enrichedData.elements);
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
- ALWAYS provide elements array for criminal/prohibited acts
- ALWAYS provide penalties array for violations
- ALWAYS provide defenses array for legal defenses
- Focus on practical enforcement and compliance aspects`,

      'commonwealth_act': `
COMMONWEALTH ACT ANALYSIS:
- This is a Commonwealth Act (CA) - a law from the Commonwealth period
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances
- ALWAYS provide elements array for criminal/prohibited acts
- ALWAYS provide penalties array for violations
- ALWAYS provide defenses array for legal defenses
- Consider historical context and current applicability`,

      'mga_batas_pambansa': `
MGA BATAS PAMBANSA ANALYSIS:
- This is a Batas Pambansa (BP) - a law from the Marcos era
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances
- ALWAYS provide elements array for criminal/prohibited acts
- ALWAYS provide penalties array for violations
- ALWAYS provide defenses array for legal defenses
- Consider historical context and current applicability`,

      'act': `
GENERAL ACT ANALYSIS:
- This is a general Act - a law passed by the legislature
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances
- ALWAYS provide elements array for criminal/prohibited acts
- ALWAYS provide penalties array for violations
- ALWAYS provide defenses array for legal defenses
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

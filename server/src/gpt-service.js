import OpenAI from 'openai';

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

  const { title, text, canonical_citation, entry_type, entry_subtype } = entryData;

  // Get type-specific enrichment instructions
  const typeInstructions = getTypeSpecificInstructions(entry_type, entry_subtype);

  // Construct the comprehensive prompt for GPT
  const prompt = `You are a legal expert specializing in Philippine law. Your task is to analyze a legal document entry and provide comprehensive enriched metadata in JSON format.

ENTRY DETAILS:
- Title: ${title}
- Type: ${entry_type}
- Subtype: ${entry_subtype}
- Citation: ${canonical_citation}
- Content: ${text.substring(0, 3000)}${text.length > 3000 ? '...' : ''}

${typeInstructions}

Please provide a JSON response with the following comprehensive fields:
{
  "summary": "A concise 2-3 sentence summary of this legal provision",
  "topics": ["array", "of", "relevant", "legal", "topics"],
  "tags": ["array", "of", "specific", "tags"],
  "jurisdiction": "Philippines",
  "law_family": "constitution|statute|rule_of_court|executive_issuance|judicial_issuance|agency_issuance|lgu_ordinance",
  "key_concepts": ["array", "of", "key", "legal", "concepts"],
  "applicability": "Who this provision applies to",
  "penalties": "Any penalties or consequences mentioned",
  "defenses": "Any defenses or exceptions mentioned",
  "time_limits": "Any time limits or deadlines mentioned",
  "required_forms": "Any forms or procedures required",
  "related_sections": ["array", "of", "related", "section", "references"],
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
  "rights_callouts": "Important rights or protections mentioned",
  "rights_scope": "Scope of rights or protections",
  "advice_points": "Key advice or guidance points",
  "jurisprudence": "Relevant case law or precedents",
  "legal_bases": "Legal foundations or authorities"
}

IMPORTANT (STRICT):
- Return ONLY valid JSON, no other text
- Do NOT use quotation marks or curly braces inside string values (no embedded { } or ")
- Do NOT abbreviate: write "Article 1", "Section 3" (never ART1, Sec. 3)
- If a field does not apply, put the literal string "NA" (not null) for string fields; arrays may be empty []
- Use appropriate law_family based on entry_type
- Provide REAL, verifiable citations only; include a working URL (prefer LawPhil) for each citation in legal_bases/jurisprudence when possible
- Be specific and accurate to Philippine law
- Focus on practical, actionable information`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
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

    // Helper: normalize and sanitize strings (strip braces/quotes, expand common abbreviations)
    const sanitizeString = (val) => {
      if (val === undefined || val === null) return 'NA';
      let s = String(val);
      // strip curly braces and double quotes inside values
      s = s.replace(/[{}\"]+/g, '').trim();
      // expand abbreviations
      s = s
        .replace(/\bART\.?\s*(\d+)\b/gi, 'Article $1')
        .replace(/\bSEC\.?\s*(\d+)\b/gi, 'Section $1')
        .replace(/\bArt\.?\s*(\d+)\b/g, 'Article $1')
        .replace(/\bSec\.?\s*(\d+)\b/g, 'Section $1');
      if (s.length === 0) return 'NA';
      return s;
    };

    const sanitizeMaybeString = (val) => {
      if (val === undefined || val === null) return 'NA';
      if (typeof val === 'string') return sanitizeString(val);
      // If GPT returned an object for a string field, fall back to NA
      if (typeof val === 'object') return 'NA';
      return sanitizeString(val);
    };

    const sanitizeArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((v) => (typeof v === 'string' ? sanitizeString(v) : v))
        .filter((v) => v !== 'NA' && v !== null && v !== undefined && String(v).trim() !== '');
    };

    // Validate and clean the comprehensive response (no nulls/{} for strings)
    return {
      summary: sanitizeMaybeString(enrichedData.summary),
      topics: sanitizeArray(enrichedData.topics),
      tags: sanitizeArray(enrichedData.tags),
      jurisdiction: sanitizeMaybeString(enrichedData.jurisdiction) || 'Philippines',
      law_family: sanitizeMaybeString(enrichedData.law_family) || 'constitution',
      key_concepts: sanitizeArray(enrichedData.key_concepts),
      applicability: sanitizeMaybeString(enrichedData.applicability),
      penalties: sanitizeMaybeString(enrichedData.penalties),
      defenses: sanitizeMaybeString(enrichedData.defenses),
      time_limits: sanitizeMaybeString(enrichedData.time_limits),
      required_forms: sanitizeMaybeString(enrichedData.required_forms),
      related_sections: sanitizeArray(enrichedData.related_sections),
      elements: sanitizeMaybeString(enrichedData.elements),
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
      rights_callouts: sanitizeMaybeString(enrichedData.rights_callouts),
      rights_scope: sanitizeMaybeString(enrichedData.rights_scope),
      advice_points: sanitizeMaybeString(enrichedData.advice_points),
      jurisprudence: sanitizeMaybeString(enrichedData.jurisprudence),
      legal_bases: sanitizeMaybeString(enrichedData.legal_bases)
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
  const instructions = {
    'constitution_provision': `
CONSTITUTION PROVISION ANALYSIS:
- Focus on constitutional principles, rights, and governmental structure
- Identify fundamental rights, state policies, and institutional frameworks
- Look for separation of powers, checks and balances, and democratic principles
- Note any procedural requirements for constitutional amendments
- Identify any transitional or temporary provisions`,

    'statute_section': `
STATUTE SECTION ANALYSIS:
- Focus on specific legal requirements, procedures, and obligations
- Identify who is subject to the law and what actions are required/prohibited
- Look for penalties, enforcement mechanisms, and compliance requirements
- Note any deadlines, time limits, or procedural steps
- Identify any exemptions, defenses, or special circumstances`,

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

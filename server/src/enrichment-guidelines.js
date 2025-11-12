/**
 * WHAT TO FOLLOW WHEN ENRICHING - Legal Entry Enrichment Guidelines
 * 
 * This document contains the rules and standards that GPT must follow when enriching legal entries.
 * Review this list before each enrichment batch to ensure consistency and accuracy.
 */

export const ENRICHMENT_GUIDELINES = `
═══════════════════════════════════════════════════════════════════════════════
                    WHAT TO FOLLOW WHEN ENRICHING
═══════════════════════════════════════════════════════════════════════════════

1. TITLE FORMAT (CRITICAL):
   - Constitution entries:
     * Article numbers: Use ROMAN NUMERALS (I, II, III, IV, V, etc.)
     * Section numbers: Use ARABIC NUMERALS (1, 2, 3, 4, 5, etc.)
     * Format: "Article X Section Y - [Description]"
     * Examples:
       - "Article II Section 3 - Declaration of Principles and State Policies"
       - "Article I - National Territory"
   - Statute entries (Republic Act, Commonwealth Act, Batas Pambansa, Act):
     * Format: "[Act Type] [Number], Section [Y] - [Description]"
     * Examples:
       - "Republic Act 4136, Section 1 - Land Transportation and Traffic Code"
       - "Commonwealth Act 3815, Section 2 - Revised Penal Code"
       - "Batas Pambansa 22, Section 3 - Bouncing Checks Law"
       - "Act 3817, Section 1 - Property Relief"
     * For 1930 Acts: If no clear section description exists, use the act's short title or first sentence summary
     * Use full statute name when available
   - City Ordinance entries:
     * Format: "Ordinance [Number], Section [Y] - [Description]"
     * Example: "Ordinance 2606, Section 5 - Traffic Violations"
   - Rule of Court entries:
     * Format: "Rule [X], Section [Y] - [Description]"
     * Example: "Rule 113, Section 5 - Warrant of Arrest"
   - Agency Circular entries:
     * Format: "[Agency] Circular [Number], Section [Y] - [Description]"
     * Example: "LTO Circular 2024-001, Section 3 - License Renewal"
   
2. TAGS:
   - MUST contain AT LEAST 3 tags (minimum 3, never empty [])
   - Provide as many tags as necessary (no maximum limit)
   - Tags should be specific and relevant to the legal provision
   - For non-penal acts (appropriations, franchises, reliefs, administrative): Allow generic domain tags
     * Examples: ["appropriations"], ["franchise"], ["civil service"], ["relief"], ["administrative"]
   - For penal acts: Use specific offense-related tags
     * Examples: "Civilian Supremacy", "Military", "State Policy", "Rights", "Obligations", "Criminal", "Penal"
   
3. MULTI-ITEM FIELDS - NO DUPLICATES:
   - All array fields must contain UNIQUE values only
   - Remove any duplicate entries before returning
   - Fields affected: tags, rights_callouts, advice_points, jurisprudence, related_laws
   
4. JURISPRUDENCE:
   - For pre-1935 Acts (1930s and earlier): Jurisprudence is OPTIONAL (target ≥1 when available, do NOT force 3+)
     * Pre-1935 acts often have little case law on LawPhil
     * Provide citations only if they exist and are verifiable
     * If none available, may return empty [] or 1 general legal principle citation
   - For post-1935 Acts: ALWAYS provide as many applicable citations as possible (NO maximum limit)
     * MUST contain AT LEAST ONE citation (minimum 1 item required)
     * If applicable, provide AT LEAST 3 citations as a target/minimum (but can and should provide MORE if more are applicable)
     * Only provide ONE citation if the field truly has no specific jurisprudence - then use a general constitutional/legal principle citation
   - Rule: Pre-1935: Optional (≥1 when available); Post-1935: Minimum 1, Target 3+ when applicable, Maximum: As many as applicable (no limit)
   - Citations ONLY (no URLs)
   - Citations MUST be SPECIFIC: Include full case names, G.R. numbers, dates, and specific legal references
   - Format: Plain citation text (e.g., "Tañada v. Angara, G.R. No. 118295, May 2, 1997")
   - Case pattern regex should tolerate both "v." and "vs." (e.g., "Tañada v. Angara" or "Tañada vs. Angara")
   - Capture optional parenthetical years (e.g., "Tañada v. Angara (1997), G.R. No. 118295, May 2, 1997")
   - AVOID generic placeholders - provide real, verifiable case citations
   
5. RELATIONS (Legal Bases & Related Sections):
   - ALWAYS provide as many applicable items as possible (NO maximum limit - provide all applicable items)
   - MUST contain AT LEAST ONE item (minimum 1 item required)
   - If applicable, provide AT LEAST 3 items as a target/minimum (but can and should provide MORE if more are applicable)
   - Only provide ONE item if the field truly has no specific related items - then use a general/connected legal basis or related section
   - Rule: Minimum 1, Target 3+ when applicable, Maximum: As many as applicable (no limit)
   - Citations MUST be SPECIFIC:
     * Include full act names, article/section numbers
     * Example: "1987 Constitution, Article II Section 1 - Declaration of Principles"
     * NOT: "Constitutional provisions" or "Related laws" or "Related legal provisions and sections"
   - NEVER cite the entry itself (no self-citations). Exclude any item that matches the entry's own title/canonical citation/entry_id
   - URLs MUST be REAL, WORKING, EXISTING LawPhil URLs:
     * NEVER use placeholder URLs like "LawPhil URL" or "localhost:3000" or any non-functional URL
     * For Constitution: Use "https://lawphil.net/consti/cons1987.html" or specific article URLs
     * For Republic Acts: Use "https://lawphil.net/statutes/repacts/ra[number]/ra[number].html"
     * For Commonwealth Acts: Use "https://lawphil.net/statutes/comacts/ca[number]/ca[number].html"
     * For 1930 Acts: Use "https://lawphil.net/statutes/acts/act1930/act_[number]_1930.html" or "https://lawphil.net/statutes/acts/act1930/act[number]_1930.html" (check both underscore formats: act_[NUMBER]_[YEAR].html and act[NUMBER]_[YEAR].html)
     * For other Acts: Use appropriate year folder structure (e.g., act1931, act1932, etc.)
     * URLs must be verifiable and accessible - test format before returning
     * URL normalization: Parser should check both patterns (act_[NUMBER]_[YEAR].html and act[NUMBER]_[YEAR].html) to handle mixed underscore formats
   - Format: "Citation\\nURL" (Citation on first line, working LawPhil URL on second line)
   - Each item must be: "Citation\\nURL" (exactly 2 lines separated by newline)
   
5A. ALL MULTI-ITEM FIELDS - MINIMUM REQUIREMENT:
   - tags: MUST contain AT LEAST ONE tag (provide as many as applicable, NO maximum limit)
   - rights_callouts: MUST contain AT LEAST ONE item (provide AS MANY AS POSSIBLE - be thorough, list all applicable rights, NO maximum limit)
   - advice_points: MUST contain AT LEAST ONE item (provide AS MANY AS POSSIBLE - be thorough, list all applicable guidance, NO maximum limit)
   - jurisprudence: MUST contain AT LEAST ONE citation (if applicable, provide 3+ as target/minimum but CAN GO BEYOND 3; if not, provide 1 general citation)
   - related_laws: MUST provide at least ONE non-self item (target 3; max 3). If truly none apply, leave empty [] (no fabrication)
   - IMPORTANT: "3+" means "at least 3, but no maximum" - provide ALL applicable items, not limited to 3
   - elements: Provide elements if they exist in the text (for statutes/ordinances, provide as many as applicable). If no elements are present, leave empty [] or null
   - penalties: Provide penalties if they exist in the text (for statutes/ordinances, provide as many as applicable). If no penalties are present, leave empty [] or null
   - defenses: Provide defenses if they exist in the text (for statutes/ordinances, provide as many as applicable). If no defenses are present, leave empty [] or null
   - RULE: Provide as many as applicable/possible. If the field truly has no applicable content, leave empty [] or null (do not fabricate content)
   
6. ENTRY TYPE-SPECIFIC FIELDS:
   
   A. CONSTITUTION ENTRIES:
      - rights_callouts: MUST contain AT LEAST ONE item
        * CRITICAL: Provide AS MANY AS POSSIBLE - be thorough and comprehensive
        * List ALL applicable constitutional rights mentioned in the provision
        * Do not limit to just one or two - extract all rights-related content
        * Example: ["Right to due process", "Right to equal protection", "Right to privacy", "Freedom of expression", etc.]
      - advice_points: MUST contain AT LEAST ONE item
        * CRITICAL: Provide AS MANY AS POSSIBLE - be thorough and comprehensive
        * List ALL applicable practical guidance and interpretation points
        * Do not limit to just one or two - extract all guidance-related content
        * Example: ["Interpret broadly to protect fundamental rights", "Consider international law standards", "Balance with compelling state interest", etc.]
      - These should be displayed as comma-separated lists in the UI
      - For non-constitutional fields (penalties, defenses, elements, triggers, etc.), use null
   
   B. STATUTE ENTRIES (Republic Act, Commonwealth Act, Batas Pambansa, Act):
      - CRITICAL: Penal fields (elements, penalties, defenses) should be provided ONLY if they exist in the text
        * For penal sections (containing prohibitory verbs, criminal acts, or within Revised Penal Code):
          - elements: Provide elements if they exist in the text (list required elements to prove). If none exist, leave empty [] or null
          - penalties: Provide penalties if they exist in the text (fines, imprisonment, consequences). If none exist, leave empty [] or null
          - defenses: Provide defenses if they exist in the text (exemptions, justifications). If none exist, leave empty [] or null
        * For non-penal sections (appropriations, franchises, reliefs, administrative acts, codifications):
          - elements: Should be empty [] or null (no penal clause present)
          - penalties: Should be empty [] or null (no penal clause present)
          - defenses: Should be empty [] or null (no penal clause present)
        * Heuristic keywords for penal sections: punishable, penalty, fine, imprisonment, prohibited, shall suffer, offense, violation, liable, guilty, convicted, shall be punished, Article [number] (for RPC)
        * IMPORTANT: Only extract what actually exists in the text. Do not fabricate elements, penalties, or defenses if they are not present.
      - time_limits: Extract if phrases like "within", "not later than", "period of" appear; else default "As provided by law" or null
      - required_forms: Search for "form", "application", "permit"; else default "As required by implementing rules" or null
      - related_laws: MUST provide at least ONE non-self item (target 3; max 3). Format: "Citation\\nURL" (Citation on first line, REAL WORKING LawPhil URL on second line)
        * CRITICAL: Actively identify specific, thematically related laws or constitutional articles/sections
        * Do NOT rely on generic defaults - identify specific related statutes, acts, or constitutional provisions
        * Citations MUST be SPECIFIC: Include full act names, article/section numbers
        * Example: "1987 Constitution, Article III Section 1 - Bill of Rights" or "Republic Act 386, Article 123"
        * NOT: "Constitutional provisions" or "Related laws" or "Applicable laws"
        * URLs MUST be REAL, WORKING LawPhil URLs (never placeholders)
        * Only if absolutely none apply after careful analysis, system will provide Constitution as fallback
        * For Revised Penal Code (Act 3815): Prefer Constitution Article III (Bill of Rights) as related law
        * For other Acts: Prefer Constitution or related statutes in the same domain
   
   C. CITY ORDINANCE ENTRIES:
      - elements: Required elements or components (similar to statutes)
      - penalties: Fines, sanctions, or penalties specified in the ordinance
      - defenses: Available defenses or exemptions
      - Follow same guidelines as statute entries
   
   D. RULE OF COURT ENTRIES:
      - triggers: Conditions or events that activate this rule
      - time_limits: Deadlines, periods, or time constraints for procedures
      - required_forms: Forms, documents, or filings required
      - related_laws: Related rules or sections
      - Focus on procedural requirements and court processes
   
   E. AGENCY CIRCULAR ENTRIES:
      - applicability: Who or what this circular applies to
      - related_laws: Related laws or legal authority for the circular
      - forms: Required forms or documents
      - Focus on administrative procedures and compliance
   
7. NULL vs "NA" vs "N/A":
   - Use null (JSON null) for string fields that don't apply
   - Use "N/A" (standardized) only when explicitly indicating "not applicable"
   - Arrays may be empty [] if no data
   - DO NOT use "NA", "na", or any variation other than "N/A"
   - DO NOT place "N/A" more than once in arrays (collapse to single "N/A")
   
8. ABBREVIATIONS:
   - DO NOT abbreviate: Write "Article 1", "Section 3" (never ART1, Sec. 3)
   - Expand common abbreviations in output
   - Use full legal terminology
   
9. CITATIONS AND URLS:
   - Provide REAL, verifiable citations only
   - Citations MUST be SPECIFIC and DETAILED:
     * For jurisprudence: Include full case names, G.R. numbers, dates (e.g., "Tañada v. Angara, G.R. No. 118295, May 2, 1997")
    * For related_laws: Include complete references with act/article/section (e.g., "Republic Act 386, Article 123") and a working LawPhil URL
     * AVOID generic citations like "Constitutional provisions" or "Applicable laws" - be specific
   - Prefer LawPhil URLs when available
   - Ensure URLs are functional and accessible
   - Source URLs should ONLY be the scraping link (no additional fragments)
   
10. ENTRY TYPE-SPECIFIC ENRICHMENT PRIORITIES:
    
    A. CONSTITUTION ENTRIES:
       - Prioritize: rights_callouts, advice_points, jurisprudence, related_laws
       - Set jurisdiction to "Philippines"
       - For 1987 Constitution: effective_date = "1987-02-02"
       - Use null for non-applicable statute-specific fields
    
    B. STATUTE ENTRIES:
       - Provide elements, penalties, defenses only if they exist in the text (may be empty/null if not present)
       - Identify who is subject to the law and what actions are required/prohibited
       - Look for enforcement mechanisms and compliance requirements
       - Note deadlines, time limits, or procedural steps
       - Identify exemptions, defenses, or special circumstances
       - Focus on practical enforcement and compliance aspects
       - Do not fabricate content - only extract what actually exists
    
    C. CITY ORDINANCE ENTRIES:
       - Similar to statute entries
       - Emphasize local government requirements and local enforcement
       - Note local penalties and local compliance procedures
    
    D. RULE OF COURT ENTRIES:
       - Focus on procedural requirements and court processes
       - Identify filing requirements, deadlines, and procedural steps
       - Look for evidentiary standards, burden of proof, procedural safeguards
       - Note forms, documents, or procedural requirements
       - Identify sanctions or consequences for non-compliance
    
    E. AGENCY CIRCULAR ENTRIES:
       - Focus on administrative policies, procedures, and regulations
       - Identify implementing rules, guidelines, and administrative requirements
       - Look for agency powers, responsibilities, and enforcement mechanisms
       - Note reporting requirements, compliance procedures, administrative processes
       - Identify penalties, sanctions, or administrative remedies

11. HISTORICAL CONTEXT AND APPLICABILITY:
    - historical_context is automatically assigned by the system based on act metadata (no GPT generation needed)
    - Predefined values:
      * Commonwealth Acts: "Commonwealth period law; check current applicability"
      * 1930 Acts (pre-Commonwealth): "Pre-Commonwealth statute; may be repealed or superseded"
      * Revised Penal Code (Act No. 3815): "Pre-Commonwealth statute (Revised Penal Code); verify current applicability and amendments"
      * Post-1946 Acts: null (no historical context needed)
    - This field helps users understand the legal status of historical laws

12. ACCURACY AND SPECIFICITY:
    - Be specific and accurate to Philippine law
    - Focus on practical, actionable information
    - Verify factual accuracy of citations and references
    - Use appropriate law_family based on entry_type
    - For statutes: Include full act name and number when available
    - For historical laws: Note context and current applicability
    - Law family assignment:
      * Set law_family = "Revised Penal Code" ONLY for Act No. 3815 and provisions explicitly within it
      * For other 1930 Acts: Set law_family reflecting their domain using type inference keywords:
        - "Appropriating", "Public Works" → "Appropriations"
        - "Franchise", "granted to" → "Franchise"
        - "Relieving", "changing name" → "Relief/Administrative"
        - "Amending", "codifying" → "Codification"
        - Use domain-specific law_family or null if unclear
    - Type inference for non-penal categorization:
      * Use secondary keyword map to improve auto-tag generation and law_family assignment:
        - Appropriations: "Appropriating", "Public Works", "appropriation", "budget"
        - Franchise: "Franchise", "granted to", "franchisee", "concession"
        - Relief/Administrative: "Relieving", "changing name", "relief", "administrative"
        - Codification: "Amending", "codifying", "codification", "revision"
    - Effective date extraction for 1930 Acts:
      * Prefer "Effective, [date]" pattern if present
      * Fallback to "Approved, [date]" pattern if "Effective" not found
      * Format: Extract date and convert to YYYY-MM-DD format
      * Normalize ambiguous month abbreviations: "Sept." → "September", "Dec." → "December", "Jan." → "January", etc.
      * Regex should capture both "Effective," and "Approved," patterns (case-insensitive)
      * Handle both "Effective, December 9, 1930" and "Approved, December 8, 1930" formats
    
13. RIGHTS CALLOUTS AND ADVICE POINTS - COMPREHENSIVE REQUIREMENT:
    - rights_callouts: Provide AS MANY AS POSSIBLE (not just one)
      * Extract ALL constitutional rights mentioned or implied
      * Be thorough - list every right, protection, or entitlement referenced
      * Minimum: 1 item; Target: 3-10+ items when applicable
    - advice_points: Provide AS MANY AS POSSIBLE (not just one)
      * Extract ALL practical guidance, interpretation points, or advice
      * Be thorough - list every piece of practical guidance or interpretation tip
      * Minimum: 1 item; Target: 3-10+ items when applicable
    - These fields should be comprehensive, not minimal
    
14. CITATION SPECIFICITY - CRITICAL:
    - All citations must be SPECIFIC and DETAILED
    - Jurisprudence: Must include case name, G.R. number, date (e.g., "Tañada v. Angara, G.R. No. 118295, May 2, 1997")
    - Legal Bases: Must include full act name and article/section (e.g., "1987 Constitution, Article II Section 1")
    - Related Sections: Must include complete act/article/section reference (e.g., "Republic Act 386, Article 123 Section 4")
    - NEVER use generic citations like:
      * "Constitutional provisions"
      * "Applicable laws" 
      * "Related sections"
      * "Legal principles"
    - If a specific citation cannot be found, use the most specific general reference possible with proper formatting

═══════════════════════════════════════════════════════════════════════════════
                             REVIEW COMPLETE
═══════════════════════════════════════════════════════════════════════════════
`;

export function getEnrichmentReminder() {
  return `\n\n⚠️ REMINDER: Before enriching this entry, please review the "WHAT TO FOLLOW WHEN ENRICHING" guidelines above. Ensure you follow ALL rules, especially:\n- Title format (Roman numerals for Constitution Articles, proper format for Statutes/Ordinances/Rules)\n- related_laws: Proactively find 1–3 SPECIFIC, NON-SELF related laws/articles/sections with WORKING LawPhil URLs. Do NOT depend on defaults/fallbacks; only leave empty if truly none apply.\n- Key fields (jurisprudence, related_laws, tags): Target 3+ when possible, but only provide what actually exists.\n- rights_callouts and advice_points: Provide AS MANY AS POSSIBLE (be thorough, not minimal)\n- elements, penalties, defenses: Only provide if they exist in the text - do not fabricate content. Leave empty [] or null if not present.\n- Citations MUST be SPECIFIC\n- No duplicate values in multi-item fields\n- Proper null/"N/A" handling\n- Entry type-specific requirements\n\n`;
}


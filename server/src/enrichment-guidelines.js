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
   - MUST contain AT LEAST ONE tag (never empty [])
   - Provide as many tags as necessary (no maximum limit)
   - Tags should be specific and relevant to the legal provision
   - Examples: "Civilian Supremacy", "Military", "State Policy", "Rights", "Obligations"
   
3. MULTI-ITEM FIELDS - NO DUPLICATES:
   - All array fields must contain UNIQUE values only
   - Remove any duplicate entries before returning
   - Fields affected: tags, rights_callouts, advice_points, jurisprudence, related_laws
   
4. JURISPRUDENCE:
   - ALWAYS provide as many applicable citations as possible (NO maximum limit - provide all applicable citations)
   - MUST contain AT LEAST ONE citation (minimum 1 item required)
   - If applicable, provide AT LEAST 3 citations as a target/minimum (but can and should provide MORE if more are applicable)
   - Only provide ONE citation if the field truly has no specific jurisprudence - then use a general constitutional/legal principle citation
   - Rule: Minimum 1, Target 3+ when applicable, Maximum: As many as applicable (no limit)
   - Citations ONLY (no URLs)
   - Citations MUST be SPECIFIC: Include full case names, G.R. numbers, dates, and specific legal references
   - Format: Plain citation text (e.g., "Tañada v. Angara, G.R. No. 118295, May 2, 1997")
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
     * URLs must be verifiable and accessible - test format before returning
   - Format: "Citation\\nURL" (Citation on first line, working LawPhil URL on second line)
   - Each item must be: "Citation\\nURL" (exactly 2 lines separated by newline)
   
5A. ALL MULTI-ITEM FIELDS - MINIMUM REQUIREMENT:
   - tags: MUST contain AT LEAST ONE tag (provide as many as applicable, NO maximum limit)
   - rights_callouts: MUST contain AT LEAST ONE item (provide AS MANY AS POSSIBLE - be thorough, list all applicable rights, NO maximum limit)
   - advice_points: MUST contain AT LEAST ONE item (provide AS MANY AS POSSIBLE - be thorough, list all applicable guidance, NO maximum limit)
   - jurisprudence: MUST contain AT LEAST ONE citation (if applicable, provide 3+ as target/minimum but CAN GO BEYOND 3; if not, provide 1 general citation)
   - related_laws: MUST provide at least ONE non-self item (target 3; max 3). If truly none apply, leave empty [] (no fabrication)
   - IMPORTANT: "3+" means "at least 3, but no maximum" - provide ALL applicable items, not limited to 3
   - elements: MUST contain AT LEAST ONE element (for statutes/ordinances, provide as many as applicable)
   - penalties: MUST contain AT LEAST ONE penalty or consequence (for statutes/ordinances, provide as many as applicable)
   - defenses: MUST contain AT LEAST ONE defense or exemption (for statutes/ordinances, provide as many as applicable)
   - RULE: Provide as many as applicable/possible. If truly not applicable (only one general item exists), then provide just one. Never return empty []
   
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
      - elements: MUST contain AT LEAST ONE element (array or string, never empty/null)
        * List all required elements that must be proven
        * If no specific elements, provide general legal requirements/principles
        * Example: ["1. Intent to kill", "2. Overt act", "3. Causation", "4. Resulting death"]
      - penalties: MUST contain AT LEAST ONE penalty (array or string, never empty/null)
        * Specify penalties, fines, imprisonment terms, or consequences
        * If no specific penalty, state "As provided by law" or applicable general penalty
        * Example: ["Fine: ₱5,000 - ₱20,000", "Imprisonment: 6 months to 2 years"]
      - defenses: MUST contain AT LEAST ONE defense (array or string, never empty/null)
        * List available defenses, exemptions, or justifications
        * If no specific defense, provide general legal defenses (e.g., "As provided by law")
        * Example: ["Self-defense", "Accident", "Lawful performance of duty"]
      - time_limits: MUST provide at least one (never null) - if none, state "As provided by law"
      - required_forms: MUST provide at least one (never null) - if none, state "As required by implementing rules"
   - related_laws: Provide AT LEAST ONE when applicable; if truly none apply, allow empty []
   
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
       - ALWAYS provide: elements, penalties, defenses (even if empty/null)
       - Identify who is subject to the law and what actions are required/prohibited
       - Look for enforcement mechanisms and compliance requirements
       - Note deadlines, time limits, or procedural steps
       - Identify exemptions, defenses, or special circumstances
       - Focus on practical enforcement and compliance aspects
    
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

11. ACCURACY AND SPECIFICITY:
    - Be specific and accurate to Philippine law
    - Focus on practical, actionable information
    - Verify factual accuracy of citations and references
    - Use appropriate law_family based on entry_type
    - For statutes: Include full act name and number when available
    - For historical laws: Note context and current applicability
    
12. RIGHTS CALLOUTS AND ADVICE POINTS - COMPREHENSIVE REQUIREMENT:
    - rights_callouts: Provide AS MANY AS POSSIBLE (not just one)
      * Extract ALL constitutional rights mentioned or implied
      * Be thorough - list every right, protection, or entitlement referenced
      * Minimum: 1 item; Target: 3-10+ items when applicable
    - advice_points: Provide AS MANY AS POSSIBLE (not just one)
      * Extract ALL practical guidance, interpretation points, or advice
      * Be thorough - list every piece of practical guidance or interpretation tip
      * Minimum: 1 item; Target: 3-10+ items when applicable
    - These fields should be comprehensive, not minimal
    
13. CITATION SPECIFICITY - CRITICAL:
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
  return `\n\n⚠️ REMINDER: Before enriching this entry, please review the "WHAT TO FOLLOW WHEN ENRICHING" guidelines above. Ensure you follow ALL rules, especially:\n- Title format (Roman numerals for Constitution Articles, proper format for Statutes/Ordinances/Rules)\n- related_laws: Proactively find 1–3 SPECIFIC, NON-SELF related laws/articles/sections with WORKING LawPhil URLs. Do NOT depend on defaults/fallbacks; only leave empty if truly none apply.\n- ALL fields MUST contain AT LEAST ONE item when applicable; for key fields (jurisprudence, related_laws), target 3+ when possible.\n- rights_callouts and advice_points: Provide AS MANY AS POSSIBLE (be thorough, not minimal)\n- Citations MUST be SPECIFIC\n- No duplicate values in multi-item fields\n- Proper null/"N/A" handling\n- Entry type-specific requirements (e.g., ALWAYS provide elements/penalties/defenses for statutes)\n\n`; 
}


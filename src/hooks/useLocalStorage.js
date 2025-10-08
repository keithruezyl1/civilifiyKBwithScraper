import { useState, useEffect, useMemo } from 'react';
import { upsertEntry, deleteEntryVector } from '../services/vectorApi';
import { fetchAllEntriesFromDb } from '../services/kbApi';
import { updateProgressForEntry } from '../lib/plan/progressStore';
import { toISODate, getPlanDate } from '../lib/plan/planLoader';

const STORAGE_KEY = 'law_entries';
const TEAM_PROGRESS_KEY = 'team_progress';
const DAILY_QUOTAS_KEY = 'daily_quotas';

// Custom hook for managing entries in localStorage
export const useLocalStorage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to clear errors
  const clearError = () => setError(null);
  const [teamProgress, setTeamProgress] = useState({});
  const [dailyQuotas, setDailyQuotas] = useState({});

  // Load progress and quotas from localStorage; entries will come from DB only
  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(TEAM_PROGRESS_KEY);
      const storedQuotas = localStorage.getItem(DAILY_QUOTAS_KEY);
      
      if (storedProgress) {
        const parsedProgress = JSON.parse(storedProgress);
        setTeamProgress(parsedProgress);
      }
      
      if (storedQuotas) {
        const parsedQuotas = JSON.parse(storedQuotas);
        setDailyQuotas(parsedQuotas);
      }
    } catch (err) {
      console.error('Error loading data from localStorage:', err);
      // Don't show localStorage errors to users - localStorage is just a cache
      // The real data comes from the database, so this is not a critical error
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate from DB after initial mount (always authoritative)
  useEffect(() => {
    const refresh = async () => {
      try {
        const dbEntries = await fetchAllEntriesFromDb();
        if (Array.isArray(dbEntries)) {
          const mapped = dbEntries.map((e) => ({
            ...e,
            id: e.entry_id,
          }));
          setEntries(mapped);
        }
      } catch (err) {
        console.warn('DB fetch failed; no local cache used', err);
      }
    };
    refresh();
  }, []);

  // Listen for external refresh/replace/clear events from header button
  useEffect(() => {
    const onReplace = (e) => {
      const rows = (e && e.detail && Array.isArray(e.detail.entries)) ? e.detail.entries : [];
      const mapped = rows.map((x) => ({ ...x, id: x.entry_id }));
      setEntries(mapped);
    };
    const onForceRefresh = async () => {
      try {
        const rows = await fetchAllEntriesFromDb();
        const mapped = Array.isArray(rows) ? rows.map((x) => ({ ...x, id: x.entry_id })) : [];
        setEntries(mapped);
      } catch {}
    };
    const onClear = () => setEntries([]);
    window.addEventListener('replace-entries', onReplace);
    window.addEventListener('force-refresh-entries', onForceRefresh);
    window.addEventListener('clear-entries', onClear);
    return () => {
      window.removeEventListener('replace-entries', onReplace);
      window.removeEventListener('force-refresh-entries', onForceRefresh);
      window.removeEventListener('clear-entries', onClear);
    };
  }, []);

  // No longer persisting entries to localStorage (DB is source of truth)

  // Save team progress to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(TEAM_PROGRESS_KEY, JSON.stringify(teamProgress));
        // Clear any previous localStorage errors when save succeeds
        if (error && error.includes('storage')) {
          setError(null);
        }
      } catch (err) {
        console.error('Error saving team progress to localStorage:', err);
        // Don't show localStorage errors to users - these are not critical
        // Only log the error for debugging purposes
      }
    }
  }, [teamProgress, loading, error]);

  // Save daily quotas to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(DAILY_QUOTAS_KEY, JSON.stringify(dailyQuotas));
        // Clear any previous localStorage errors when save succeeds
        if (error && error.includes('storage')) {
          setError(null);
        }
      } catch (err) {
        console.error('Error saving daily quotas to localStorage:', err);
        // Don't show localStorage errors to users - these are not critical
        // Only log the error for debugging purposes
      }
    }
  }, [dailyQuotas, loading, error]);

  // Check for daily reset at midnight
  useEffect(() => {
    if (!loading) {
      const checkDailyReset = () => {
        const today = new Date().toISOString().split('T')[0];
        const lastReset = dailyQuotas.lastReset;
        
        // If it's a new day and we haven't reset yet
        if (lastReset !== today) {
          console.log('New day detected, resetting daily quotas');
          resetDailyQuotas();
        }
      };

      // Check immediately
      checkDailyReset();

      // Set up interval to check every minute
      const interval = setInterval(checkDailyReset, 60000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [loading, dailyQuotas.lastReset]);

  // Add a new entry
  const addEntry = async (entry) => {
    try {
      // Upsert to DB (embedding server)
      if (!entry.entry_id) throw new Error('entry_id is required');
      const payload = {
        entry_id: entry.entry_id,
        type: entry.type,
        title: entry.title,
        canonical_citation: entry.canonical_citation,
        summary: entry.summary,
        text: entry.text,
        tags: entry.tags,
        jurisdiction: entry.jurisdiction,
        law_family: entry.law_family,
        section_id: entry.section_id,
        status: entry.status,
        effective_date: entry.effective_date,
        amendment_date: entry.amendment_date,
        last_reviewed: entry.last_reviewed,
        visibility: entry.visibility,
        source_urls: entry.source_urls,
        elements: entry.elements,
        penalties: entry.penalties,
        defenses: entry.defenses,
        prescriptive_period: entry.prescriptive_period,
        standard_of_proof: entry.standard_of_proof,
        rule_no: entry.rule_no,
        section_no: entry.section_no,
        triggers: entry.triggers,
        time_limits: entry.time_limits,
        required_forms: entry.required_forms,
        circular_no: entry.circular_no,
        applicability: entry.applicability,
        issuance_no: entry.issuance_no,
        instrument_no: entry.instrument_no,
        supersedes: entry.supersedes,
        steps_brief: entry.steps_brief,
        forms_required: entry.forms_required,
        failure_states: entry.failure_states,
        violation_code: entry.violation_code,
        violation_name: entry.violation_name,
        license_action: entry.license_action,
        fine_schedule: entry.fine_schedule,
        apprehension_flow: entry.apprehension_flow,
        incident: entry.incident,
        phases: entry.phases,
        forms: entry.forms,
        handoff: entry.handoff,
        rights_callouts: entry.rights_callouts,
        rights_scope: entry.rights_scope,
        advice_points: entry.advice_points,
        topics: entry.topics,
        jurisprudence: entry.jurisprudence,
        legal_bases: entry.legal_bases,
        related_sections: entry.related_sections,
        created_by: entry.created_by,
        created_by_name: entry.created_by_name,
      };
      const resp = await upsertEntry(payload);
      if (!resp?.success) throw new Error(resp?.error || 'Upsert failed');

      // Refresh from DB for authoritative state
      const dbEntries = await fetchAllEntriesFromDb();
      if (Array.isArray(dbEntries)) {
        const mapped = dbEntries.map((e) => ({ ...e, id: e.entry_id }));
        setEntries(mapped);
        // Clear any previous errors when operation succeeds
        setError(null);
      }

      // Progress increments are keyed by username + date
      const who = String(entry.created_by_username || entry.created_by_name || entry.team_member_id || '').trim();
      if (who) {
        // Use the created_at date for progress tracking
        const entryDate = entry.created_at ? new Date(entry.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        updateProgressForEntry(entryDate, who, entry.type);
      }
      return payload;
    } catch (err) {
      console.error('Error adding entry:', err);
      setError('Failed to add entry');
      throw err;
    }
  };

  // Update an existing entry
  const updateEntry = async (id, updates) => {
    try {
      const existing = entries.find((e) => e.id === id);
      if (!existing) throw new Error('Entry not found');
      const merged = { ...existing, ...updates };
      if (!merged.entry_id) throw new Error('entry_id is required');
      
      // Type-specific field mapping
      const typeSpecificFields = {
        constitution_provision: ['topics', 'related_sections', 'jurisprudence'],
        statute_section: ['elements', 'penalties', 'defenses', 'prescriptive_period', 'standard_of_proof', 'related_sections', 'legal_bases'],
        city_ordinance_section: ['elements', 'penalties', 'defenses', 'related_sections', 'legal_bases'],
        rule_of_court: ['rule_no', 'section_no', 'triggers', 'time_limits', 'required_forms', 'related_sections'],
        agency_circular: ['circular_no', 'section_no', 'applicability', 'legal_bases', 'supersedes'],
        doj_issuance: ['issuance_no', 'applicability', 'legal_bases', 'supersedes'],
        executive_issuance: ['instrument_no', 'applicability', 'legal_bases', 'supersedes'],
        rights_advisory: ['rights_scope', 'advice_points', 'legal_bases', 'related_sections'],
      };

      // Helper function to normalize string fields
      const normalizeStringField = (value) => {
        if (value === null || value === undefined) return '';
        return String(value);
      };

      // Get relevant fields for this entry type
      const relevantFields = typeSpecificFields[merged.type] || [];
      
      // Send complete payload with only relevant type-specific fields
      const payload = {
        entry_id: merged.entry_id,
        type: merged.type,
        title: normalizeStringField(merged.title),
        canonical_citation: normalizeStringField(merged.canonical_citation),
        summary: normalizeStringField(merged.summary),
        text: normalizeStringField(merged.text),
        tags: merged.tags,
        jurisdiction: merged.jurisdiction,
        law_family: normalizeStringField(merged.law_family),
        section_id: normalizeStringField(merged.section_id),
        status: normalizeStringField(merged.status),
        effective_date: merged.effective_date,
        amendment_date: merged.amendment_date,
        last_reviewed: merged.last_reviewed,
        visibility: merged.visibility,
        source_urls: merged.source_urls,
        legal_bases: merged.legal_bases,
        related_sections: merged.related_sections,
      };

      // Only include type-specific fields that are relevant for this entry type
      if (relevantFields.includes('elements')) payload.elements = merged.elements;
      if (relevantFields.includes('penalties')) payload.penalties = merged.penalties;
      if (relevantFields.includes('defenses')) payload.defenses = merged.defenses;
      if (relevantFields.includes('prescriptive_period')) payload.prescriptive_period = merged.prescriptive_period;
      if (relevantFields.includes('standard_of_proof')) payload.standard_of_proof = normalizeStringField(merged.standard_of_proof);
      if (relevantFields.includes('rule_no')) payload.rule_no = normalizeStringField(merged.rule_no);
      if (relevantFields.includes('section_no')) payload.section_no = normalizeStringField(merged.section_no);
      if (relevantFields.includes('triggers')) payload.triggers = merged.triggers;
      if (relevantFields.includes('time_limits')) payload.time_limits = merged.time_limits;
      if (relevantFields.includes('required_forms')) payload.required_forms = merged.required_forms;
      if (relevantFields.includes('circular_no')) payload.circular_no = normalizeStringField(merged.circular_no);
      if (relevantFields.includes('applicability')) payload.applicability = merged.applicability;
      if (relevantFields.includes('issuance_no')) payload.issuance_no = normalizeStringField(merged.issuance_no);
      if (relevantFields.includes('instrument_no')) payload.instrument_no = normalizeStringField(merged.instrument_no);
      if (relevantFields.includes('supersedes')) payload.supersedes = merged.supersedes;
      if (relevantFields.includes('steps_brief')) payload.steps_brief = merged.steps_brief;
      if (relevantFields.includes('forms_required')) payload.forms_required = merged.forms_required;
      if (relevantFields.includes('failure_states')) payload.failure_states = merged.failure_states;
      if (relevantFields.includes('violation_code')) payload.violation_code = normalizeStringField(merged.violation_code);
      if (relevantFields.includes('violation_name')) payload.violation_name = normalizeStringField(merged.violation_name);
      if (relevantFields.includes('license_action')) payload.license_action = normalizeStringField(merged.license_action);
      if (relevantFields.includes('fine_schedule')) payload.fine_schedule = merged.fine_schedule;
      if (relevantFields.includes('apprehension_flow')) payload.apprehension_flow = merged.apprehension_flow;
      if (relevantFields.includes('incident')) payload.incident = normalizeStringField(merged.incident);
      if (relevantFields.includes('phases')) payload.phases = merged.phases;
      if (relevantFields.includes('forms')) payload.forms = merged.forms;
      if (relevantFields.includes('handoff')) payload.handoff = merged.handoff;
      if (relevantFields.includes('rights_callouts')) payload.rights_callouts = merged.rights_callouts;
      if (relevantFields.includes('rights_scope')) payload.rights_scope = normalizeStringField(merged.rights_scope);
      if (relevantFields.includes('advice_points')) payload.advice_points = merged.advice_points;
      if (relevantFields.includes('topics')) payload.topics = merged.topics;
      if (relevantFields.includes('jurisprudence')) payload.jurisprudence = merged.jurisprudence;

      // Debug logging
      console.log('🔧 Update Entry - Type:', merged.type);
      console.log('🔧 Update Entry - Relevant fields:', relevantFields);
      console.log('🔧 Update Entry - Payload keys:', Object.keys(payload));
      console.log('🔧 Update Entry - Has standard_of_proof:', 'standard_of_proof' in payload);

      // Use the proper PUT endpoint for updates
      const response = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/kb/entries/${merged.entry_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || 'Update failed');

      // Refresh entries from database
      const dbEntries = await fetchAllEntriesFromDb();
      if (Array.isArray(dbEntries)) {
        const mapped = dbEntries.map((e) => ({ ...e, id: e.entry_id }));
        setEntries(mapped);
        // Clear any previous errors when operation succeeds
        setError(null);
      }

      console.log('Entry updated successfully:', result);
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry');
      throw err;
    }
  };

  // Delete an entry
  const deleteEntry = async (id) => {
    try {
      const entryToDelete = entries.find(entry => entry.id === id);
      if (!entryToDelete || !entryToDelete.entry_id) throw new Error('Entry not found');
      await deleteEntryVector(entryToDelete.entry_id);
      const dbEntries = await fetchAllEntriesFromDb();
      if (Array.isArray(dbEntries)) {
        const mapped = dbEntries.map((e) => ({ ...e, id: e.entry_id }));
        setEntries(mapped);
      }
      if (entryToDelete && entryToDelete.team_member_id) {
        decrementTeamProgress(entryToDelete.team_member_id, entryToDelete.type);
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry');
      throw err;
    }
  };

  // Get entry by ID
  const getEntryById = (id) => {
    return entries.find(entry => entry.id === id);
  };

  // Get entry by entry_id
  const getEntryByEntryId = (entryId) => {
    return entries.find(entry => entry.entry_id === entryId);
  };

  // Optimized search entries with memoization
  const searchEntries = useMemo(() => {
    // Create a memoized search function
    const memoizedSearch = (query, filters = {}) => {
    let filteredEntries = [...entries];

    // Text search
    if (query && query.trim()) {
        // Fast normalization - single pass
        const normalize = (text) => {
          if (!text) return '';
          // Unicode normalize + strip diacritics, then lower case
          let s = String(text);
          try { s = s.normalize('NFKD'); } catch {}
          s = s.replace(/[\u0300-\u036f]/g, '');
          s = s.toLowerCase();
          // Normalize smart quotes and dashes
          s = s.replace(/[“”„‟❛❜❝❞]/g, '"').replace(/[‘’‚‛]/g, "'").replace(/[–—―]/g, '-');
          // Map punctuation variants to words before stripping
          s = s.replace(/[&/]/g, ' and ');
          // Legal citation patterns and symbols
          s = s
            .replace(/§/g, ' section ')               // section symbol
            .replace(/\bg\.?\s*r\.?\s*no\.?\b/g, ' gr number ') // G.R. No.
            .replace(/\bgr\.?\s*no\.?\b/g, ' gr number ')
            .replace(/\bblg\.?\b/g, ' bilang ');    // Blg. -> Bilang
          // Expand common legal abbreviations (with or without dot)
          s = s
            .replace(/\bart\.?\b/g, 'article')
            .replace(/\bart\.\s*/g, 'article ')
            .replace(/\barticulo\b/g, 'article')
            .replace(/\bsec\.?\b/g, 'section')
            .replace(/\bsec\.\s*/g, 'section ')
            .replace(/\bpar\.?\b/g, 'paragraph')
            .replace(/\bsubsec\.?\b/g, 'subsection')
            .replace(/\bsub\.\b/g, 'subsection')
            .replace(/\br\.?a\.?\b/g, 'republic act')
            .replace(/\bra\b/g, 'republic act')
            .replace(/\bno\.?\b/g, 'number');
          // Remove remaining punctuation
          s = s.replace(/[^a-z0-9\s]/g, ' ');
          // Collapse whitespace
          s = s.replace(/\s+/g, ' ').trim();
          // Light plural normalization: singularize simple trailing 's' (avoid 'ss')
          s = s
            .split(' ')
            .map(w => (w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w))
            .join(' ');
          return s;
        };
        
        let searchTerm = normalize(query);
        const searchWords = searchTerm.split(/\s+/).filter(Boolean);
        // Generate simple synonym/variant expansions (non-destructive)
        // Roman \u2194 Arabic helpers
        const romanMap = { m:1000, d:500, c:100, l:50, x:10, v:5, i:1 };
        const isRoman = (w) => /^[ivxlcdm]+$/.test(w);
        const romanToArabic = (w) => {
          if (!isRoman(w)) return null;
          let sum = 0, prev = 0;
          for (let i = w.length - 1; i >= 0; i--) {
            const val = romanMap[w[i]] || 0;
            if (val < prev) sum -= val; else sum += val;
            prev = val;
          }
          return sum > 0 ? String(sum) : null;
        };
        const arabicToRoman = (numStr) => {
          const n = Number(numStr);
          if (!Number.isFinite(n) || n <= 0 || n >= 4000) return null;
          const table = [
            [1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']
          ];
          let x = n; let out = '';
          for (const [v, r] of table) { while (x >= v) { out += r; x -= v; } }
          return out || null;
        };
        // Safer anti- handling: only strip for known allowlisted bases to avoid over-matching
        const __ANTI_ALLOW__ = new Set([
          'graft','trafficking','terrorism','wiretapping','fencing','hazing',
          'money-laundering','moneylaundering','red-tape','redtape',
          'trafficking-in-persons','carnapping','illegal-drugs','dangerous-drugs','terrorism-financing'
        ]);
        const removeAntiPrefix = (w) => {
          if (!(w.startsWith('anti') && w.length > 4)) return w;
          const base = w.replace(/^anti[-\s]?/, '');
          const key = base.replace(/\s+/g, '-');
          return (__ANTI_ALLOW__.has(base) || __ANTI_ALLOW__.has(key)) ? base : w;
        };
        const expandWordVariants = (w) => {
          const variants = new Set([w]);
          // anti- prefix variant: "anti-torture" ~ "torture"
          variants.add(removeAntiPrefix(w));
          // vs/versus normalization to 'v'
          if (w === 'vs' || w === 'vs.' || w === 'versus') variants.add('v');
          if (w === 'v') variants.add('vs');
          // legal synonyms/abbreviations (curated)
          const syn = {
            rpc: ['revised', 'penal', 'code', 'revised penal code'],
            ord: ['ordinance'],
            ordinance: ['ord'],
            ca: ['commonwealth', 'act', 'commonwealth act'],
            'c.a.': ['commonwealth', 'act', 'commonwealth act'],
            bp: ['batas', 'pambansa', 'batas pambansa'],
            'b.p.': ['batas', 'pambansa', 'batas pambansa'],
            blg: ['bilang'],
            pd: ['presidential', 'decree', 'presidential decree'],
            'p.d.': ['presidential', 'decree', 'presidential decree'],
            irr: ['implementing', 'rules', 'regulations', 'implementing rules and regulations'],
            roc: ['rules', 'of', 'court', 'rules of court'],
            doj: ['department', 'of', 'justice', 'department of justice'],
            brgy: ['barangay'],
            bir: ['bureau', 'of', 'internal', 'revenue', 'bureau of internal revenue'],
            nbi: ['national', 'bureau', 'of', 'investigation', 'national bureau of investigation'],
            dilg: ['department', 'of', 'the', 'interior', 'and', 'local', 'government', 'department of the interior and local government'],
            ltfrb: ['land', 'transportation', 'franchising', 'and', 'regulatory', 'board', 'land transportation franchising and regulatory board'],
            dotr: ['department', 'of', 'transportation', 'department of transportation'],
            dhsud: ['department', 'of', 'human', 'settlements', 'and', 'urban', 'development', 'department of human settlements and urban development']
          };
          if (syn[w]) syn[w].forEach(v => variants.add(v));
          // Roman \u2194 Arabic expansions for numeric tokens
          if (/^\d+$/.test(w)) {
            const r = arabicToRoman(w);
            if (r) variants.add(r);
          } else if (isRoman(w)) {
            const a = romanToArabic(w);
            if (a) variants.add(a);
          }
          return Array.from(variants).filter(Boolean);
        };
        let searchWordVariants = new Set(searchWords.flatMap(expandWordVariants));
        // Compose number-letter composites: "5 a" → "5a", "5(a)", "5-a"
        for (let i = 0; i < searchWords.length - 1; i++) {
          const a = searchWords[i];
          const b = searchWords[i + 1];
          // Arabic number + letter (5 a)
          if (/^\d+$/.test(a) && /^[a-z]$/.test(b)) {
            searchWordVariants.add(`${a}${b}`);
            searchWordVariants.add(`${a}(${b})`);
            searchWordVariants.add(`${a}-${b}`);
          }
          // Roman numeral + letter (iii a)
          if (isRoman && typeof isRoman === 'function' && isRoman(a) && /^[a-z]$/.test(b)) {
            searchWordVariants.add(`${a}${b}`);
            searchWordVariants.add(`${a}(${b})`);
            searchWordVariants.add(`${a}-${b}`);
            const arabic = romanToArabic && romanToArabic(a);
            if (arabic) {
              searchWordVariants.add(`${arabic}${b}`);
              searchWordVariants.add(`${arabic}(${b})`);
              searchWordVariants.add(`${arabic}-${b}`);
            }
          }
        }
        // Generate compact and parenthetical variants for matching
        const compactSearch = searchTerm.replace(/\s+/g, '');
        // Insert parentheses between trailing number-letter patterns for better match to canonical forms
        const parentheticalSearch = searchTerm
          .replace(/\b(\d+)\s*([a-z])\b/g, '$1($2)')
          .replace(/\b(\d+)\s*\(\s*([a-z])\s*\)\b/g, '$1($2)');
        
        // Ordered proximity helper: boosts when query tokens appear in order within a short window
        const hasOrderedProximity = (normalizedText, words) => {
          if (!normalizedText || !words || words.length < 2) return false;
          let start = 0;
          const positions = [];
          for (const w of words) {
            const idx = normalizedText.indexOf(w, start);
            if (idx === -1) return false;
            positions.push(idx);
            start = idx + w.length;
          }
          const span = positions[positions.length - 1] - positions[0];
          return span <= 40; // small window
        };
        
        // Fast simple fuzzy matching - no complex algorithms
        const simpleFuzzyMatch = (text, query) => {
          if (!text || !query) return false;
          const normalized = normalize(text);
          const compactNormalized = normalized.replace(/\s+/g, '');
          const compactQuery = String(query).replace(/\s+/g, '');
          
          // Exact match
          if (normalized === query) return true;
          
          // Starts with
          if (normalized.startsWith(query)) return true;
          
          // Contains
          if (normalized.includes(query)) return true;

          // Compact contains (treat spaces and parentheses as optional)
          if (compactNormalized.includes(compactQuery)) return true;

          // Special: number-letter adjacency (e.g., "5 a" vs "5a" or "5(a)")
          const numberLetterVariant = query.replace(/\b(\d+)\s*([a-z])\b/g, '$1$2');
          if (normalized.includes(numberLetterVariant) || compactNormalized.includes(numberLetterVariant)) return true;
          
          // Word boundary matching
          const words = normalized.split(/\s+/);
        for (const word of words) {
            if (word.startsWith(query) || query.startsWith(word)) return true;
          }
          
          // Multi-word matching (all words must be found)
          if (searchWords.length > 1) {
            return searchWords.every(word => 
              normalized.includes(word) || 
              words.some(w => w.startsWith(word) || word.startsWith(w))
            );
          }
          
        return false;
      };

        // Fast scoring system - with calibrated signals
      const scoredEntries = filteredEntries.map(entry => {
          const combinedTags = Array.isArray(entry.tags) ? entry.tags.join(' ') : '';
          const combinedTitleCitation = (entry.title && entry.canonical_citation) ? `${entry.title} ${entry.canonical_citation}` : '';
          const reverseTitleCitation = (entry.title && entry.canonical_citation) ? `${entry.canonical_citation} ${entry.title}` : '';
          const combinedField = [
            entry.title,
            entry.canonical_citation,
            entry.section_id,
            entry.law_family,
            combinedTags,
            entry.summary
          ].filter(Boolean).join(' ');
          const searchFields = [
          // Hierarchy: title > citation > tags > section > law family > id > others
          { text: entry.title, weight: 12 },
          // Treat explicit title+citation as its own searchable field with high weight
          { text: combinedTitleCitation, weight: 13 },
          { text: reverseTitleCitation, weight: 12 },
          { text: entry.canonical_citation, weight: 9 },
          { text: entry.section_id, weight: 6 },
          { text: entry.law_family, weight: 5 },
          { text: combinedTags, weight: 4 },
          { text: entry.entry_id, weight: 5 },
          { text: combinedField, weight: 3 },
          { text: entry.summary, weight: 3 },
          { text: entry.effective_date, weight: 3 },
          { text: entry.text, weight: 2 },
          { text: entry.text_raw, weight: 2 }
        ];
        
        let score = 0;
        let hasMatch = false;
        let phraseBoostApplied = false;
        // If the query exactly equals the title+citation, force a very high score
        try {
          const norm = (s) => normalize(s);
          if ((combinedTitleCitation && norm(combinedTitleCitation) === searchTerm) || (reverseTitleCitation && norm(reverseTitleCitation) === searchTerm)) {
            score += 1000; // ranks above others deterministically
            hasMatch = true;
          }
        } catch {}
        
          for (const { text, weight } of searchFields) {
          if (!text) continue;
          
          const normalizedText = normalize(text);
          const compactText = normalizedText.replace(/\s+/g, '');
          const textWords = normalizedText.split(/\s+/).filter(Boolean);
          const textWordVariants = new Set(textWords.flatMap(expandWordVariants));
          
          // Exact match gets highest score
          if (normalizedText === searchTerm) {
            score += weight * 3;
            hasMatch = true;
          }
          // Starts with gets high score
          else if (normalizedText.startsWith(searchTerm)) {
            score += weight * 2;
            hasMatch = true;
          }
          // Contains gets medium score
          else if (normalizedText.includes(searchTerm)) {
            score += weight;
            hasMatch = true;
            // Phrase boost for multi-word queries in title/summary
            if (!phraseBoostApplied && searchWords.length > 1 && (weight >= 12 || text === entry.summary)) {
              score += Math.min(20, Math.round(weight * 1.5));
              phraseBoostApplied = true;
            }
            // Light proximity boost when ordered tokens are near each other for key fields
            if (searchWords.length > 1 && (weight >= 9) && hasOrderedProximity(normalizedText, searchWords)) {
              score += Math.min(10, Math.round(weight * 0.5));
            }
          }
          // Compact contains: ignore spaces/parentheses differences
          else if (compactText.includes(compactSearch)) {
            score += weight * 0.9;
            hasMatch = true;
          }
          // Parenthetical variant contains: map "5 a" -> "5(a)"
          else if (normalizedText.includes(parentheticalSearch)) {
            score += weight * 0.9;
            hasMatch = true;
          }
          // Token overlap scoring: reward partial multi-word matches
          else {
            // Variant-aware token overlap (handles anti- prefix and vs/versus)
            const matchedWords = Array.from(searchWordVariants).filter(word =>
              Array.from(textWordVariants).some(tw => tw.includes(word) || word.includes(tw))
            );
            const coverage = matchedWords.length / Math.max(1, searchWords.length);
            if (coverage >= 0.6) {
              // Strong partial match scaled by coverage
              score += weight * (0.6 + 0.4 * Math.min(1, coverage));
              hasMatch = true;
            } else if (matchedWords.length >= 1) {
              // Weak partial match (at least one query word)
              score += weight * 0.4;
              hasMatch = true;
            } else if (simpleFuzzyMatch(text, searchTerm)) {
              // Simple fuzzy match gets lower score
              score += weight * 0.5;
              hasMatch = true;
            }
          }

          // Additional scoped fuzzy: per-token edit distance 1 on short tokens for key fields
          if (!hasMatch && (weight >= 12 || weight >= 6)) {
            const shortTokens = searchWords.filter(w => w.length >= 3 && w.length <= 6);
            if (shortTokens.length) {
              const fuzzyHit = shortTokens.some(qt => textWords.some(tw => {
                const la = qt.length, lb = tw.length;
                if (Math.abs(la - lb) > 1) return false;
                // inline edit distance <=1
                let i = 0, j = 0, edits = 0;
                while (i < la && j < lb) {
                  if (qt[i] === tw[j]) { i++; j++; continue; }
                  if (edits === 1) return false;
                  edits++;
                  if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
                }
                if (i < la || j < lb) edits++;
                return edits <= 1;
              }));
              if (fuzzyHit) {
                score += weight * 0.6;
                hasMatch = true;
              }
            }
          }
        }
        
        return { entry, score, hasMatch };
      });
      
      // Filter and sort by score
      const EPS = 1e-6;
      filteredEntries = scoredEntries
        .filter(({ hasMatch }) => hasMatch)
        .sort((a, b) => {
          if (Math.abs(b.score - a.score) > EPS) return b.score - a.score;
          // tie-breakers: verified > active > newer effective_date > shorter title > lower id
          const av = a.entry.verified === true ? 1 : 0;
          const bv = b.entry.verified === true ? 1 : 0;
          if (bv !== av) return bv - av;
          const aActive = String(a.entry.status || '').toLowerCase() === 'active' ? 1 : 0;
          const bActive = String(b.entry.status || '').toLowerCase() === 'active' ? 1 : 0;
          if (bActive !== aActive) return bActive - aActive;
          const ad = a.entry.effective_date ? Date.parse(a.entry.effective_date) : 0;
          const bd = b.entry.effective_date ? Date.parse(b.entry.effective_date) : 0;
          if (bd !== ad) return bd - ad;
          const at = (a.entry.title || '').length;
          const bt = (b.entry.title || '').length;
          if (at !== bt) return at - bt;
          const aid = String(a.entry.entry_id || a.entry.id || '');
          const bid = String(b.entry.entry_id || b.entry.id || '');
          return aid.localeCompare(bid);
        })
        .map(({ entry }) => entry);
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.type === filters.type);
    }

    // Subtype filter (only applies when type is not 'all')
    if (filters.subtype && filters.subtype !== 'all' && filters.type && filters.type !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.entry_subtype === filters.subtype);
    }

    // Jurisdiction filter
    if (filters.jurisdiction && filters.jurisdiction !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.jurisdiction === filters.jurisdiction);
    }

    // Status filter (released/unreleased)
    if (filters.status && filters.status !== 'all') {
      filteredEntries = filteredEntries.filter(entry => {
        if (filters.status === 'released') {
          return entry.published_at !== null && entry.published_at !== undefined;
        } else if (filters.status === 'unreleased') {
          return entry.published_at === null || entry.published_at === undefined;
        }
        return true;
      });
    }


    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.tags && filters.tags.some(tag => entry.tags.includes(tag))
      );
    }

    // Offline pack filter
    if (filters.offline_pack !== undefined) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.offline && entry.offline.pack_include === filters.offline_pack
      );
    }

    return filteredEntries;
  };
    
    return memoizedSearch;
  }, [entries]);

  // Get entries by type
  const getEntriesByType = (type) => {
    return entries.filter(entry => entry.type === type);
  };

  // Get offline pack entries
  const getOfflinePackEntries = () => {
    return entries.filter(entry => entry.offline && entry.offline.pack_include);
  };

  // Export entries (respects current filters + search when present)
  const exportEntries = () => {
    let toExport = entries;
    try {
      const rawFilters = localStorage.getItem('entry_filter_snapshot');
      const rawQuery = localStorage.getItem('entry_search_query');
      const filters = rawFilters ? JSON.parse(rawFilters) : {};
      const query = rawQuery ? String(rawQuery) : '';

      const hasActiveFilters = !!filters && Object.keys(filters).some((k) => {
        const v = filters[k];
        // Treat 'all', undefined, null, '' as not active
        if (v === undefined || v === null) return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        if (typeof v === 'string' && v === 'all') return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      });
      const hasQuery = typeof query === 'string' && query.trim().length > 0;

      if (hasActiveFilters || hasQuery) {
        const runSearch = (q, f) => {
          let filtered = [...entries];
          // Reuse the same filtering rules as searchEntries
          // Apply basic text search if query present using the same logic by delegating to searchEntries
          try {
            const searchFn = (searchEntries); // closure var above in hook
            if (typeof searchFn === 'function') {
              return searchFn(q, f);
            }
          } catch {}
          return filtered;
        };
        toExport = runSearch(query, filters);
      }
    } catch (e) {
      // If anything fails, default to exporting all entries
      toExport = entries;
    }

    const dataStr = JSON.stringify(toExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const suffix = (toExport && toExport.length ? `${toExport.length}-items` : 'all');
    link.download = `KB-existing-entries-${suffix}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportSingleEntry = (entry) => {
    if (!entry) return;
    const dataStr = JSON.stringify([entry], null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.entry_id}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import entries
  const importEntries = async (jsonData, userInfo = null) => {
    try {
      const parsed = JSON.parse(jsonData);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (!list || list.length === 0) return { success: false, error: 'No entries found in file' };
      
      // For the new workflow, we'll process the first entry and return it for form population
      const entry = list[0];
      if (!entry || typeof entry !== 'object') {
        return { success: false, error: 'Invalid entry format' };
      }
      
      // Check if entry has at least one of the required fields for a valid entry
      const hasRequiredFields = entry.title || entry.citation || entry.entry_id || entry.url;
      if (!hasRequiredFields) {
        return { success: false, error: 'Entry must have at least one of: title, citation, entry_id, or url' };
      }
      
      // Check if entry already exists (optional - don't block import if API fails)
      // Only check for duplicates if entry_id is provided
      if (entry.entry_id) {
        try {
          const existing = await fetchAllEntriesFromDb();
          const existingIds = new Set((existing || []).map((e) => e.entry_id));
          
          if (existingIds.has(entry.entry_id)) {
            return { success: false, error: `Entry with ID "${entry.entry_id}" already exists` };
          }
        } catch (err) {
          console.warn('Could not check for existing entries, proceeding with import:', err);
          // Continue with import even if duplicate check fails
        }
      }
      
      // Prepare the entry data for form population
      const { id, entry_id, ...entryWithoutIds } = entry; // Remove any provided IDs
      const formData = {
        ...entryWithoutIds,
        // Override with user info for created_by fields
        created_by: userInfo?.personId ? Number(String(userInfo.personId).replace('P','')) : (entry.created_by && entry.created_by !== 0 ? entry.created_by : 5),
        created_by_name: userInfo?.name || userInfo?.username || entry.created_by_name || 'Imported User',
        created_by_username: userInfo?.username,
        // Set verification status for imported entries
        verified: false,
        verified_at: null,
        verified_by: null,
        // Always set last_reviewed to today, ignoring any imported value
        last_reviewed: new Date().toISOString().slice(0, 10),
      };
      
      // Clear all existing drafts and replace with imported entry
      try {
        localStorage.removeItem('kb_entry_draft');
        localStorage.removeItem('kb_draft');
        localStorage.removeItem('kb_drafts');
        localStorage.setItem('kb_entry_draft', JSON.stringify(formData));
        console.log('Cleared all existing drafts and set imported entry as new draft');
      } catch (e) {
        console.error('Failed to clear/set draft:', e);
      }
      
      console.log('Import successful, returning form data:', formData);
      return { success: true, data: formData };
    } catch (err) {
      console.error('Error importing entries:', err);
      throw new Error('Failed to import entries');
    }
  };

  // Clear all entries
  const clearAllEntries = () => {
    setEntries([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setTeamProgress({});
    setDailyQuotas({});
  };

  // Get storage statistics
  const getStorageStats = () => {
    const totalEntries = entries.length;
    const offlinePackEntries = getOfflinePackEntries().length;
    const sizeInBytes = new Blob([JSON.stringify(entries)]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    
    // Calculate progress towards 1,500 goal
    const progressPercentage = Math.min((totalEntries / 1500) * 100, 100);
    
    return {
      totalEntries,
      offlinePackEntries,
      sizeInKB,
      progressPercentage,
      remainingEntries: Math.max(0, 1500 - totalEntries)
    };
  };

  // Team progress tracking
  const updateTeamProgress = (teamMemberId, entryType) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${teamMemberId}_${today}`;
    
    setTeamProgress(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [entryType]: (prev[key]?.[entryType] || 0) + 1,
        total: (prev[key]?.total || 0) + 1
      }
    }));
  };

  const decrementTeamProgress = (teamMemberId, entryType) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${teamMemberId}_${today}`;
    
    setTeamProgress(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [entryType]: Math.max(0, (prev[key]?.[entryType] || 0) - 1),
        total: Math.max(0, (prev[key]?.total || 0) - 1)
      }
    }));
  };

  // Get team member progress for today
  const getTeamMemberProgress = (teamMemberId) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${teamMemberId}_${today}`;
    return teamProgress[key] || { total: 0 };
  };

  // Get all team progress for today
  const getAllTeamProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = {};
    
    for (let i = 1; i <= 5; i++) {
      const key = `${i}_${today}`;
      todayProgress[i] = teamProgress[key] || { total: 0 };
    }
    
    return todayProgress;
  };

  // Get yesterday's team progress
  const getYesterdayTeamProgress = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayProgress = {};
    
    for (let i = 1; i <= 5; i++) {
      const key = `${i}_${yesterdayDate}`;
      yesterdayProgress[i] = teamProgress[key] || { total: 0 };
    }
    
    return yesterdayProgress;
  };

  // Check if a team member completed their daily quota
  const checkDailyCompletion = (teamMemberId, entryType) => {
    // Compute plan day key using 8 AM rollover
    const { getPlanDate, toISODate, computeDayIndex, rowsForDay } = require('../lib/plan/planLoader');
    const planDateISO = toISODate(getPlanDate(new Date()));
    const key = `${teamMemberId}_${planDateISO}`;
    const currentProgress = teamProgress[key] || { total: 0 };

    // Determine quotas for this member from the active plan JSON
    const day1FromWindow = (typeof window !== 'undefined' && window.__KB_DAY1__) ? window.__KB_DAY1__ : require('../lib/plan/config').KB_PROJECT_START.toISOString().split('T')[0];
    const dayIndex = computeDayIndex(new Date(), day1FromWindow);
    const planRows = (window.__KB_PLAN__ && Array.isArray(window.__KB_PLAN__)) ? window.__KB_PLAN__ : [];
    const rows = rowsForDay(planRows, dayIndex);
    const personCode = `P${teamMemberId}`;
    const row = rows.find(r => String(r.Person).trim().toUpperCase() === personCode);
    if (!row) return false;
    const quotas = {
      statute_section: Number(row.statute_section || 0),
      rule_of_court: Number(row.rule_of_court || 0),
      rights_advisory: Number(row.rights_advisory || 0),
      constitution_provision: Number(row.constitution_provision || 0),
      agency_circular: Number(row.agency_circular || 0),
      doj_issuance: Number(row.doj_issuance || 0),
      executive_issuance: Number(row.executive_issuance || 0),
      city_ordinance_section: Number(row.city_ordinance_section || 0)
    };
    const totalQuota = Object.values(quotas).reduce((s, n) => s + (Number(n) || 0), 0);

    const newTotal = (currentProgress.total || 0) + 1;
    const newTypeCount = (currentProgress[entryType] || 0) + 1;
    if (newTotal === totalQuota) return true;
    if (quotas[entryType] && newTypeCount === quotas[entryType]) return true;
    return false;
  };

  // Reset daily quotas (call this at the start of each day)
  const resetDailyQuotas = () => {
    // Use 8 AM boundary for plan date calculation
    const { getPlanDate, toISODate } = require('../lib/plan/planLoader');
    const today = toISODate(getPlanDate(new Date()));
    
    // Update the last reset date
    setDailyQuotas(prev => ({
      ...prev,
      lastReset: today
    }));

    // Clear any old team progress data (older than 7 days to keep some history)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

    setTeamProgress(prev => {
      const cleanedProgress = {};
      Object.keys(prev).forEach(key => {
        const datePart = key.split('_')[1]; // Extract date from key like "1_2025-08-17"
        if (datePart >= cutoffDate) {
          cleanedProgress[key] = prev[key];
        }
      });
      return cleanedProgress;
    });

    console.log('Daily quotas reset for', today);
  };

  return {
    entries, loading, error, clearError, addEntry, updateEntry, deleteEntry,
    getEntryById, getEntryByEntryId, searchEntries, getEntriesByType,
    getOfflinePackEntries, exportEntries, exportSingleEntry, importEntries, clearAllEntries,
    getStorageStats, getTeamMemberProgress, getAllTeamProgress, resetDailyQuotas,
    updateTeamProgress, decrementTeamProgress, getYesterdayTeamProgress, checkDailyCompletion
  };
};

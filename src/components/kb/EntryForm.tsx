import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntrySchema, Entry, TypeEnum, validateBusinessRules } from 'lib/civilify-kb-schemas';
import { useNavigate, useParams } from 'react-router-dom';
// Using regular textarea to avoid external dependency
// import { LegalBasisPicker } from './fields/LegalBasisPicker';

import EntryPreview from './EntryPreview';
import { EntryStepper, type Step } from './EntryStepper';
import { StepTypeSpecific } from './steps/StepTypeSpecific';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { DuplicateMatchesToast } from '../ui/Toast';
import Modal from '../Modal/Modal';
import { FileText, ArrowRight, X, CalendarDays, BookText, Layers, FileCheck } from 'lucide-react';
import { generateEntryId, generateUniqueEntryId } from 'lib/kb/entryId';
import './EntryForm.css';
import { semanticSearch } from '../../services/vectorApi';
import { useAuth } from '../../contexts/AuthContext';

type EntryFormProps = {
  entry?: Partial<Entry> | null;
  existingEntries?: Array<{ id: string; title: string; entry_id: string; type: string }>;
  onSave: (data: Entry) => void;
  onCancel: () => void;
  onShowIncompleteEntriesModal?: (entryData: Entry) => void;
  isUpdatingEntry?: boolean;
};

// Validation error type for required fields
interface ValidationError {
  field: string;
  message: string;
  step: number;
  stepName: string;
}

// Function to validate all required fields and map them to steps
function validateAllRequiredFields(data: Entry): ValidationError[] {
  const errors: ValidationError[] = [];

  // Step 1: Basics
  const step1Fields: (keyof Entry)[] = ['title'];
  step1Fields.forEach(field => {
    if (!data[field as keyof Entry] || (typeof data[field as keyof Entry] === 'string' && (data[field as keyof Entry] as string).trim() === '')) {
      errors.push({
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        step: 1,
        stepName: 'Basics'
      });
    }
  });

  // Step 2: Sources & Dates
  const step2Fields: (keyof Entry | 'amendment_date')[] = ['amendment_date'];
  step2Fields.forEach(field => {
    if (field === 'source_urls') {
      if (!data.source_urls || data.source_urls.length === 0) {
        errors.push({
          field,
          message: 'At least one source URL is required',
          step: 2,
          stepName: 'Sources & Dates'
        });
      }
    } else if (field === 'amendment_date' && data.status === 'amended') {
      if (!data.amendment_date) {
        errors.push({
          field,
          message: 'Amendment date is required when status is amended',
          step: 2,
          stepName: 'Sources & Dates'
        });
      }
    }
  });

  // Step 3: Content
  const step3Fields: (keyof Entry)[] = [];
  step3Fields.forEach(field => {
    if (!data[field as keyof Entry] || (typeof data[field as keyof Entry] === 'string' && (data[field as keyof Entry] as string).trim() === '')) {
      errors.push({
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        step: 3,
        stepName: 'Content'
      });
    }
  });

  // Step 4: Type-Specific & Relations
  const step4Fields: (keyof Entry)[] = [];
  step4Fields.forEach(field => {
    if (field === 'tags') {
      if (!data.tags || data.tags.length === 0) {
        errors.push({
          field,
          message: 'At least one tag is required',
          step: 4,
          stepName: 'Type-Specific & Relations'
        });
      }
    } else if (field === 'last_reviewed') {
      if (!data.last_reviewed || (typeof data.last_reviewed === 'string' && data.last_reviewed.trim() === '')) {
        errors.push({
          field,
          message: 'Last reviewed date is required',
          step: 4,
          stepName: 'Type-Specific & Relations'
        });
      }
    }
  });

  // Type-specific required fields validation
  switch (data.type) {
    case 'constitution_provision':
      if (!(data as any).topics || (data as any).topics.length === 0) {
        errors.push({
          field: 'topics',
          message: 'At least one topic is required for constitution provision',
          step: 4,
          stepName: 'Type-Specific & Relations'
        });
      }
      break;
    case 'statute_section':
      // Temporarily disabled for testing
      // if (!(data as any).elements || (data as any).elements.length === 0) {
      //   errors.push({
      //     field: 'elements',
      //     message: 'At least one element is required for statute section',
      //     step: 4,
      //     stepName: 'Type-Specific & Relations'
      //   });
      // }
      // if (!(data as any).penalties || (data as any).penalties.length === 0) {
      //   errors.push({
      //     field: 'penalties',
      //     message: 'At least one penalty is required for statute section',
      //     step: 4,
      //     stepName: 'Type-Specific & Relations'
      //   });
      // }
      break;
    case 'city_ordinance_section':
      break;
    case 'rule_of_court':
      break;
    case 'agency_circular':
      break;
    case 'doj_issuance':
      break;
    case 'executive_issuance':
      break;
    case 'rights_advisory':
      break;
  }

  return errors;
}

// Utilities
const toTitleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|\s|[-'])\p{L}/gu, (m: string) => m.toUpperCase())
    .replace(/\b(And|Of|The)\b/g, (m) => m.toLowerCase());

const stepListBase: Step[] = [
  { id: 1, name: 'Basics', description: 'Basic information' },
  { id: 2, name: 'Sources & Dates', description: 'Citations and effective dates' },
  { id: 3, name: 'Content', description: 'Summary and legal text' },
  { id: 4, name: 'Type-Specific & Relations', description: 'Fields based on entry type' },
  { id: 5, name: 'Review & Publish', description: 'Final check before saving' },
];

export default function EntryFormTS({ entry, existingEntries = [], onSave, onCancel, onShowIncompleteEntriesModal, isUpdatingEntry = false }: EntryFormProps) {
  // Runtime-debug helper: enable by setting localStorage/sessionStorage kb_debug = '1'
  const debugLog = (...args: any[]) => {
    try {
      const on = (typeof window !== 'undefined') && (localStorage.getItem('kb_debug') === '1' || sessionStorage.getItem('kb_debug') === '1');
      if (on) console.log(...args);
    } catch {}
  };
  const { user } = useAuth();

  // Explicit mode detection
  // Check if this is an imported entry (has entry_id but no id field) vs existing entry (has id field)
  // Also check if we're on a /law-entry/ URL (create mode) vs /entry/ID/edit URL (edit mode)
  const isOnCreateUrl = window.location.pathname.startsWith('/law-entry/');
  // Check if this is an imported entry by looking for importedEntryData in sessionStorage
  const hasImportedData = sessionStorage.getItem('importedEntryData') !== null;
  // For imported entries: they have entry_id but no id field AND we have imported data in sessionStorage
  // OR they're on a create URL with an entry (which means they were imported)
  const isImportedEntry = (entry && entry.entry_id && !(entry as any).id && hasImportedData) || (entry && isOnCreateUrl);
  // Prioritize URL pattern over entry properties for mode detection
  // If we're on a /law-entry/ URL, we're always in create mode (including imported entries)
  // If we're on a /entry/ID/edit URL, we're in edit mode (unless it's an imported entry)
  const isEditMode = !!entry && !isImportedEntry && !isOnCreateUrl;
  const isCreateMode = !entry || isImportedEntry || isOnCreateUrl;

  // Reduced logging for performance
  if (process.env.NODE_ENV === 'development') {
  console.log('EntryForm mode detection:', {
    isEditMode,
    isCreateMode,
    isImportedEntry,
    isOnCreateUrl,
    hasImportedData,
    entryHasId: !!(entry as any)?.id,
    entryHasEntryId: !!entry?.entry_id,
    currentUrl: window.location.pathname,
    entryId: entry?.entry_id || (entry as any)?.id,
    entryType: entry?.type,
    hasIdField: !!(entry as any)?.id
  });
  }

  const navigate = useNavigate();
  const { step } = useParams();

  // Get step from URL params or query string (for edit mode)
  const getInitialStep = () => {
    // For create mode (including imported entries): /law-entry/:step - use URL param directly
    if (isOnCreateUrl && step) {
      return parseInt(step);
    }

    // For edit mode: /entry/:id/edit?step=X - use query string
    if (!isOnCreateUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryStep = urlParams.get('step');
      if (queryStep) {
        return parseInt(queryStep);
      }
    }

    // Default to step 1 for both modes
    return 1;
  };

  const initialStep = getInitialStep();

  const methods = useForm<Entry>({
    resolver: zodResolver(EntrySchema as any),
    defaultValues: {
      type: '',
      entry_id: '',
      title: '',
      jurisdiction: 'PH',
      law_family: '',
      section_id: '',
      canonical_citation: '',
      status: '',
      effective_date: new Date().toISOString().slice(0, 10),
      amendment_date: null,
      summary: '',
      text: '',
      source_urls: [''],
      tags: [],
      last_reviewed: new Date().toISOString().slice(0, 10),
      visibility: { gli: true, cpa: true },
      // Type-specific fields initialization
      elements: [],
      penalties: [],
      defenses: [],
      prescriptive_period: null,
      standard_of_proof: '',
      rule_no: '',
      section_no: '',
      triggers: [],
      time_limits: [],
      required_forms: [],
      circular_no: '',
      applicability: [],
      issuance_no: '',
      instrument_no: '',
      supersedes: [],
      steps_brief: [],
      forms_required: [],
      failure_states: [],
      violation_code: '',
      violation_name: '',
      license_action: '',
      fine_schedule: [],
      apprehension_flow: [],
      incident: '',
      phases: [],
      forms: [],
      handoff: [],
      rights_callouts: [],
      rights_scope: '',
      advice_points: [],
      topics: [],
      jurisprudence: [],
      legal_bases: [],
      related_sections: [],
    } as any,
    mode: 'onChange',
  });



  const { control, register, handleSubmit, watch, setValue, getValues, trigger } = methods;
  const type = watch('type');
  const status = watch('status');
  const lawFamily = watch('law_family');
  const sectionId = watch('section_id');
  const title = watch('title');
  const citation = watch('canonical_citation');
  const effectiveDate = watch('effective_date');
  const entry_id = watch('entry_id');

  // Clear type-specific fields when entry type changes
  const [previousType, setPreviousType] = useState<string | undefined>(type);

  useEffect(() => {
    if (previousType && type && previousType !== type) {
      console.log(`Entry type changed from ${previousType} to ${type}, clearing type-specific fields`);

      // Clear all type-specific fields when type changes with correct default values
      const fieldsToClear = {
        // Array fields
        'elements': [],
        'penalties': [],
        'defenses': [],
        'triggers': [],
        'time_limits': [],
        'required_forms': [],
        'applicability': [],
        'supersedes': [],
        'steps_brief': [],
        'forms_required': [],
        'failure_states': [],
        'fine_schedule': [],
        'apprehension_flow': [],
        'phases': [],
        'forms': [],
        'handoff': [],
        'rights_callouts': [],
        'advice_points': [],
        // 'legal_bases': [], // Preserved across type changes to maintain user citations
        // 'related_sections': [], // Preserved across type changes to maintain user citations
        'topics': [],
        'jurisprudence': [],
        // String fields
        'standard_of_proof': '',
        'rule_no': '',
        'section_no': '',
        'circular_no': '',
        'issuance_no': '',
        'instrument_no': '',
        'violation_code': '',
        'violation_name': '',
        'license_action': '',
        'incident': '',
        'rights_scope': '',
        // Object fields
        'prescriptive_period': null
      };

      Object.entries(fieldsToClear).forEach(([field, defaultValue]) => {
        methods.setValue(field as any, defaultValue);
      });
    }
    setPreviousType(type);
  }, [type, previousType, methods]);

  // Auto-generate entry ID and set last_reviewed for new entries (CREATE MODE ONLY)
  useEffect(() => {
    // Only run in create mode
    if (isCreateMode && !entry_id && type && lawFamily) {
      // Generate unique entry ID based on type, law family, and section ID
      const generateUniqueId = async () => {
        try {
          const existingIds = existingEntries.map(e => e.entry_id);
          const generatedId = await generateUniqueEntryId(type, lawFamily, sectionId || '', existingIds);
          setValue('entry_id', generatedId);
        } catch (error) {
          console.error('Error generating unique entry ID:', error);
          // Fallback to regular generation
          const generatedId = generateEntryId(type, lawFamily, sectionId || '');
          setValue('entry_id', generatedId);
        }
      };

      generateUniqueId();

      // Set last_reviewed to current date for new entries
      const today = new Date().toISOString().slice(0, 10);
      setValue('last_reviewed', today);
    }
  }, [isCreateMode, entry_id, type, lawFamily, sectionId, setValue, existingEntries]);

  // Step 4 always has content (dynamic type-specific + relations)
  const hasTypeSpecific = true;
  const steps = useMemo(() => (hasTypeSpecific ? stepListBase : stepListBase.filter((s) => s.id !== 4)), [hasTypeSpecific]);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const formCardRef = React.useRef<HTMLDivElement | null>(null);

  // Sync current step with URL when editing (only affects edit mode)
  useEffect(() => {
    // Only run this effect in edit mode
    if (!entry) return;

    const urlParams = new URLSearchParams(window.location.search);
    const queryStep = urlParams.get('step');
    if (queryStep) {
      const stepNum = parseInt(queryStep);
      if (stepNum !== currentStep && stepNum >= 1 && stepNum <= 5) {
        setCurrentStep(stepNum);
      }
    }
  }, [entry, currentStep]);
  const [showDraftSaved, setShowDraftSaved] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [showInternalCitationModal, setShowInternalCitationModal] = useState<boolean>(false);
  const [internalCitationModalMessage, setInternalCitationModalMessage] = useState<string>('');
  const [nearDuplicates, setNearDuplicates] = useState<any[]>([]);
  const [searchingDupes, setSearchingDupes] = useState<boolean>(false);
  const [formPopulated, setFormPopulated] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [showDraftLoaded, setShowDraftLoaded] = useState<boolean>(false);
  const [hasAmendment, setHasAmendment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = React.useRef<boolean>(false);
  const [didImportAutosave, setDidImportAutosave] = useState<boolean>(false);

  // Helper function to apply tombstoning to form data before reset
  const applyTombstoning = (data: any) => {
    try {
      const rawT = localStorage.getItem('kb_deleted_relations');
      const tombstones: any[] = rawT ? JSON.parse(rawT) : [];
      if (!Array.isArray(tombstones) || tombstones.length === 0) return data;

      const deletedLB = new Set<string>();
      const deletedRS = new Set<string>();
      
      tombstones.filter(Boolean).forEach(t => {
        const key = String(t?.key || '').toLowerCase();
        const scope = String(t?.scope || '').toLowerCase();
        if (scope.includes('legal_bases')) deletedLB.add(key);
        if (scope.includes('related_sections')) deletedRS.add(key);
      });

      const relationKey = (it: any) => String(it?.entry_id || it?.citation || it?.title || it?.url || JSON.stringify(it)).toLowerCase();
      
      const originalLB = (data.legal_bases || []).length;
      const originalRS = (data.related_sections || []).length;
      
      const result = {
        ...data,
        legal_bases: (data.legal_bases || []).filter((it: any) => !deletedLB.has(relationKey(it))),
        related_sections: (data.related_sections || []).filter((it: any) => !deletedRS.has(relationKey(it)))
      };
      
      const filteredLB = result.legal_bases.length;
      const filteredRS = result.related_sections.length;
      
      if (originalLB !== filteredLB || originalRS !== filteredRS) {
        // Only log in development mode to reduce console spam
        if (process.env.NODE_ENV === 'development') {
          console.log('🗑️ Tombstoning applied:', {
            original: { legal_bases: originalLB, related_sections: originalRS },
            filtered: { legal_bases: filteredLB, related_sections: filteredRS },
            tombstones: tombstones.length
          });
        }
      }
      
      return result;
    } catch {
      return data;
    }
  };

  //

  // Load draft data or reset form when entry prop changes
  useEffect(() => {
    if (entry) {
      if (process.env.NODE_ENV === 'development') {
      console.log('Resetting form with entry data:', entry);
      }

      // Create a comprehensive reset object with all fields
      // Normalize helpers for edit mode
      const normalizeDate = (d: any): any => {
        if (!d) return null;
        if (typeof d === 'string') {
          // If it's already in YYYY-MM-DD format, return as-is
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          
          // If it contains time information, extract only the date part
          if (d.includes('T') || d.includes(' ')) {
            // Try to extract just the date part (YYYY-MM-DD)
            const dateMatch = d.match(/^(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              return dateMatch[1];
            }
          }
          
          // Try to parse as date, but ignore time
          const dt = new Date(d);
          if (!isNaN(dt.getTime())) {
            return dt.toISOString().slice(0, 10);
          }
          
          // If all else fails, return null (will use default)
          return null;
        }
        if (d instanceof Date) return d.toISOString().slice(0, 10);
        return null;
      };

      const normalizeStringArray = (val: any): string[] => {
        if (Array.isArray(val)) return val.filter((v) => typeof v === 'string');
        if (val == null || val === '') return [];
        if (typeof val === 'string') return [val];
        return [];
      };

      // Normalize legacy relations where external items may use `entry_id`
      const normalizeRelations = (arr: any[] | undefined) => {
        if (!Array.isArray(arr)) return [] as any[];
        return arr.map((it) => {
          if (!it) return it;
          // Strings -> assume internal relation id
          if (typeof it === 'string') {
            return { type: 'internal', entry_id: it };
          }
          // Default missing type to internal when entry_id is present
          if (!it.type && it.entry_id) {
            return { ...it, type: 'internal' };
          }
          // Legacy external stored under entry_id
          if (it.type === 'external' && it.entry_id && !it.citation) {
            return { ...it, citation: it.entry_id, entry_id: undefined };
          }
          // Handle external entries with title but no citation (for related_sections)
          if (it.type === 'external' && it.title && !it.citation) {
            return { ...it, citation: it.title };
          }
          // Clean up external entries - remove entry_id field if it's null or empty
          if (it.type === 'external') {
            const { entry_id, ...cleanEntry } = it;
            return cleanEntry;
          }
          // Legacy 'topic' -> new 'title'
          if (it.topic && !it.title) {
            const { topic, ...rest } = it;
            return { ...rest, title: topic };
          }
          return it;
        });
      };

      const resetData = {
        type: entry.type || 'statute_section',
        entry_id: entry.entry_id || '',
        title: entry.title || '',
        jurisdiction: entry.jurisdiction || 'PH',
        law_family: entry.law_family || '',
        section_id: entry.section_id || '',
        canonical_citation: entry.canonical_citation || '',
        status: entry.status || '',
        effective_date: normalizeDate(entry.effective_date) || new Date().toISOString().slice(0, 10),
        amendment_date: normalizeDate(entry.amendment_date),
        summary: entry.summary || '',
        text: entry.text || '',
        source_urls: entry.source_urls && entry.source_urls.length > 0 ? entry.source_urls : [''],
        tags: entry.tags || [],
        last_reviewed: normalizeDate(entry.last_reviewed) || new Date().toISOString().slice(0, 10),
        visibility: { gli: true, cpa: true }, // Always set both GLI and CPA
        // Type-specific fields
        elements: normalizeStringArray((entry as any)?.elements),
        penalties: normalizeStringArray((entry as any)?.penalties),
        defenses: normalizeStringArray((entry as any)?.defenses),
        prescriptive_period: (entry as any)?.prescriptive_period || null,
        standard_of_proof: (entry as any)?.standard_of_proof || '',
        rule_no: (entry as any)?.rule_no || '',
        section_no: (entry as any)?.section_no || '',
        triggers: normalizeStringArray((entry as any)?.triggers),
        time_limits: normalizeStringArray((entry as any)?.time_limits),
        required_forms: normalizeStringArray((entry as any)?.required_forms),
        circular_no: (entry as any)?.circular_no || '',
        applicability: normalizeStringArray((entry as any)?.applicability),
        issuance_no: (entry as any)?.issuance_no || '',
        instrument_no: (entry as any)?.instrument_no || '',
        supersedes: normalizeRelations((entry as any)?.supersedes),
        steps_brief: normalizeStringArray((entry as any)?.steps_brief),
        forms_required: normalizeStringArray((entry as any)?.forms_required),
        failure_states: normalizeStringArray((entry as any)?.failure_states),
        violation_code: (entry as any)?.violation_code || '',
        violation_name: (entry as any)?.violation_name || '',
        license_action: (entry as any)?.license_action || '',
        fine_schedule: Array.isArray((entry as any)?.fine_schedule) ? (entry as any)?.fine_schedule : [],
        apprehension_flow: normalizeStringArray((entry as any)?.apprehension_flow),
        incident: (entry as any)?.incident || '',
        phases: Array.isArray((entry as any)?.phases) ? (entry as any)?.phases : [],
        forms: normalizeStringArray((entry as any)?.forms),
        handoff: normalizeStringArray((entry as any)?.handoff),
        rights_callouts: normalizeStringArray((entry as any)?.rights_callouts),
        rights_scope: (entry as any)?.rights_scope || '',
        advice_points: normalizeStringArray((entry as any)?.advice_points),
        topics: normalizeStringArray((entry as any)?.topics),
        jurisprudence: normalizeStringArray((entry as any)?.jurisprudence),
        legal_bases: normalizeRelations((entry as any)?.legal_bases),
        related_sections: normalizeRelations((entry as any)?.related_sections),
      };

      if (process.env.NODE_ENV === 'development') {
      console.log('Comprehensive reset data:', resetData);
      }
      methods.reset(applyTombstoning(resetData) as any);

      // Set amendment state for edit mode
      setHasAmendment(!!entry.amendment_date);

      // Avoid mutating field values to trigger duplicate detection; rely on natural watch
      // Only encourage a detection by dispatching a lightweight event if title is pristine
      if (isOnCreateUrl) {
        try {
          const titleState = methods.getFieldState('title');
          const currentTitle = resetData.title;
          if (!titleState.isDirty && currentTitle && currentTitle.length >= 3) {
            setTimeout(() => window.dispatchEvent(new Event('refresh-progress')), 150);
          }
        } catch {}
      }
    } else if (isCreateMode) {
      // Try to load draft data for new entries (CREATE MODE ONLY)
      // First check for imported data in sessionStorage
      try {
        const importedData = sessionStorage.getItem('importedEntryData');
        if (importedData) {
          const parsed = JSON.parse(importedData);
          if (process.env.NODE_ENV === 'development') {
          console.log('Loading imported data for new entry:', parsed);
          }

          // Use the same normalization logic as the entry prop
          const normalizeDate = (d: any): any => {
            if (!d) return null;
            if (typeof d === 'string') {
              if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
              const dt = new Date(d);
              return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
            }
            if (d instanceof Date) return d.toISOString().slice(0, 10);
            return null;
          };

          const normalizeStringArray = (val: any): string[] => {
            if (Array.isArray(val)) return val.filter((v) => typeof v === 'string');
            if (val == null || val === '') return [];
            if (typeof val === 'string') return [val];
            return [];
          };

          const normalizeRelations = (arr: any[] | undefined) => {
            if (!Array.isArray(arr)) return [] as any[];
            return arr.map((it) => {
              if (!it) return it;
              if (typeof it === 'string') {
                return { type: 'internal', entry_id: it };
              }
              if (!it.type && it.entry_id) {
                return { ...it, type: 'internal' };
              }
              if (it.type === 'external' && it.entry_id && !it.citation) {
                return { ...it, citation: it.entry_id, entry_id: undefined };
              }
              if (it.type === 'external' && it.title && !it.citation) {
                return { ...it, citation: it.title };
              }
              if (it.type === 'external') {
                const { entry_id, ...cleanEntry } = it;
                return cleanEntry;
              }
              if (it.topic && !it.title) {
                const { topic, ...rest } = it;
                return { ...rest, title: topic };
              }
              return it;
            });
          };

          let resetData = {
            type: parsed.type || 'statute_section',
            entry_id: parsed.entry_id || '',
            title: parsed.title || '',
            jurisdiction: parsed.jurisdiction || 'PH',
            law_family: parsed.law_family || '',
            section_id: parsed.section_id || '',
            canonical_citation: parsed.canonical_citation || '',
            status: parsed.status || '',
            effective_date: normalizeDate(parsed.effective_date) || new Date().toISOString().slice(0, 10),
            amendment_date: normalizeDate(parsed.amendment_date),
            summary: parsed.summary || '',
            text: parsed.text || '',
            source_urls: parsed.source_urls && parsed.source_urls.length > 0 ? parsed.source_urls : [''],
            tags: parsed.tags || [],
            last_reviewed: normalizeDate(parsed.last_reviewed) || new Date().toISOString().slice(0, 10),
            visibility: { gli: true, cpa: true },
            // Type-specific fields
            elements: normalizeStringArray(parsed?.elements),
            penalties: normalizeStringArray(parsed?.penalties),
            defenses: normalizeStringArray(parsed?.defenses),
            prescriptive_period: parsed?.prescriptive_period || null,
            standard_of_proof: parsed?.standard_of_proof || '',
            rule_no: parsed?.rule_no || '',
            section_no: parsed?.section_no || '',
            triggers: normalizeStringArray(parsed?.triggers),
            time_limits: normalizeStringArray(parsed?.time_limits),
            required_forms: normalizeStringArray(parsed?.required_forms),
            circular_no: parsed?.circular_no || '',
            applicability: normalizeStringArray(parsed?.applicability),
            issuance_no: parsed?.issuance_no || '',
            instrument_no: parsed?.instrument_no || '',
            supersedes: normalizeRelations(parsed?.supersedes),
            steps_brief: normalizeStringArray(parsed?.steps_brief),
            forms_required: normalizeStringArray(parsed?.forms_required),
            failure_states: normalizeStringArray(parsed?.failure_states),
            violation_code: parsed?.violation_code || '',
            violation_name: parsed?.violation_name || '',
            license_action: parsed?.license_action || '',
            fine_schedule: Array.isArray(parsed?.fine_schedule) ? parsed?.fine_schedule : [],
            apprehension_flow: normalizeStringArray(parsed?.apprehension_flow),
            incident: parsed?.incident || '',
            phases: Array.isArray(parsed?.phases) ? parsed?.phases : [],
            forms: normalizeStringArray(parsed?.forms),
            handoff: normalizeStringArray(parsed?.handoff),
            rights_callouts: normalizeStringArray(parsed?.rights_callouts),
            rights_scope: parsed?.rights_scope || '',
            advice_points: normalizeStringArray(parsed?.advice_points),
            topics: normalizeStringArray(parsed?.topics),
            jurisprudence: normalizeStringArray(parsed?.jurisprudence),
            legal_bases: normalizeRelations(parsed?.legal_bases),
            related_sections: normalizeRelations(parsed?.related_sections),
          };

          if (process.env.NODE_ENV === 'development') {
          console.log('Resetting form with imported data:', resetData);
          }
          // If a local draft exists for this entry, merge user changes on top of imported
          try {
            const rawDraft = localStorage.getItem('kb_entry_draft');
            if (rawDraft) {
              const draft = JSON.parse(rawDraft);
              const sameEntry = (
                (draft?.entry_id && resetData.entry_id && String(draft.entry_id) === String(resetData.entry_id)) ||
                (draft?.title && resetData.title && String(draft.title).trim().toLowerCase() === String(resetData.title).trim().toLowerCase())
              );
              if (sameEntry) {
                // Load deletion tombstones to avoid resurrecting user-deleted relations after import
                let deletedLB = new Set<string>();
                let deletedRS = new Set<string>();
                try {
                  const rawT = localStorage.getItem('kb_deleted_relations');
                  const tombstones: any[] = rawT ? JSON.parse(rawT) : [];
                  if (Array.isArray(tombstones)) {
                    tombstones.filter(Boolean).forEach(t => {
                      const key = String(t?.key || '').toLowerCase();
                      const scope = String(t?.scope || '').toLowerCase();
                      if (scope.includes('legal_bases')) deletedLB.add(key);
                      if (scope.includes('related_sections')) deletedRS.add(key);
                    });
                  }
                } catch {}
                const relationKey = (it: any) => String(it?.entry_id || it?.citation || it?.title || it?.url || JSON.stringify(it)).toLowerCase();
                const prefer = (a: any, b: any) => {
                  // Prefer draft 'a' when it is non-empty/non-null; else keep imported 'b'
                  if (Array.isArray(a)) return a.length ? a : b;
                  if (a === 0) return a;
                  return a != null && a !== '' ? a : b;
                };
                // Merge relations by union while keeping order (imported first, then new from draft)
                const mergeRelations = (base: any[], add: any[], kind: 'lb' | 'rs') => {
                  const deleted = kind === 'lb' ? deletedLB : deletedRS;
                  const cleanedBase = (Array.isArray(base) ? base : []).filter(it => !deleted.has(relationKey(it)));
                  const out: any[] = [...cleanedBase];
                  const seen = new Set(out.map((it: any) => relationKey(it)));
                  (Array.isArray(add) ? add : []).forEach((it: any) => {
                    const key = relationKey(it);
                    if (deleted.has(key)) return; // respect deletions
                    if (!seen.has(key)) {
                      out.push(it);
                      seen.add(key);
                    }
                  });
                  return out;
                };
                resetData = {
                  ...resetData,
                  title: prefer(draft.title, resetData.title),
                  canonical_citation: prefer(draft.canonical_citation, resetData.canonical_citation),
                  law_family: prefer(draft.law_family, resetData.law_family),
                  section_id: prefer(draft.section_id, resetData.section_id),
                  status: prefer(draft.status, resetData.status),
                  effective_date: prefer(draft.effective_date, resetData.effective_date),
                  amendment_date: prefer(draft.amendment_date, resetData.amendment_date),
                  summary: prefer(draft.summary, resetData.summary),
                  text: prefer(draft.text, resetData.text),
                  source_urls: prefer(draft.source_urls, resetData.source_urls),
                  tags: prefer(draft.tags, resetData.tags),
                  legal_bases: mergeRelations(resetData.legal_bases, draft.legal_bases, 'lb'),
                  related_sections: mergeRelations(resetData.related_sections, draft.related_sections, 'rs'),
                } as any;
              }
            }
          } catch {}

          methods.reset(applyTombstoning(resetData) as any);
          setFormPopulated(true);

          // One-time autosave after successful import so user won't lose imported form on refresh
          try {
            if (!didImportAutosave) {
              localStorage.setItem('kb_entry_draft', JSON.stringify(resetData));
              setDidImportAutosave(true);
            }
          } catch {}

          // Do not mutate title to trigger detection; instead emit a custom passive event
          setTimeout(() => {
            try {
              const titleState = methods.getFieldState('title');
              const currentTitle = (methods.getValues() as any).title;
              if (!titleState.isDirty && currentTitle && currentTitle.length >= 3) {
                window.dispatchEvent(new Event('refresh-progress'));
              }
            } catch {}
          }, 200);

          return;
        }
      } catch (e) {
        console.error('Failed to load imported data:', e);
      }

      // Fallback to regular draft data (but not if we just created an entry)
      try {
        // Check if we just created an entry - if so, don't load any draft data
        const justCreated = sessionStorage.getItem('entryJustCreated');
        if (justCreated === '1') {
          // Clear the flag and don't load any draft data
          sessionStorage.removeItem('entryJustCreated');
          console.log('🧹 Entry was just created, skipping draft loading for clean form');
          // Double-check that drafts are cleared
          try {
            localStorage.removeItem('kb_entry_draft');
            localStorage.removeItem('kb_draft');
            localStorage.removeItem('kb_drafts');
            console.log('🧹 Double-checked: cleared any remaining draft data');
          } catch (e) {
            console.warn('Failed to clear drafts in form:', e);
          }
        } else {
          const draftData = localStorage.getItem('kb_entry_draft');
          if (draftData) {
            const parsed = JSON.parse(draftData);
            console.log('📄 Loading draft data for new entry:', parsed);

            // Merge draft data with defaults, preserving user input
            const mergedData = {
            type: parsed.type || 'statute_section',
            entry_id: parsed.entry_id || '',
            title: parsed.title || '',
            jurisdiction: parsed.jurisdiction || 'PH',
            law_family: parsed.law_family || '',
            section_id: parsed.section_id || '',
            canonical_citation: parsed.canonical_citation || '',
            status: parsed.status || '',
            effective_date: parsed.effective_date || new Date().toISOString().slice(0, 10),
            amendment_date: parsed.amendment_date || null,
            summary: parsed.summary || '',
            text: parsed.text || '',
            source_urls: parsed.source_urls && parsed.source_urls.length > 0 ? parsed.source_urls : [''],
            tags: parsed.tags || [],
            last_reviewed: parsed.last_reviewed || new Date().toISOString().slice(0, 10),
            visibility: parsed.visibility || { gli: true, cpa: false },
            // Type-specific fields
            elements: parsed.elements || [],
            penalties: parsed.penalties || [],
            defenses: parsed.defenses || [],
            prescriptive_period: parsed.prescriptive_period || null,
            standard_of_proof: parsed.standard_of_proof || '',
            rule_no: parsed.rule_no || '',
            section_no: parsed.section_no || '',
            triggers: parsed.triggers || [],
            time_limits: parsed.time_limits || [],
            required_forms: parsed.required_forms || [],
            circular_no: parsed.circular_no || '',
            applicability: parsed.applicability || [],
            issuance_no: parsed.issuance_no || '',
            instrument_no: parsed.instrument_no || '',
            supersedes: parsed.supersedes || [],
            steps_brief: parsed.steps_brief || [],
            forms_required: parsed.forms_required || [],
            failure_states: parsed.failure_states || [],
            violation_code: parsed.violation_code || '',
            violation_name: parsed.violation_name || '',
            license_action: parsed.license_action || '',
            fine_schedule: parsed.fine_schedule || [],
            apprehension_flow: parsed.apprehension_flow || [],
            incident: parsed.incident || '',
            phases: parsed.phases || [],
            forms: parsed.forms || [],
            handoff: parsed.handoff || [],
            rights_callouts: parsed.rights_callouts || [],
            rights_scope: parsed.rights_scope || '',
            advice_points: parsed.advice_points || [],
            topics: parsed.topics || [],
            jurisprudence: parsed.jurisprudence || [],
            legal_bases: parsed.legal_bases || [],
            related_sections: parsed.related_sections || [],
          };

            if (process.env.NODE_ENV === 'development') {
            console.log('Merged draft data with defaults:', mergedData);
            }
            methods.reset(applyTombstoning(mergedData) as any);

            // Show notification that draft was loaded (CREATE MODE ONLY)
            setShowDraftLoaded(true);
            setTimeout(() => setShowDraftLoaded(false), 3000);
          } else {
            console.log('📄 No draft data found, starting with clean form');
          }
        }
      } catch (e) {
        console.error('Failed to load draft data:', e);
      }
    }
  }, [entry, methods, isCreateMode]);

  // Auto-generate entry_id based on type, law family, and section id (CREATE MODE ONLY)
  useEffect(() => {
    try {
      if (isCreateMode && lawFamily && type) {
        const eid = generateEntryId(String(type), String(lawFamily), String(sectionId || ''));
        setValue('entry_id', eid as any, { shouldDirty: true } as any);
      }
    } catch (e) {
      // ignore generation errors
    }
  }, [isCreateMode, type, lawFamily, sectionId, setValue]);

  // Jurisdiction UX: PH or Other -> inline input
  const jurisdiction = watch('jurisdiction');
  const isOtherJurisdiction = jurisdiction !== 'PH';

  // Initialize/keep in sync the amendment toggle from form values
  useEffect(() => {
    try {
      const statusVal = (watch('status') as unknown as string) || '';
      const amendDate = watch('amendment_date') as unknown as string | null;
      const shouldBeOn = statusVal === 'amended' || (!!amendDate && String(amendDate).trim().length > 0);
      setHasAmendment(shouldBeOn);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, watch('amendment_date')]);

  // Step validators on next
  const scrollToCardTop = () => {
    try {
      const el = formCardRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    } catch {}
  };

  const goNext = async () => {
    const stepToValidate = currentStep;
    // Jurisdiction validation when Other is chosen
    if (stepToValidate === 1) {
      const j = watch('jurisdiction') as unknown as string;
      const isOther = j !== 'PH';
      if (isOther) {
        const pattern = /^[A-Za-zÀ-ÿ]+(?:[-' ]+[A-Za-zÀ-ÿ]+)*(?: City| Province)?$/;
        const trimmed = (j || '').trim();
        if (trimmed.length < 3 || trimmed.length > 40 || !pattern.test(trimmed)) {
          alert('Enter a valid jurisdiction in Title Case (e.g., Cavite, Quezon City, Baguio).');
          return;
        }
      }
    }
    if (stepToValidate === 2 && status === 'amended' && !watch('amendment_date')) {
      alert("Amendment date is required when status is 'amended'.");
      return;
    }

    // Auto-save draft before moving to next step (for new entries and imported entries)
    if (!entry || isOnCreateUrl) {
      try {
        setIsAutoSaving(true);
        const draft = getValues();
        localStorage.setItem('kb_entry_draft', JSON.stringify(draft));
        if (process.env.NODE_ENV === 'development') {
        console.log('Auto-saved draft before moving to next step');
        }
        setTimeout(() => setIsAutoSaving(false), 1000);
      } catch (e) {
        console.error('Failed to auto-save draft:', e);
        setIsAutoSaving(false);
      }
    }

    // Note: Form data persistence is handled by the main useEffect when entry prop changes
    // No need to reset here as it could interfere with the loaded data

    setCurrentStep((s) => {
      const next = Math.min(steps[steps.length - 1].id, s + 1);
      // Update URL - check if we're in edit mode (but not for imported entries)
      console.log('Navigation debug:', {
        hasEntry: !!entry,
        isImportedEntry,
        isOnCreateUrl,
        currentUrl: window.location.pathname,
        entryId: entry?.entry_id,
        hasIdField: !!(entry as any)?.id,
        next
      });

      // Use URL pattern as primary determinant for navigation
      if (isOnCreateUrl) {
        // We're on a create URL (including imported entries), use regular form URL
        console.log('Navigating to create mode:', `/law-entry/${next}`);
        navigate(`/law-entry/${next}`);
      } else {
        // We're editing an existing entry, maintain edit URL structure
        // Use entry_id instead of id to avoid TypeScript issues
        const entryId = entry ? ((entry as any).id || entry.entry_id) : null;
        if (entryId) {
          console.log('Navigating to edit mode:', `/entry/${entryId}/edit?step=${next}`);
        navigate(`/entry/${entryId}/edit?step=${next}`);
        }
      }
      // Scroll after state updates on next tick
      setTimeout(scrollToCardTop, 0);
      return next;
    });
  };

  const goPrev = () => {
    // Auto-save draft before moving to previous step (for new entries and imported entries)
    if (!entry || isOnCreateUrl) {
      try {
        setIsAutoSaving(true);
        const draft = getValues();
        localStorage.setItem('kb_entry_draft', JSON.stringify(draft));
        if (process.env.NODE_ENV === 'development') {
        console.log('Auto-saved draft before moving to previous step');
        }
        setTimeout(() => setIsAutoSaving(false), 1000);
      } catch (e) {
        console.error('Failed to auto-save draft:', e);
        setIsAutoSaving(false);
      }
    }

    // Note: Form data persistence is handled by the main useEffect when entry prop changes
    // No need to reset here as it could interfere with the loaded data

    setCurrentStep((s) => {
      const prev = Math.max(1, s - 1);
      // Update URL - check if we're in edit mode (but not for imported entries)
      console.log('goPrev Navigation debug:', {
        hasEntry: !!entry,
        isImportedEntry,
        isOnCreateUrl,
        currentUrl: window.location.pathname,
        entryId: entry?.entry_id,
        hasIdField: !!(entry as any)?.id,
        prev
      });

      // Use URL pattern as primary determinant for navigation
      if (isOnCreateUrl) {
        // We're on a create URL (including imported entries), use regular form URL
        console.log('goPrev Navigating to create mode:', `/law-entry/${prev}`);
        navigate(`/law-entry/${prev}`);
      } else {
        // We're editing an existing entry, maintain edit URL structure
        // Use entry_id instead of id to avoid TypeScript issues
        const entryId = entry ? ((entry as any).id || entry.entry_id) : null;
        if (entryId) {
          console.log('goPrev Navigating to edit mode:', `/entry/${entryId}/edit?step=${prev}`);
        navigate(`/entry/${entryId}/edit?step=${prev}`);
        }
      }
      setTimeout(scrollToCardTop, 0);
      return prev;
    });
  };

  // Save draft: persist current form values to localStorage
  const saveDraft = () => {
    try {
      const draft = getValues();
      localStorage.setItem('kb_entry_draft', JSON.stringify(draft));
      setShowDraftSaved(true);
      // Auto-hide after short delay
      setTimeout(() => setShowDraftSaved(false), 1500);
    } catch (e) {
      console.error('Failed to save draft', e);
      setShowDraftSaved(true);
    }
  };
  const requestCancel = () => setShowCancelConfirm(true);
  const confirmCancel = () => {
    // Clear all draft data comprehensively
    try {
      localStorage.removeItem('kb_entry_draft');
      localStorage.removeItem('kb_draft');
      localStorage.removeItem('kb_drafts');
      // Clear any other draft-related keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('kb_entry_') || 
            key.startsWith('entry_draft_') || 
            key.startsWith('kb_draft') ||
            key.includes('draft') ||
            key.includes('autosave')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared all drafts on cancel');
    } catch (e) {
      console.warn('Failed to clear drafts on cancel:', e);
    }
    setShowCancelConfirm(false);
    navigate('/dashboard');
  };
  const abortCancel = () => setShowCancelConfirm(false);

  // Internal citation modal handlers
  const handleInternalCitationModalGoBack = () => {
    setShowInternalCitationModal(false);
    // User wants to go back and potentially convert to internal citations
  };

  const handleInternalCitationModalConfirm = async () => {
    console.log('🔍 User confirmed to create entry despite internal citation suggestions');
    setShowInternalCitationModal(false);
    
    // Clear the global flag to prevent the modal from showing again
    try {
      sessionStorage.removeItem('hasInternalSuggestion');
    } catch {}
    
    // Get current form data and proceed with submission
    const formData = getValues();
    console.log('🔍 Re-triggering submission after internal citation modal confirmation:', formData);
    
    // Call the onSubmit function directly with the current form data, skipping internal citation check
    await onSubmit(formData, true);
  };

  // Autosave: only after user input (keyup/change), debounced; CREATE MODE ONLY
  useEffect(() => {
    if (isEditMode) return;

    let hasUserInput = false;
    let debounceId: number | undefined;
    let lastSaved = '';
    let lastSaveTime = 0;
    const MIN_SAVE_INTERVAL = 2000; // Minimum 2 seconds between saves

    const onAnyInput = () => { hasUserInput = true; };
    try { document.addEventListener('input', onAnyInput, { passive: true }); } catch {}

    const subscription = watch(() => {
      // Defer autosave until user has actually typed/changed something manually
      if (!hasUserInput) return;
      if (!methods.formState.isDirty) return;
      
      // Rate limit saves to prevent excessive localStorage writes
      const now = Date.now();
      if (now - lastSaveTime < MIN_SAVE_INTERVAL) return;
      
      if (debounceId) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        try {
          const draft = getValues();
          // Apply tombstoning to the draft before saving to prevent deleted citations from being restored
          const tombstonedDraft = applyTombstoning(draft);
          const serialized = JSON.stringify(tombstonedDraft);
          if (serialized !== lastSaved) {
            setIsAutoSaving(true);
            localStorage.setItem('kb_entry_draft', serialized);
            lastSaved = serialized;
            lastSaveTime = Date.now();
            setTimeout(() => setIsAutoSaving(false), 400);
          }
        } catch (e) {
          console.error('Failed to auto-save draft on change:', e);
          setIsAutoSaving(false);
        }
      }, 1500) as unknown as number; // Increased debounce from 600ms to 1500ms
    });

    return () => {
      subscription.unsubscribe();
      if (debounceId) window.clearTimeout(debounceId);
      try { document.removeEventListener('input', onAnyInput as any); } catch {}
    };
  }, [watch, getValues, entry, isEditMode, methods]);

  // Check for internal citation suggestions in legal_bases and related_sections
  const checkForInternalCitationSuggestions = (data: Entry): { hasSuggestions: boolean; message: string } => {
    const dataAny = data as any;
    const legalBases = dataAny.legal_bases || [];
    const relatedSections = dataAny.related_sections || [];
    
    console.log('🔍 Checking for internal citation suggestions:', {
      legalBases: legalBases.map((item: any, index: number) => ({ 
        index: index + 1,
        type: item?.type, 
        hasSuggestion: item?._hasInternalSuggestion,
        title: item?.title || item?.citation 
      })),
      relatedSections: relatedSections.map((item: any, index: number) => ({ 
        index: index + 1,
        type: item?.type, 
        hasSuggestion: item?._hasInternalSuggestion,
        title: item?.title || item?.citation 
      }))
    });
    
    // Find external citations with internal suggestions and their indices
    const legalBasesWithSuggestions: number[] = [];
    const relatedSectionsWithSuggestions: number[] = [];
    
    legalBases.forEach((item: any, index: number) => {
      if (item && item.type === 'external' && (item._hasInternalSuggestion || (item.citation && item.title))) {
        legalBasesWithSuggestions.push(index + 1); // 1-based numbering
        console.log(`🔍 Found Legal Bases External Citation #${index + 1} with suggestions:`, item.title || item.citation);
      }
    });
    
    relatedSections.forEach((item: any, index: number) => {
      if (item && item.type === 'external' && (item._hasInternalSuggestion || (item.citation && item.title))) {
        relatedSectionsWithSuggestions.push(index + 1); // 1-based numbering
        console.log(`🔍 Found Related Section External Citation #${index + 1} with suggestions:`, item.title || item.citation);
      }
    });
    
    // Also respect a global session flag set by match detection to avoid timing issues
    let globalFlag = false;
    try {
      globalFlag = sessionStorage.getItem('hasInternalSuggestion') === 'true';
    } catch {}

    const hasSuggestions = legalBasesWithSuggestions.length > 0 || relatedSectionsWithSuggestions.length > 0 || globalFlag;
    
    // Build the message
    let message = '';
    if (hasSuggestions) {
      // Use a clear, generic prompt without counts
      message = 'There are still external citations that might exist in the KB. Are you sure you want to ignore and not add them as internal?';
    }
    
    console.log('🔍 Internal citation suggestions result:', {
      legalBasesWithSuggestions,
      relatedSectionsWithSuggestions,
      hasSuggestions,
      message,
      globalFlag,
      legalBasesCount: legalBases.length,
      relatedSectionsCount: relatedSections.length,
      legalBasesExternal: legalBases.filter((item: any) => item && item.type === 'external').length,
      relatedSectionsExternal: relatedSections.filter((item: any) => item && item.type === 'external').length
    });
    
    return { hasSuggestions, message };
  };

  const onSubmit = async (data: Entry, skipInternalCitationCheck: boolean = false) => {
    // Prevent multiple submissions using both state and ref
    if (isSubmitting || isSubmittingRef.current) {
      console.log('Form submission already in progress, ignoring duplicate submission');
      return;
    }

    debugLog('🚀 FORM SUBMISSION STARTED');
    debugLog('📝 Form mode:', { isEditMode, isCreateMode, hasEntry: !!entry });
    debugLog('📊 Form data:', data);

    setIsSubmitting(true);
    isSubmittingRef.current = true;






    debugLog('Form data being submitted:', data);
    debugLog('Form data type:', typeof data);
    debugLog('Form data keys:', Object.keys(data));




    // First, validate all required fields
    const validationErrors = validateAllRequiredFields(data);

    if (validationErrors.length > 0) {
      // Create alert message
      const errorMessage = validationErrors.map((error: any) => 
        `${error.field} (Step ${error.step}: ${error.stepName})`
      ).join('\n');

      alert(`Missing required fields:\n${errorMessage}`);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }

    // Normalize string fields to prevent null values
    const normalizeStringField = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    };

    // Normalize relations to fix entry_id: null issues
    const normalizeRelations = (arr: any[] | undefined) => {
      if (!Array.isArray(arr)) return [] as any[];
      return arr.map((it) => {
        if (!it) return it;
        // Strings -> assume internal relation id
        if (typeof it === 'string') {
          return { type: 'internal', entry_id: it };
        }
        // Default missing type to internal when entry_id is present
        if (!it.type && it.entry_id) {
          return { ...it, type: 'internal' };
        }
        // Legacy external stored under entry_id
        if (it.type === 'external' && it.entry_id && !it.citation) {
          return { ...it, citation: it.entry_id, entry_id: undefined };
        }
        // Handle external entries with title but no citation (for related_sections)
        if (it.type === 'external' && it.title && !it.citation) {
          return { ...it, citation: it.title };
        }
        // Clean up external entries - remove entry_id field if it's null or empty
        if (it.type === 'external') {
          const { entry_id, ...cleanEntry } = it;
          return cleanEntry;
        }
        // Legacy 'topic' -> new 'title'
        if (it.topic && !it.title) {
          const { topic, ...rest } = it;
          return { ...rest, title: topic };
        }
        return it;
      });
    };

    // Type-specific field mapping
    const typeSpecificFields: Record<string, string[]> = {
      constitution_provision: ['topics', 'related_sections', 'jurisprudence'],
      statute_section: ['elements', 'penalties', 'defenses', 'prescriptive_period', 'standard_of_proof', 'related_sections', 'legal_bases'],
      city_ordinance_section: ['elements', 'penalties', 'defenses', 'related_sections', 'legal_bases'],
      rule_of_court: ['rule_no', 'section_no', 'triggers', 'time_limits', 'required_forms', 'related_sections'],
      agency_circular: ['circular_no', 'section_no', 'applicability', 'legal_bases', 'supersedes'],
      doj_issuance: ['issuance_no', 'applicability', 'legal_bases', 'supersedes'],
      executive_issuance: ['instrument_no', 'applicability', 'legal_bases', 'supersedes'],
      rights_advisory: ['rights_scope', 'advice_points', 'legal_bases', 'related_sections'],
    };

    const sanitized: Entry = {
      ...data,
      // Normalize common string fields to prevent null values
      title: normalizeStringField(data.title),
      canonical_citation: normalizeStringField(data.canonical_citation),
      summary: normalizeStringField(data.summary),
      text: normalizeStringField(data.text),
      law_family: normalizeStringField(data.law_family),
      section_id: normalizeStringField(data.section_id),
      status: normalizeStringField(data.status),
      source_urls: (data as any).source_urls?.filter((u: string) => !!u && u.trim().length > 0) || [],
      tags: (data as any).tags?.filter((t: string) => !!t && t.trim().length > 0) || [],
      // Normalize relations to fix entry_id: null issues
      legal_bases: normalizeRelations((data as any).legal_bases),
      related_sections: normalizeRelations((data as any).related_sections),
    } as any;

    // Only normalize type-specific string fields that are relevant for this entry type
    const relevantFields = typeSpecificFields[data.type] || [];
    const typeSpecificStringFields = ['standard_of_proof', 'rule_no', 'section_no', 'circular_no', 'issuance_no', 'instrument_no', 'violation_code', 'violation_name', 'license_action', 'incident', 'rights_scope'];
    
    typeSpecificStringFields.forEach(field => {
      if (relevantFields.includes(field)) {
        (sanitized as any)[field] = normalizeStringField((data as any)[field]);
      }
    });

    // Debug logging for source_urls and relations
    debugLog('Raw form data source_urls:', (data as any).source_urls);
    debugLog('Sanitized source_urls:', sanitized.source_urls);
    debugLog('Sanitized source_urls type:', typeof sanitized.source_urls);
    debugLog('🔧 Entry type:', data.type);
    debugLog('🔧 Relevant fields for this type:', relevantFields);
    debugLog('🔧 Type-specific string fields being normalized:', typeSpecificStringFields.filter(field => relevantFields.includes(field)));
    debugLog('🔧 Normalized standard_of_proof:', (sanitized as any).standard_of_proof, 'Type:', typeof (sanitized as any).standard_of_proof);
    debugLog('Sanitized source_urls length:', sanitized.source_urls?.length);
    debugLog('Raw form data legal_bases:', (data as any).legal_bases);
    debugLog('Sanitized legal_bases:', (sanitized as any).legal_bases);
    debugLog('Raw form data related_sections:', (data as any).related_sections);
    debugLog('Sanitized related_sections:', (sanitized as any).related_sections);

    // Remove deprecated keys
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((sanitized as any).offline) delete (sanitized as any).offline;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Publish gating
    if (!sanitized.source_urls || sanitized.source_urls.length < 1) {
      alert('Please add at least one Source URL before publishing.');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }

    // Rights advisory requires at least one legal basis
    if ((sanitized as any).type === 'rights_advisory') {
      const lbs = (sanitized as any).legal_bases || [];
      if (!Array.isArray(lbs) || lbs.length < 1) {
        alert('Rights Advisory entries require at least one legal basis.');
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }
    }

    debugLog('Validating business rules...');
    const errs = validateBusinessRules(sanitized);
    if (errs.length) {
      console.log('Business rule validation errors:', errs);
      alert(errs.join('\n'));
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }
    debugLog('Business rules validation passed');

    // Additional validation for imported entries
    debugLog('Validating imported entry data...');
    const sanitizedAny = sanitized as any;
    debugLog('Legal bases:', sanitizedAny.legal_bases);
    debugLog('Related sections:', sanitizedAny.related_sections);

    // Check for invalid external entries
    const invalidExternalEntries: string[] = [];

    // Check legal_bases
    if (sanitizedAny.legal_bases) {
      sanitizedAny.legal_bases.forEach((item: any, index: number) => {
        if (item && item.type === 'external' && (!item.citation || item.citation.trim() === '')) {
          invalidExternalEntries.push(`Legal Basis ${index + 1}: External entries require a citation`);
        }
        if (item && item.type === 'internal' && (!item.entry_id || item.entry_id.trim() === '')) {
          invalidExternalEntries.push(`Legal Basis ${index + 1}: Internal entries require an entry_id`);
        }
      });
    }

    // Check related_sections
    if (sanitizedAny.related_sections) {
      sanitizedAny.related_sections.forEach((item: any, index: number) => {
        if (item && item.type === 'external' && (!item.citation || item.citation.trim() === '')) {
          invalidExternalEntries.push(`Related Section ${index + 1}: External entries require a citation`);
        }
        if (item && item.type === 'internal' && (!item.entry_id || item.entry_id.trim() === '')) {
          invalidExternalEntries.push(`Related Section ${index + 1}: Internal entries require an entry_id`);
        }
      });
    }

    if (invalidExternalEntries.length > 0) {
      debugLog('Invalid external entries found:', invalidExternalEntries);
      alert('Validation errors found:\n' + invalidExternalEntries.join('\n'));
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }
    debugLog('Imported entry validation passed');

    // Clear draft
    try {
      localStorage.removeItem('kb_entry_draft');
    } catch (e) {
      console.error('Failed to clear draft', e);
    }

    const withMember = {
      ...sanitized,
      team_member_id: user?.personId ? Number(String(user.personId).replace('P','')) : undefined,
      created_by: user?.personId ? Number(String(user.personId).replace('P','')) : undefined,
      created_by_name: user?.name || user?.username,
      created_by_username: user?.username,
    } as any;

    debugLog('Form data being sent:', withMember);
    debugLog('Status field value:', withMember.status);
    debugLog('Effective date value:', withMember.effective_date);

    // Check for internal citation suggestions before submission (CREATE MODE ONLY)
    if (isCreateMode && !skipInternalCitationCheck) {
      debugLog('🔍 Checking for internal suggestions in CREATE MODE');
      const suggestionResult = checkForInternalCitationSuggestions(withMember);
      debugLog('🔍 Has internal suggestions:', suggestionResult.hasSuggestions);
      if (suggestionResult.hasSuggestions) {
        debugLog('🔍 Showing internal citation modal with message:', suggestionResult.message);
        setInternalCitationModalMessage(suggestionResult.message);
        setShowInternalCitationModal(true);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }
    } else if (skipInternalCitationCheck) {
      debugLog('🔍 Skipping internal suggestions check - user confirmed to proceed');
    } else {
      debugLog('🔍 Skipping internal suggestions check - not in CREATE MODE');
    }

    // Check if user has incomplete entries from yesterday
    if (onShowIncompleteEntriesModal && isCreateMode) {
      const incompleteEntries = JSON.parse(sessionStorage.getItem('incompleteEntries') || '[]');
      const userHasIncompleteEntries = incompleteEntries.some((incomplete: any) => 
        incomplete.personId === user?.personId || 
        incomplete.personName === user?.name ||
        incomplete.personName === user?.username
      );

      if (userHasIncompleteEntries) {
        // Show modal with entry details instead of saving directly
        onShowIncompleteEntriesModal(withMember);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }
    }

    // Progress tracking is now handled in useLocalStorage.js addEntry function
    // based on the created_at timestamp set in handleSaveEntry

    try {
    await onSave(withMember);
    // Note: Draft clearing is now handled in App.js handleSaveEntry function
    // to ensure it happens at the right time and covers all draft types

    // Dispatch event to refresh progress display
    window.dispatchEvent(new Event('refresh-progress'));

    // Navigation will be handled by the success modal in App.js
    } catch (error) {
      console.error('Error saving entry:', error);
      // Reset submission state on error so user can try again
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      throw error; // Re-throw to let parent handle the error
    }






  };

  const performDuplicateDetection = useCallback(() => {


    // Only disable duplicate detection if we're truly editing an existing entry (has an 'id' field and not on create URL)
    // For ALL entries on create URLs, we should run duplicate detection
    if (entry && (entry as any).id && !isOnCreateUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Disabling duplicate detection for existing entry (has id field, not on create URL)');
      }
      setNearDuplicates([]);
      return;
    }

    // ALWAYS run duplicate detection for entries on create URLs (imported or new)
    if (isOnCreateUrl) {
      debugLog('🔍 On create URL - enabling duplicate detection for all entries');
    }

    // If we don't have an entry at all, this is a new entry
    if (!entry) {
      debugLog('🔍 No entry prop - treating as new entry, enabling duplicate detection');
    }

    const idTokens = [title, lawFamily, sectionId, citation, effectiveDate]
      .filter(Boolean)
      .map(token => String(token).trim())
      .filter(token => token.length > 0);
    const q = idTokens.join(' ').trim();

    debugLog('🔍 Duplicate detection query generation:', {
      title: title || 'no title',
      lawFamily: lawFamily || 'no law family',
      sectionId: sectionId || 'no section id',
      citation: citation || 'no citation',
      effectiveDate: effectiveDate || 'no date',
      idTokens: idTokens,
      query: q
    });



    if (!q) {
      debugLog('🔍 No query generated, clearing duplicates');


      setNearDuplicates([]);
      return;
    }

    // Clear duplicates if title is too short (less than 3 characters)
    if (title && title.length < 3) {
      debugLog('🔍 Title too short, clearing duplicates');


      setNearDuplicates([]);
      return;
    }

    // Force duplicate detection to run for entries on create URLs
    debugLog('🔍 Proceeding with duplicate detection for create URL entry');



    let cancelled = false;
    const t = setTimeout(async () => {



      try {
        debugLog('🔍 Setting searchingDupes to TRUE');


        setSearchingDupes(true);
        debugLog('🔍 Starting semantic search with query:', q);
        debugLog('🔍 Existing entries count:', existingEntries.length);



        // ask for more results, then filter client-side by a threshold
        const resp = await semanticSearch(q, 10);
        debugLog('🔍 Semantic search response:', resp);
        debugLog('🔍 Semantic search success:', resp.success);
        debugLog('🔍 Semantic search results count:', resp.results?.length || 0);





        if (!cancelled) {
          // If semantic search fails or returns no results, try a fallback text search
          let resultsRaw = [];
          if (resp.success && resp.results && Array.isArray(resp.results) && resp.results.length > 0) {
            resultsRaw = resp.results;
            debugLog('🔍 Using semantic search results:', resultsRaw.length);
          } else {
            debugLog('🔍 Semantic search failed or returned no results, trying fallback text search');


            // Fallback: simple text search through existing entries
            const searchTerm = q.toLowerCase();
            resultsRaw = existingEntries
              .filter(entry => {
                const searchableText = [
                  entry.title,
                  (entry as any).canonical_citation,
                  (entry as any).section_id,
                  (entry as any).law_family,
                  (entry as any).summary
                ].filter(Boolean).join(' ').toLowerCase();
                return searchableText.includes(searchTerm);
              })
              .map(entry => ({
                ...entry,
                similarity: 0.35 // Lower default similarity for naive text matches
              }))
              .slice(0, 10);
            debugLog('🔍 Fallback text search results:', resultsRaw.length);


          }
          // Smart stopwords - filter out only the most generic words
          const STOPWORDS = new Set(['the','of','and','or','to','for','in','on','at','by','with','from','into','during','including','until','against','among','throughout','despite','towards','upon']);
          const tokenize = (s: string) => String(s || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
            .filter(w => !STOPWORDS.has(w) && w.length > 2); // Only keep meaningful words

          const normalize = (s: string) => String(s || '')
            .toLowerCase()
            .replace(/[""]/g, '"')
            .replace(/[']/g, "'")
            .replace(/[-–—_()[\].,:/]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          // Enhanced normalization for Roman numerals and common variations
          const enhancedNormalize = (s: string) => {
            let normalized = normalize(s);

            // Roman numeral variations
            normalized = normalized
              .replace(/\b(article|art\.?)\s*([ivxlcdm]+)\b/gi, 'article $2')
              .replace(/\b(article|art\.?)\s*(\d+)\b/gi, 'article $2')
              .replace(/\b(section|sec\.?)\s*([ivxlcdm]+)\b/gi, 'section $2')
              .replace(/\b(section|sec\.?)\s*(\d+)\b/gi, 'section $2');

            // Common abbreviations
            normalized = normalized
              .replace(/\b(article|art\.?)\b/gi, 'article')
              .replace(/\b(section|sec\.?)\b/gi, 'section')
              .replace(/\b(paragraph|para\.?|par\.?)\b/gi, 'paragraph')
              .replace(/\b(subsection|subsec\.?|sub\.?)\b/gi, 'subsection');

            return normalized;
          };

          const compact = (s: string) => enhancedNormalize(s).replace(/\s+/g, '');
          const overlap = (a: string, b: string) => {
            const A = new Set(tokenize(enhancedNormalize(a)));
            const B = new Set(tokenize(enhancedNormalize(b)));
            if (A.size === 0 || B.size === 0) return 0;
            let inter = 0;
            A.forEach(w => { if (B.has(w)) inter++; });
            return inter / Math.min(A.size, B.size);
          };

          // resultsRaw is now set above with fallback logic

          // Debug logging
          debugLog('🔍 Duplicate detection processing:', {

            query: q,
            resultsCount: resultsRaw.length,
            title: title,
            type: type,
            results: resultsRaw.slice(0, 3) // Show first 3 results for debugging
          });


          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 About to filter results with enhanced matching logic...');
          }



          const filtered = resultsRaw.filter((r: any) => {
            const sim = Number(r.similarity || r.score || 0);
            const candidateTokens = [r.title, r.canonical_citation, r.section_id, r.law_family, r.effective_date]
              .filter(Boolean).map(enhancedNormalize).join(' ');
            const candidateCompact = compact(candidateTokens);
            const candidateTitle = enhancedNormalize(String((r.title || r.canonical_citation || '')));
            const sameType = !type || !r.type || r.type === type;

            // Debug logging for each candidate
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 Processing candidate:', {
                title: r.title,
                similarity: sim,
                type: r.type,
                sameType,
                candidateTitle
              });
            }

            // Calculate token overlap for meaningful word similarity
            const tokOverlap = overlap(enhancedNormalize(title || ''), candidateTitle);

            // Basic exact matches
            const exactSection = sectionId && (candidateTokens.includes(enhancedNormalize(sectionId)) || candidateCompact.includes(compact(sectionId)));
            const exactCitation = citation && (candidateTokens.includes(enhancedNormalize(citation)) || candidateCompact.includes(compact(citation)));
            const exactDate = effectiveDate && (candidateTokens.includes(enhancedNormalize(effectiveDate)) || candidateCompact.includes(compact(effectiveDate)));

            // Get current form values for enhanced matching
            const currentValues = methods.getValues() as any;
            const { 
              jurisdiction: currentJurisdiction, 
              violation_code: currentViolationCode, 
              violation_name: currentViolationName,
              tags: currentTags, summary: currentSummary, text: currentText,
              fine_schedule: currentFineSchedule, elements: currentElements,
              legal_bases: currentLegalBases, related_sections: currentRelatedSections,
              jurisprudence: currentJurisprudence, topics: currentTopics, forms: currentForms
            } = currentValues;

            // Enhanced matching parameters
            const exactJurisdiction = currentJurisdiction && r.jurisdiction && enhancedNormalize(currentJurisdiction) === enhancedNormalize(r.jurisdiction);
            const exactLawFamily = lawFamily && r.law_family && enhancedNormalize(lawFamily) === enhancedNormalize(r.law_family);
            const exactViolationCode = currentViolationCode && r.violation_code && enhancedNormalize(currentViolationCode) === enhancedNormalize(r.violation_code);
            const exactViolationName = currentViolationName && r.violation_name && enhancedNormalize(currentViolationName) === enhancedNormalize(r.violation_name);

            // Date range matching (within 1 year)
            const dateRangeMatch = effectiveDate && r.effective_date && (() => {
              try {
                const currentDate = new Date(effectiveDate);
                const candidateDate = new Date(r.effective_date);
                const diffDays = Math.abs(currentDate.getTime() - candidateDate.getTime()) / (1000 * 60 * 60 * 24);
                return diffDays <= 365; // Within 1 year
              } catch {
                return false;
              }
            })();

            // Tag overlap matching
            const tagOverlap = currentTags && r.tags && Array.isArray(currentTags) && Array.isArray(r.tags) && (() => {
              const currentTagsSet = new Set(currentTags.map((t: any) => enhancedNormalize(t)));
              const candidateTags = new Set(r.tags.map((t: any) => enhancedNormalize(t)));
              const intersection = new Set([...currentTagsSet].filter(t => candidateTags.has(t)));
              return intersection.size > 0 && intersection.size / Math.min(currentTagsSet.size, candidateTags.size) >= 0.3;
            })();

            // Summary and text content similarity
            const summarySimilarity = currentSummary && r.summary && (() => {
              const summaryOverlap = overlap(enhancedNormalize(currentSummary), enhancedNormalize(r.summary));
              return summaryOverlap >= 0.4;
            })();

            const textSimilarity = currentText && r.text && (() => {
              const textOverlap = overlap(enhancedNormalize(currentText), enhancedNormalize(r.text));
              return textOverlap >= 0.3;
            })();

            // Fine amount matching (for penalty-related entries)
            const fineAmountMatch = currentFineSchedule && r.fine_schedule && (() => {
              try {
                const currentFines = Array.isArray(currentFineSchedule) ? currentFineSchedule : [];
                const candidateFines = Array.isArray(r.fine_schedule) ? r.fine_schedule : [];
                if (currentFines.length === 0 || candidateFines.length === 0) return false;

                // Check if any fine amounts match (within 10% tolerance)
                return currentFines.some((currentFine: any) => 
                  candidateFines.some((candidateFine: any) => {
                    const currentAmount = parseFloat(currentFine.amount || currentFine);
                    const candidateAmount = parseFloat(candidateFine.amount || candidateFine);
                    if (isNaN(currentAmount) || isNaN(candidateAmount)) return false;
                    const tolerance = Math.max(currentAmount, candidateAmount) * 0.1;
                    return Math.abs(currentAmount - candidateAmount) <= tolerance;
                  })
                );
              } catch {
                return false;
              }
            })();

            // Penalty elements matching
            const penaltyElementsMatch = currentElements && r.elements && (() => {
              try {
                const currentElementsArray = Array.isArray(currentElements) ? currentElements : [];
                const candidateElements = Array.isArray(r.elements) ? r.elements : [];
                if (currentElementsArray.length === 0 || candidateElements.length === 0) return false;

                const currentElementNames = new Set(currentElementsArray.map((e: any) => enhancedNormalize(e.name || e)));
                const candidateElementNames = new Set(candidateElements.map((e: any) => enhancedNormalize(e.name || e)));
                const intersection = new Set([...currentElementNames].filter(name => candidateElementNames.has(name)));
                return intersection.size > 0 && intersection.size / Math.min(currentElementNames.size, candidateElementNames.size) >= 0.4;
              } catch {
                return false;
              }
            })();

            // Legal bases matching
            const legalBasesMatch = currentLegalBases && r.legal_bases && (() => {
              try {
                const currentBases = Array.isArray(currentLegalBases) ? currentLegalBases : [];
                const candidateBases = Array.isArray(r.legal_bases) ? r.legal_bases : [];
                if (currentBases.length === 0 || candidateBases.length === 0) return false;

                const currentBaseIds = new Set(currentBases.map((b: any) => enhancedNormalize(b.entry_id || b.id || b)));
                const candidateBaseIds = new Set(candidateBases.map((b: any) => enhancedNormalize(b.entry_id || b.id || b)));
                const intersection = new Set([...currentBaseIds].filter(id => candidateBaseIds.has(id)));
                return intersection.size > 0 && intersection.size / Math.min(currentBaseIds.size, candidateBaseIds.size) >= 0.5;
              } catch {
                return false;
              }
            })();

            // Related sections matching
            const relatedSectionsMatch = currentRelatedSections && r.related_sections && (() => {
              try {
                const currentSections = Array.isArray(currentRelatedSections) ? currentRelatedSections : [];
                const candidateSections = Array.isArray(r.related_sections) ? r.related_sections : [];
                if (currentSections.length === 0 || candidateSections.length === 0) return false;

                const currentSectionIds = new Set(currentSections.map((s: any) => enhancedNormalize(s.entry_id || s.id || s)));
                const candidateSectionIds = new Set(candidateSections.map((s: any) => enhancedNormalize(s.entry_id || s.id || s)));
                const intersection = new Set([...currentSectionIds].filter(id => candidateSectionIds.has(id)));
                return intersection.size > 0 && intersection.size / Math.min(currentSectionIds.size, candidateSectionIds.size) >= 0.5;
              } catch {
                return false;
              }
            })();

            // Jurisprudence matching
            const jurisprudenceMatch = currentJurisprudence && r.jurisprudence && (() => {
              try {
                const currentJurisprudenceArray = Array.isArray(currentJurisprudence) ? currentJurisprudence : [];
                const candidateJurisprudence = Array.isArray(r.jurisprudence) ? r.jurisprudence : [];
                if (currentJurisprudenceArray.length === 0 || candidateJurisprudence.length === 0) return false;

                const currentJurisNames = new Set(currentJurisprudenceArray.map((j: any) => enhancedNormalize(j.name || j.title || j)));
                const candidateJurisNames = new Set(candidateJurisprudence.map((j: any) => enhancedNormalize(j.name || j.title || j)));
                const intersection = new Set([...currentJurisNames].filter(name => candidateJurisNames.has(name)));
                return intersection.size > 0 && intersection.size / Math.min(currentJurisNames.size, candidateJurisNames.size) >= 0.4;
              } catch {
                return false;
              }
            })();

            // Topics matching
            const topicsMatch = currentTopics && r.topics && (() => {
              try {
                const currentTopicsArray = Array.isArray(currentTopics) ? currentTopics : [];
                const candidateTopics = Array.isArray(r.topics) ? r.topics : [];
                if (currentTopicsArray.length === 0 || candidateTopics.length === 0) return false;

                const currentTopicNames = new Set(currentTopicsArray.map((t: any) => enhancedNormalize(t.name || t.title || t)));
                const candidateTopicNames = new Set(candidateTopics.map((t: any) => enhancedNormalize(t.name || t.title || t)));
                const intersection = new Set([...currentTopicNames].filter(name => candidateTopicNames.has(name)));
                return intersection.size > 0 && intersection.size / Math.min(currentTopicNames.size, candidateTopicNames.size) >= 0.4;
              } catch {
                return false;
              }
            })();

            // Forms matching
            const formsMatch = currentForms && r.forms && (() => {
              try {
                const currentFormsArray = Array.isArray(currentForms) ? currentForms : [];
                const candidateForms = Array.isArray(r.forms) ? r.forms : [];
                if (currentFormsArray.length === 0 || candidateForms.length === 0) return false;

                const currentFormNames = new Set(currentFormsArray.map((f: any) => enhancedNormalize(f.name || f.title || f)));
                const candidateFormNames = new Set(candidateForms.map((f: any) => enhancedNormalize(f.name || f.title || f)));
                const intersection = new Set([...currentFormNames].filter(name => candidateFormNames.has(name)));
                return intersection.size > 0 && intersection.size / Math.min(currentFormNames.size, candidateFormNames.size) >= 0.4;
              } catch {
                return false;
              }
            })();

            // Comprehensive matching logic - tuned to reduce false positives
            const shouldShow = 
              // Exact matches (highest priority)
              exactSection || exactCitation || exactDate || exactJurisdiction || exactLawFamily || exactViolationCode || exactViolationName ||

              // High semantic similarity
              sim >= 0.7 ||

              // Good semantic similarity with decent token overlap
              (sim >= 0.5 && tokOverlap >= 0.25) ||

              // Same type with good token overlap
              (sameType && tokOverlap >= 0.35 && sim >= 0.45) ||

              // High token overlap
              tokOverlap >= 0.4 ||

              // Date range match with good similarity
              (dateRangeMatch && sim >= 0.6) ||

              // Tag overlap with good similarity
              (tagOverlap && sim >= 0.5) ||

              // Content similarity
              summarySimilarity || textSimilarity ||

              // Fine amount matching
              fineAmountMatch ||

              // Penalty elements matching
              penaltyElementsMatch ||

              // Legal document specific matching
              legalBasesMatch || relatedSectionsMatch || jurisprudenceMatch || topicsMatch || formsMatch ||

              // Conservative fallback only if similarity and overlap are both decent
              (sim >= 0.5 && tokOverlap >= 0.2);

            // Debug logging for enhanced matching
            if (process.env.NODE_ENV === 'development') {
              console.log('Enhanced duplicate detection result:', {
              title: candidateTitle,
              similarity: sim,
              tokenOverlap: tokOverlap,
                exactMatches: { exactSection, exactCitation, exactDate, exactJurisdiction, exactLawFamily, exactViolationCode, exactViolationName },
                enhancedMatches: { 
                  dateRangeMatch, tagOverlap, summarySimilarity, textSimilarity, fineAmountMatch, penaltyElementsMatch,
                  legalBasesMatch, relatedSectionsMatch, jurisprudenceMatch, topicsMatch, formsMatch
                },
              shouldShow,
              sameType,
              // Show why it's being filtered out
              filterReasons: {
                exactMatch: exactSection || exactCitation || exactDate || exactJurisdiction || exactLawFamily || exactViolationCode || exactViolationName,
                highSimilarity: sim >= 0.7,
                goodSimilarityWithOverlap: sim >= 0.5 && tokOverlap >= 0.25,
                sameTypeWithOverlap: sameType && tokOverlap >= 0.35 && sim >= 0.45,
                highTokenOverlap: tokOverlap >= 0.4,
                dateRangeWithSimilarity: dateRangeMatch && sim >= 0.6,
                tagOverlapWithSimilarity: tagOverlap && sim >= 0.5,
                contentSimilarity: summarySimilarity || textSimilarity,
                fineAmountMatch: fineAmountMatch,
                penaltyElementsMatch: penaltyElementsMatch,
                legalBasesMatch: legalBasesMatch,
                relatedSectionsMatch: relatedSectionsMatch,
                jurisprudenceMatch: jurisprudenceMatch,
                topicsMatch: topicsMatch,
                formsMatch: formsMatch,
                fallbackMatch: sim >= 0.5 && tokOverlap >= 0.2
              }
            });
            }

            return shouldShow;
          });

          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Filtered duplicates:', filtered.length);
            console.log('🔍 Final duplicate matches:', filtered);
          }


          setNearDuplicates(filtered);

          // Re-rank using the same boosted local+semantic algorithm as LegalBasisPicker (override above if stronger)
          try {
            const normalizeSearchText = (text: string): string => {
              let normalized = String(text || '')
                .toLowerCase()
                .replace(/\b(rule|roc)\s*(\d+)\b/g, 'rule $2')
                .replace(/\b(section|sec\.?)\s*(\d+)\b/g, 'section $2')
                .replace(/\b(article|art\.?)\s*(\d+)\b/g, 'article $2')
                .replace(/\b(republic act|ra)\s*(\d+)\b/g, 'republic act $2')
                .replace(/\b(presidential decree|pd)\s*(\d+)\b/g, 'presidential decree $2')
                .replace(/\b(executive order|eo)\s*(\d+)\b/g, 'executive order $2')
                .replace(/\b(memorandum circular|mc)\s*(\d+)\b/g, 'memorandum circular $2')
                .replace(/\b(department order|do)\s*(\d+)\b/g, 'department order $2')
                .replace(/\b(administrative order|ao)\s*(\d+)\b/g, 'administrative order $2')
                .replace(/\b(commonwealth act|ca)\s*(\d+)\b/g, 'commonwealth act $2')
                .replace(/\b(batas pambansa|bp)\s*(\d+)\b/g, 'batas pambansa $2')
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              return normalized;
            };
            const getSearchTerms = (s: string) => normalizeSearchText(s).split(' ').filter(Boolean);
            const romanToNumber = (roman: string): number => { const map: any = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000,i:1,v:5,x:10,l:50,c:100,d:500,m:1000}; let res=0; for(let i=0;i<roman.length;i++){ const cur=map[roman[i]], nxt=map[roman[i+1]]; res += (nxt && cur<nxt)?-cur:cur; } return res; };
            const numberToRoman = (num: number): string => { const values=[1000,900,500,400,100,90,50,40,10,9,5,4,1]; const symbols=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']; let out=''; for(let i=0;i<values.length;i++){ while(num>=values[i]){ out+=symbols[i]; num-=values[i]; } } return out; };
            const createSearchVariations = (term: string): string[] => { const vars=new Set([term]); if(term.endsWith('s')&&term.length>3){vars.add(term.slice(0,-1));}else{vars.add(term+'s');} const rm=term.match(/^([IVXLC]+)$/i); if(rm){ const n=romanToNumber(rm[1].toUpperCase()); if(n>0&&n<=100){ vars.add(String(n)); vars.add(numberToRoman(n)); } } const nm=term.match(/^(\d+)$/); if(nm){ const n=parseInt(nm[1]); if(n>0&&n<=100){ vars.add(numberToRoman(n)); } } return Array.from(vars); };
            const editDistance = (a: string, b: string): number => { const m=a.length,n=b.length; const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0)); for(let i=0;i<=m;i++) dp[i][0]=i; for(let j=0;j<=n;j++) dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ const cost=a[i-1]===b[j-1]?0:1; dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost); } } return dp[m][n]; };
            const calculateMatchScore = (entry: any, terms: string[], exactQuery: string): number => {
              const tagsJoined = Array.isArray(entry.tags) ? entry.tags.join(' ') : '';
              const searchable = [
                { text: entry.title, weight: 10 },
                { text: entry.entry_id, weight: 8 },
                { text: entry.law_family, weight: 6 },
                { text: entry.canonical_citation, weight: 6 },
                { text: tagsJoined, weight: 5 },
                { text: entry.summary, weight: 4 },
                { text: entry.text, weight: 2 },
                { text: entry.section_id, weight: 3 },
                { text: entry.type, weight: 2 }
              ];
              let total=0, matched=0;
              for (const term of terms){
                const vars = createSearchVariations(term);
                let hit=false, tscore=0;
                for (const {text,weight} of searchable){
                  if (!text) continue;
                  const norm = normalizeSearchText(text);
                  if (norm===exactQuery){ tscore=Math.max(tscore, weight*3); hit=true; }
                  else if (norm.startsWith(exactQuery)){ tscore=Math.max(tscore, weight*2); hit=true; }
                  else if (norm.includes(exactQuery)){ tscore=Math.max(tscore, weight); hit=true; }
                  else {
                    for (const v of vars){
                      if (norm===v){ tscore=Math.max(tscore, weight*2); hit=true; }
                      else if (norm.startsWith(v)){ tscore=Math.max(tscore, weight*1.5); hit=true; }
                      else if (norm.includes(v)){ tscore=Math.max(tscore, weight); hit=true; }
                      else { const words=norm.split(' '); for (const w of words){ const dist=editDistance(v,w); const allowed=v.length<=5?1:2; if (dist<=allowed){ tscore=Math.max(tscore, weight*0.5); hit=true; break; } } }
                      if (hit) break;
                    }
                  }
                  if (hit) break;
                }
                if (hit){ total+=tscore; matched++; }
              }
              return matched===terms.length ? total : 0;
            };

            const pool = existingEntries || [];
            const terms = getSearchTerms(q);
            const exactQuery = normalizeSearchText(q);
            const exactCitationNorm = normalizeSearchText(citation || '');
            const exactTitleNorm = normalizeSearchText(title || '');
            const exactSectionNorm = normalizeSearchText(sectionId || '');

            const localScored = pool.map((e: any) => {
              const base = calculateMatchScore(e, terms, exactQuery);
              const eTitle = normalizeSearchText(e.title || '');
              const eCite = normalizeSearchText(e.canonical_citation || '');
              const eSection = normalizeSearchText(e.section_id || '');
              let boost = 0;
              if (exactCitationNorm){ if (eCite===exactCitationNorm) boost+=2000; if (eTitle===exactCitationNorm) boost+=1500; if (eCite.startsWith(exactCitationNorm)) boost+=1000; if (eTitle.startsWith(exactCitationNorm)) boost+=800; if (eCite.includes(exactCitationNorm)) boost+=600; if (eTitle.includes(exactCitationNorm)) boost+=400; }
              if (exactTitleNorm){ if (eTitle===exactTitleNorm) boost+=1000; if (eCite===exactTitleNorm) boost+=800; if (eTitle.startsWith(exactTitleNorm)) boost+=500; if (eCite.startsWith(exactTitleNorm)) boost+=400; if (eTitle.includes(exactTitleNorm)) boost+=300; if (eCite.includes(exactTitleNorm)) boost+=200; }
              if (exactSectionNorm){ if (eSection===exactSectionNorm) boost+=800; if (eSection.startsWith(exactSectionNorm)) boost+=400; if (eSection.includes(exactSectionNorm)) boost+=200; }
              return { entry: e, score: base + boost };
            }).filter(it => it.score >= 10);

            const semanticRaw = (resp.success && Array.isArray(resp.results)) ? resp.results : [];
            const semanticScored = semanticRaw.map((r: any) => {
              let score = Number(r.similarity || r.score || 0) * 100;
              const rTitle = normalizeSearchText(r.title || '');
              const rCite = normalizeSearchText(r.canonical_citation || '');
              if (exactCitationNorm && (rCite===exactCitationNorm || rTitle===exactCitationNorm)) score += 25;
              else if (exactTitleNorm && (rTitle===exactTitleNorm || rCite===exactTitleNorm)) score += 20;
              else score *= 0.5;
              return { entry: r, score };
            });

            const merged: Record<string, { entry: any; local: number; semantic: number }> = {} as any;
            for (const it of localScored){ const id = it.entry.entry_id || it.entry.id || it.entry.title; const prev = merged[id] || { entry: it.entry, local: 0, semantic: 0 }; merged[id] = { entry: it.entry, local: Math.max(prev.local, it.score), semantic: prev.semantic }; }
            for (const it of semanticScored){ const id = it.entry.entry_id || it.entry.id || it.entry.title; const prev = merged[id] || { entry: it.entry, local: 0, semantic: 0 }; merged[id] = { entry: it.entry, local: prev.local, semantic: Math.max(prev.semantic, it.score) }; }

            const SEM_THRESHOLD = 50;
            const LOC_THRESHOLD = 10;
            const reRanked = Object.values(merged)
              .filter(m => (m.local >= LOC_THRESHOLD) || (m.semantic >= SEM_THRESHOLD && m.local >= 8))
              .sort((a, b) => (b.local * 2 + b.semantic) - (a.local * 2 + a.semantic))
              .slice(0, 5)
              .map(m => m.entry);

            setNearDuplicates(reRanked);
          } catch {}
        }
      } catch (error) {
        console.error('❌ Error in duplicate detection:', error);
        if (!cancelled) {
          setNearDuplicates([]);
          // Show a toast or notification about the error
          console.warn('Duplicate detection failed, but continuing with form creation');
        }
      } finally {
        if (!cancelled) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Setting searchingDupes to FALSE');
          }


          setSearchingDupes(false);
        }
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [entry, isOnCreateUrl, title, lawFamily, sectionId, citation, effectiveDate, type, formPopulated, existingEntries, methods, setNearDuplicates, setSearchingDupes]);

  // Debounced semantic suggestions for potential near-duplicates (title + identifiers)
  // Disabled when editing existing entries to avoid confusion
  useEffect(() => {
    // Only log in development mode to reduce performance impact
    if (process.env.NODE_ENV === 'development') {
      debugLog('🚨 DUPLICATE DETECTION useEffect RUNNING! 🚨');
      debugLog('🔍 DUPLICATE DETECTION useEffect TRIGGERED!', { 
        hasEntry: !!entry, 
        entryId: entry?.entry_id || (entry as any)?.id,
        isEditMode,
        isCreateMode,
        isImportedEntry,
        isOnCreateUrl,
        formPopulated,
        title: title || 'no title',
        lawFamily: lawFamily || 'no law family',
        currentUrl: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }

    // Debounce duplicate detection to prevent excessive API calls
    const debounceId = setTimeout(() => {
      performDuplicateDetection();
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceId);
  }, [title, lawFamily, sectionId, citation, effectiveDate, entry, isEditMode, isCreateMode, isImportedEntry, isOnCreateUrl, formPopulated, performDuplicateDetection]);

  // Debug logging for duplicate detection
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Duplicate detection state:', { 
        nearDuplicates: nearDuplicates?.length || 0, 
        isOpen: nearDuplicates && nearDuplicates.length > 0,
        matches: nearDuplicates || []
      });





    }
  }, [nearDuplicates]);

  // Trigger duplicate detection when form is populated with imported data
  useEffect(() => {
    if (formPopulated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Form populated with imported data, triggering duplicate detection');
      }
      // Reset the flag
      setFormPopulated(false);
    }
  }, [formPopulated]);

  // (Relations helper components were removed; using dedicated picker in Step 4)



  //

  return (
    <FormProvider {...methods}>
      <div className="w-full flex justify-center">
        <div className="kb-form mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Toast for possible duplicates */}
        <DuplicateMatchesToast
          isOpen={nearDuplicates && nearDuplicates.length > 0}
          onClose={() => setNearDuplicates([])}
          matches={nearDuplicates || []}
          maxDisplay={5}
        />

        {/* Debug info for duplicate detection */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50 max-w-xs">
            <div>Duplicates: {nearDuplicates?.length || 0}</div>
            <div>Searching: {searchingDupes ? 'Yes' : 'No'}</div>
            <div>Title: {title || 'None'}</div>
            <div>Form Populated: {formPopulated ? 'Yes' : 'No'}</div>
            <div>Is Imported: {isImportedEntry ? 'Yes' : 'No'}</div>
            <div>On Create URL: {isOnCreateUrl ? 'Yes' : 'No'}</div>
          </div>
        )}

        {/* Debug button for testing duplicate detection */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            <button
              type="button"
              onClick={() => {
                console.log('🧪 Testing duplicate detection with sample data');
                setNearDuplicates([
                  {
                    title: "Libel - Test Match 1",
                    canonical_citation: "RPC Article 353",
                    entry_id: "test-libel-1",
                    similarity: 0.95
                  },
                  {
                    title: "Libel - Test Match 2", 
                    canonical_citation: "RPC Article 353",
                    entry_id: "test-libel-2",
                    similarity: 0.87
                  }
                ]);
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
            >
              Test Duplicates
            </button>
            <button
              type="button"
              onClick={() => {
                const currentValues = methods.getValues() as any;
                console.log('🔍 Current form values:', currentValues);
                console.log('🔍 Form populated flag:', formPopulated);
                console.log('🔍 Is imported entry:', isImportedEntry);
                console.log('🔍 Near duplicates:', nearDuplicates);
                console.log('🔍 Is on create URL:', isOnCreateUrl);
                console.log('🔍 Current URL:', window.location.pathname);


              }}
              className="bg-green-500 text-white px-3 py-1 rounded text-xs"
            >
              Debug Form
            </button>
            <button
              type="button"
              onClick={async () => {
                console.log('🔍 Manually triggering duplicate detection...');


                const currentValues = methods.getValues() as any;
                const { title, law_family, section_id, canonical_citation, effective_date, type } = currentValues;

                if (title && title.length >= 3) {
                  const idTokens = [title, law_family, section_id, canonical_citation, effective_date]
                    .filter(Boolean)
                    .join(' ');
                  const q = `${idTokens}`.trim();

                  console.log('🔍 Manual duplicate detection query:', q);



                  try {
                    setSearchingDupes(true);
                    const resp = await semanticSearch(q, 10);
                    console.log('🔍 Manual semantic search response:', resp);



                    if (resp.success && resp.results && resp.results.length > 0) {
                      console.log('🔍 Found results, setting as duplicates');


                      setNearDuplicates(resp.results.slice(0, 5));
                    } else {
                      console.log('🔍 No results found');


                      setNearDuplicates([]);
                    }
                  } catch (error) {
                    console.error('🔍 Manual duplicate detection error:', error);
                  } finally {
                    setSearchingDupes(false);
                  }
                } else {
                  console.log('🔍 Title too short for duplicate detection');


                }
              }}
              className="bg-purple-500 text-white px-3 py-1 rounded text-xs"
            >
              Manual Duplicate Check
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('🔍 Force triggering duplicate detection...');
                // Dispatch custom event to trigger duplicate detection without form manipulation
                window.dispatchEvent(new CustomEvent('trigger-duplicate-detection'));
              }}
              className="bg-orange-500 text-white px-3 py-1 rounded text-xs"
            >
              Force Trigger
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('🔍 IMMEDIATE duplicate detection test...');


                // Run duplicate detection immediately without waiting for useEffect
                const currentValues = methods.getValues() as any;
                const { title, law_family, section_id, canonical_citation, effective_date } = currentValues;

                if (title && title.length >= 3) {
                  const idTokens = [title, law_family, section_id, canonical_citation, effective_date]
                    .filter(Boolean)
                    .join(' ');
                  const q = `${idTokens}`.trim();

                  console.log('🔍 IMMEDIATE query:', q);



                  // Run semantic search immediately
                  semanticSearch(q, 10).then(resp => {
                    console.log('🔍 IMMEDIATE semantic search response:', resp);


                    if (resp.success && resp.results && resp.results.length > 0) {
                      console.log('🔍 IMMEDIATE found results:', resp.results.length);


                      setNearDuplicates(resp.results.slice(0, 5));
                    } else {
                      console.log('🔍 IMMEDIATE no results found');


                      setNearDuplicates([]);
                    }
                  }).catch(error => {
                    console.error('🔍 IMMEDIATE error:', error);
                  });
                } else {
                  console.log('🔍 IMMEDIATE title too short');


                }
              }}
              className="bg-red-500 text-white px-3 py-1 rounded text-xs"
            >
              Immediate Test
            </button>































          </div>
        )}
        <div className="kb-form-container">
          <header className="kb-form-header mb-6">
            <div>
              <h1 className="kb-form-title">{isEditMode ? 'Editing Knowledge Base Entry' : 'Create Knowledge Base Entry'}</h1>
              <p className="kb-form-subtitle">{isEditMode ? 'Update an existing entry in the legal knowledge base' : 'Add a new entry to the legal knowledge base for Villy AI'}</p>
              {!isEditMode && (
                <p className="text-sm text-gray-500 mt-1">💾 Your work is automatically saved as you type and navigate between steps</p>
              )}
            </div>
            {/* Auto-saving indicator */}
            {!isEditMode && isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Auto-saving...</span>
              </div>
            )}
          </header>

          <div className="kb-form-layout grid grid-cols-12 gap-6 md:gap-8 items-stretch justify-center">
            {/* Top row: Progress (left) and Preview (right), reduced progress width */}
            <div className="col-span-12 md:col-span-4">
              <EntryStepper
                steps={steps}
                currentStep={currentStep}
                onStepClick={(step) => {
                  setCurrentStep(step);
                  // Use URL pattern as primary determinant for navigation (same as Next/Previous buttons)
                  if (isOnCreateUrl) {
                    // We're on a create URL (including imported entries), use regular form URL
                    navigate(`/law-entry/${step}`);
                  } else {
                    // We're editing an existing entry, maintain edit URL structure
                    const entryId = entry ? ((entry as any).id || entry.entry_id) : null;
                    if (entryId) {
                      navigate(`/entry/${entryId}/edit?step=${step}`);
                    }
                  }
                }}
              />
            </div>

            {/* Preview card beside Progress - expanded */}
            <aside className="col-span-12 md:col-span-8">
              <div>
                <div className="ds-card rounded-2xl shadow-sm border p-5 h-full min-h-[360px] w-full">
                  <div className="pr-2">
                    <EntryPreview data={methods.watch()} />
        </div>
      </div>
              </div>
            </aside>

            {/* Below: Law input card (form) spanning full width */}
            <section className="kb-form-section col-span-12">
              <form onSubmit={handleSubmit(
                (data) => {
                  console.log('✅ FORM SUBMISSION SUCCESS - onSubmit called with data:', data);
                  onSubmit(data);
                },
                (errors) => {
                  console.log('🚨 FORM VALIDATION ERRORS:', errors);
                  console.log('🚨 Form validation failed, preventing submission');
                  console.log('🚨 Error count:', Object.keys(errors).length);
                }
              )}>
                {(() => {
                  if (currentStep === 1) {
                    return (
                      <>
                        <div ref={formCardRef} className="kb-step-card">
                          <div className="kb-step-header">
                            <div className="kb-step-header-content">
                              <div className="kb-step-icon">
                                <FileText className="kb-step-icon-svg" />
                              </div>
                              <h2 className="kb-step-title">Basic Information</h2>
                              <p className="kb-step-description">Start with the fundamental details about this legal entry</p>
                            </div>
                          </div>
                          <div className="kb-form-fields">
                            <div className="kb-form-grid">
                              <div className="kb-form-column">
                                <div className="kb-form-section-group">
                                  <h3 className="kb-form-section-title">Entry Details</h3>
                                  <div className="kb-form-field-group">
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">Entering as</label>
                                      <Input className="kb-form-input bg-gray-50" placeholder="Team Member" value={user?.name || user?.username || 'Team Member'} readOnly />
                                    </div>
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">
                                        Entry Type <span className="kb-required">*</span>
                                      </label>
                                      <select className="kb-form-select" {...register('type')} onChange={(e) => setValue('type', e.target.value as any)}>
                                        <option value="">Select Entry Type</option>
                                        {(TypeEnum.options || (TypeEnum as any)._def.values).map((v: string) => (
                                          <option key={v} value={v}>{v}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">
                                        Title <span className="kb-required">*</span>
                                      </label>
                                      <Input className="kb-form-input" placeholder="Human-readable label" {...register('title')} />
                                    </div>
                                    {/* Inline list removed in favor of toast */}
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">
                                        Jurisdiction <span className="kb-required">*</span>
                                      </label>
                                      <p id="jurisdiction-help" className="kb-form-helper kb-helper-spaced">Use title case; letters/spaces only</p>
                                      <select
                                        className="kb-form-select"
                                        value={isOtherJurisdiction ? 'Other' : 'PH'}
                                        onChange={(e) => {
                                          if (e.target.value === 'Other') setValue('jurisdiction', '' as any);
                                          else setValue('jurisdiction', 'PH' as any);
                                        }}
                                        aria-describedby="jurisdiction-help"
                                      >
                                        <option value="PH">PH Philippines (PH)</option>
                                        <option value="Other">Other…</option>
                                      </select>
                                      {isOtherJurisdiction && (
                                        <Input
                                          className="kb-form-input"
                                          placeholder="e.g., Cavite, Quezon City, Baguio"
                                          value={String(jurisdiction || '')}
                                          onChange={(e) => setValue('jurisdiction', e.target.value as any)}
                                          onBlur={(e) => setValue('jurisdiction', toTitleCase(e.target.value) as any)}
                                          aria-describedby="jurisdiction-help"
                                        />
                                      )}
                                    </div>
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">
                                        Law Family <span className="kb-required">*</span>
                                      </label>
                                      <Input className="kb-form-input" placeholder="RA 4136, Rules of Court, Cebu Ord. 2606" {...register('law_family')} />
                                    </div>
                                  </div>
                                </div>
                                <div className="kb-form-section-group">
                                  <h3 className="kb-form-section-title">Reference Information</h3>
                                  <div className="kb-form-field-group">
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">Section ID</label>
                                      <Input className="kb-form-input" placeholder="Sec. 7, Rule 113 Sec. 5, Art. 308" {...register('section_id')} />
                                    </div>
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">
                                        Canonical Citation <span className="kb-required">*</span>
                                      </label>
                                      <Input className="kb-form-input" placeholder="RPC Art. 308, ROC Rule 113, Sec. 5" {...register('canonical_citation')} />
                                      <p className="kb-form-helper">Shown to users; follows official formatting</p>
                                    </div>
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">
                                        Status <span className="kb-required">*</span>
                                      </label>
                                      <select className="kb-form-select" {...register('status')}>
                                        <option value="">----</option>
                                        <option value="active">Active</option>
                                        <option value="amended">Amended</option>
                                        <option value="repealed">Repealed</option>
                                        <option value="draft">Draft</option>
                                        <option value="approved">Approved</option>
                                        <option value="published">Published</option>
                                      </select>
                                    </div>
                                    <div className="kb-form-field">
                                      <label className="kb-form-label">Auto-generated Entry ID</label>
                                      <Input 
                                        className="kb-form-input bg-gray-50" 
                                        placeholder="Auto-generated" 
                                        value={entry_id || ''} 
                                        readOnly 
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pro Tip removed as requested */}

                          <div className="kb-action-bar">
                          <Button type="button" variant="outline" onClick={() => setShowCancelConfirm(true)} className="flex items-center gap-3 px-12 min-w-[140px] py-3 h-12">
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                          <div className="flex gap-3">
                            
                            <Button 
                              type="button" 
                              onClick={goNext} 
                              disabled={nearDuplicates && nearDuplicates.length > 0}
                              variant="default"
                              className={`flex items-center gap-3 px-12 min-w-[140px] py-3 h-12 text-white ${
                                nearDuplicates && nearDuplicates.length > 0 ? 'bg-gray-400 cursor-not-allowed shadow-none' : ''
                              }`}
                            >
                              Next
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  } else if (currentStep === 2) {
                    return (
                      <div ref={formCardRef} className="kb-step-card">
                        <div className="kb-step-header">
                          <div className="kb-step-header-content">
                            <div className="kb-step-icon">
                              <CalendarDays className="kb-step-icon-svg" />
                            </div>
                            <h2 className="kb-step-title">Sources & Dates</h2>
                            <p className="kb-step-description">Citations and effective dates</p>
                          </div>
                        </div>
                        <div className="kb-form-fields">
                          <div className="kb-form-grid">
                            <div className="kb-form-field">
                              <label className="kb-form-label">Effective Date</label>
                              <Input className="kb-form-input" type="date" {...register('effective_date')} />
                            </div>
                            {/* Amendment toggle */}
                            <div className="kb-form-field">
                              <label className="kb-form-label">Has Amendment?</label>
                              <div className="flex items-center gap-3 mt-2">
                                <input
                                  type="checkbox"
                                  checked={hasAmendment}
                                  onChange={(e) => {
                                    const on = e.target.checked;
                                    setHasAmendment(on);
                                    if (!on) {
                                      // Only clear amendment_date when unchecking, don't change status
                                      setValue('amendment_date' as any, null as any, { shouldDirty: true } as any);
                                    }
                                  }}
                                />
                                <span className="text-sm text-gray-700">This entry has an amendment</span>
                              </div>
                            </div>

                            {hasAmendment && (
                              <div className="kb-form-field">
                                <label className="kb-form-label">Amendment Date</label>
                                <Input className="kb-form-input" type="date" {...register('amendment_date' as any)} />
                              </div>
                            )}
                            {/* Last Reviewed field removed - auto-assigned on creation */}
                            <div>
                              <label className="kb-form-label">Source URLs</label>
                              <div className="mt-2">
                                <UrlArray control={control} register={register} watch={watch} setValue={setValue} />
                              </div>
                            </div>
                          </div>

                          <div className="kb-action-bar">
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" onClick={() => setShowCancelConfirm(true)} className="h-12 px-10 min-w-[130px]">Cancel</Button>
                            </div>
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" onClick={goPrev} className="h-12 px-10 min-w-[130px] kb-prev-btn">Previous</Button>
                              <Button 
                                type="button" 
                                onClick={goNext} 
                                disabled={nearDuplicates && nearDuplicates.length > 0}
                                variant="default"
                                className={`flex items-center gap-3 px-12 min-w-[140px] py-3 h-12 ${
                                  nearDuplicates && nearDuplicates.length > 0
                                    ? 'bg-gray-400 text-white cursor-not-allowed shadow-none'
                                    : ''
                                }`}
                              >
                                Next
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (currentStep === 3) {
                    return (
                      <div ref={formCardRef} className="kb-step-card">
                        <div className="kb-step-header">
                          <div className="kb-step-header-content">
                            <div className="kb-step-icon">
                              <BookText className="kb-step-icon-svg" />
                            </div>
                            <h2 className="kb-step-title">Content</h2>
                            <p className="kb-step-description">Summary and legal text</p>
                          </div>
                        </div>
                        <div className="kb-form-fields">
                          <div className="space-y-8">
                            <div className="kb-form-field">
                              <div className="space-y-1">
                                <label className="kb-form-label">Summary</label>
                                <p className="kb-form-helper kb-helper-below kb-helper-light-grey">Keep it concise and neutral.</p>
                              </div>
                              <Textarea rows={4} placeholder="1–3 sentence neutral synopsis" {...register('summary')} />
                            </div>
                            <div className="kb-form-field">
                              <div className="space-y-1 kb-step3-legal-text-spacing">
                                <label className="kb-form-label">Legal Text</label>
                                <p className="kb-form-helper kb-helper-below kb-helper-light-grey">Substance-only, normalized.</p>
                              </div>
                              <Textarea rows={12} placeholder="Clean, normalized legal text" {...register('text')} />
                            </div>
                            <div className="kb-form-field">
                              <div className="kb-step3-tags-spacing">
                                <label className="kb-form-label">Tags</label>
                              </div>
                              <TagArray control={control} register={register} watch={watch} />
                            </div>
                          </div>

                          <div className="kb-action-bar">
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" onClick={() => setShowCancelConfirm(true)} className="h-12 px-10 min-w-[130px]">Cancel</Button>
                              {!entry && (
                                <Button type="button" variant="outline" onClick={saveDraft} className="h-12 px-10 min-w-[130px]">Save draft</Button>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" onClick={goPrev} className="h-12 px-10 min-w-[130px]">Previous</Button>
                              <Button 
                                type="button" 
                                onClick={goNext} 
                                disabled={nearDuplicates && nearDuplicates.length > 0}
                                variant="default"
                                className={`flex items-center gap-3 px-12 min-w-[140px] py-3 h-12 text-white ${
                                  nearDuplicates && nearDuplicates.length > 0 ? 'bg-gray-400 cursor-not-allowed shadow-none' : ''
                                }`}
                              >
                                Next
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (currentStep === 4 && hasTypeSpecific) {
                    return (
                      <div ref={formCardRef} className="kb-step-card">
                        <div className="kb-step-header">
                          <div className="kb-step-header-content">
                            <div className="kb-step-icon">
                              <Layers className="kb-step-icon-svg" />
                            </div>
                            <h2 className="kb-step-title">Type-Specific & Relations</h2>
                            <p className="kb-step-description">Fields based on entry type</p>
                          </div>
                        </div>
                        <div>
                          <StepTypeSpecific 
                            onNext={goNext}
                            onPrevious={goPrev}
                            onCancel={onCancel}
                            onSaveDraft={saveDraft}
                            isEditing={!!entry}
                            existingEntries={existingEntries as any}
                          />
                        </div>
                      </div>
                    );
                  } else if (currentStep === 5) {
                    return (
                      <div className="kb-step-card">
                        <div className="kb-step-header">
                          <div className="kb-step-header-content">
                            <div className="kb-step-icon">
                              <FileCheck className="kb-step-icon-svg" />
                            </div>
                            <h2 className="kb-step-title">Review & Publish</h2>
                            <p className="kb-step-description">Final check before saving</p>
                          </div>
                        </div>
                        <div>
                          <div className="bg-muted/30 rounded-xl p-6 text-center">
                            <div className="text-sm text-muted-foreground leading-relaxed">
                              Use the live preview above to verify all fields are correct before publishing your entry.
                            </div>
                          </div>

                            <div className="kb-action-bar">
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" onClick={() => setShowCancelConfirm(true)} className="h-12 px-10 min-w-[130px]">Cancel</Button>
                            </div>
                            <div className="flex gap-3">
                              <Button type="button" variant="outline" onClick={goPrev} className="h-12 px-10 min-w-[130px] !text-black dark:!text-white border-2 border-orange-500">Previous</Button>
                              <Button
                                type="submit"
                                disabled={isSubmitting || isUpdatingEntry || (nearDuplicates && nearDuplicates.length > 0)}
                                onClick={(e) => {
                                  console.log('🔘 CREATE ENTRY BUTTON CLICKED');
                                  console.log('🔘 Button disabled state:', isSubmitting || isUpdatingEntry || (nearDuplicates && nearDuplicates.length > 0));
                                  console.log('🔘 isSubmitting:', isSubmitting);
                                  console.log('🔘 isUpdatingEntry:', isUpdatingEntry);
                                  console.log('🔘 nearDuplicates:', nearDuplicates);
                                  
                                  // Check form validation state
                                  const formState = getValues();
                                  console.log('🔘 Form values:', formState);
                                  console.log('🔘 Form errors:', formState);
                                  
                                  // Check if form is valid
                                  trigger().then((isValid) => {
                                    console.log('🔘 Form validation result:', isValid);
                                    if (!isValid) {
                                      console.log('🔘 Form validation failed - check console for errors');
                                    }
                                  });
                                  
                                  // Don't prevent default - let the form submit naturally
                                  // The form's onSubmit will be called automatically
                                }}
                                className={`flex items-center gap-3 px-12 min-w-[160px] py-3 h-12 transition-all duration-200 ${
                                  isSubmitting || isUpdatingEntry || (nearDuplicates && nearDuplicates.length > 0)
                                    ? 'bg-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                                }`}
                              >
                                {isSubmitting || isUpdatingEntry ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {isEditMode ? 'Updating...' : 'Creating...'}
                                  </>
                                ) : (
                                  isEditMode ? 'Update Entry' : 'Create Entry'
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </form>
            </section>
          </div>
        </div>
        {/* Draft Saved Modal */}
        <Modal isOpen={showDraftSaved} onClose={() => setShowDraftSaved(false)} title="Draft saved" subtitle={null}>
          <div className="text-center p-4">
            <p className="text-sm text-gray-600">Your draft has been saved locally.</p>
          </div>
        </Modal>

        {/* Draft Loaded Modal */}
        <Modal isOpen={showDraftLoaded} onClose={() => setShowDraftLoaded(false)} title="Draft restored" subtitle={null}>
          <div className="text-center p-4">
            <p className="text-sm text-gray-600">Your previous draft has been restored. All your inputs have been preserved.</p>
          </div>
        </Modal>
        <Modal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} title="Are you sure you want to cancel?" subtitle="This will delete all your current inputs in the forms.">
          <div className="modal-buttons">
            <button className="modal-button danger" onClick={() => { 
              // Clear all draft data comprehensively
              try {
                localStorage.removeItem('kb_entry_draft');
                localStorage.removeItem('kb_draft');
                localStorage.removeItem('kb_drafts');
                // Clear any other draft-related keys
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith('kb_entry_') || 
                      key.startsWith('entry_draft_') || 
                      key.startsWith('kb_draft') ||
                      key.includes('draft') ||
                      key.includes('autosave')) {
                    localStorage.removeItem(key);
                  }
                });
                console.log('🧹 Cleared all drafts on modal cancel');
              } catch (e) {
                console.warn('Failed to clear drafts on modal cancel:', e);
              }
              setShowCancelConfirm(false); 
              onCancel(); 
            }}>Yes, go to home</button>
            <button className="modal-button cancel" onClick={() => setShowCancelConfirm(false)}>No, stay here</button>
          </div>
        </Modal>

        {/* Internal Citation Suggestion Modal */}
        <Modal 
          isOpen={showInternalCitationModal} 
          onClose={() => setShowInternalCitationModal(false)} 
          title="Detected Internal Citation" 
          subtitle={internalCitationModalMessage}
        >
          <div className="modal-buttons">
            <button className="modal-button orange" onClick={handleInternalCitationModalConfirm}>
              Yes, create entry
            </button>
            <button className="modal-button orange-outline" onClick={handleInternalCitationModalGoBack}>
              Go Back
            </button>
          </div>
        </Modal>
      </div>
    </div>
    </FormProvider>
  );
}

// ——— Reusable tiny field helpers ———
function UrlArray({ control, register, watch, setValue }: any) {
  const { fields, append, remove } = useFieldArray({ name: 'source_urls', control });

  // Debug logging
  console.log('UrlArray - fields:', fields);
  console.log('UrlArray - fields length:', fields.length);

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <input
              {...register(`source_urls.${index}` as const)}
              placeholder="e.g., https://official-government-website.gov.ph"
              type="url"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors mb-2"
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="w-12 h-[48px] bg-red-600 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center"
                title="Remove URL"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="success"
          onClick={() => {
            console.log('Adding new URL field');
            append('');
          }}
          className="w-full px-4 py-4 mt-6"
        >
          + Add Item
        </Button>
      </div>
    </div>
  );
}

function TagArray({ control, register, watch }: any) {
  const { append, remove } = useFieldArray({ name: 'tags', control });
  const tags: string[] = (watch('tags') || []).filter((t: string) => t && t.trim().length > 0);
  const [draft, setDraft] = React.useState('');

  const addFromDraft = () => {
    const value = draft.trim();
    if (!value) return;
    setDraft('');
    append(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      addFromDraft();
    }
  };

  return (
    <div className="space-y-3">
      <input
        className="kb-input"
        placeholder="tag… (press ENTER to add)"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {Array.isArray(tags) && tags.filter((t) => t && t.trim().length > 0).length > 0 && (
        <div className="flex flex-wrap gap-2 kb-chip-list">
          {tags.map((t, i) => (
            <div key={`${t}-${i}`} className="relative group">
              <span className="kb-chip kb-chip-preview pr-8">{t}</span>
              <button
                type="button"
                className="kb-chip-remove"
                aria-label={`Remove ${t}`}
                onClick={() => remove(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




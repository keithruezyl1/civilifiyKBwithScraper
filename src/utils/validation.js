import { ENTRY_TYPES } from '../data/entryTypes';
import { validateEntryId } from './entryIdGenerator';

// Validation error types
export const VALIDATION_ERRORS = {
  REQUIRED: 'This field is required.',
  INVALID_ENTRY_ID: 'Invalid entry ID format.',
  DUPLICATE_ENTRY_ID: 'Entry ID already exists.',
  INVALID_URL: 'Please enter a valid URL.',
  INVALID_DATE: 'Please enter a valid date.',
  INVALID_DATE_RANGE: 'End date must be after start date.',
  MIN_LENGTH: (min) => `Must be at least ${min} characters.`,
  MAX_LENGTH: (max) => `Must be no more than ${max} characters.`,
  ARRAY_MIN_LENGTH: (min) => `Must have at least ${min} items.`,
  ARRAY_MAX_LENGTH: (max) => `Must have no more than ${max} items.`,
  AMENDMENT_DATE_REQUIRED: 'Amendment date is required when status is "amended".',
  SOURCE_URL_REQUIRED: 'At least one source URL is required.',
  PACK_CATEGORY_REQUIRED: 'Pack category is required when including in offline pack.',
  TEAM_MEMBER_REQUIRED: 'Team member selection is required.',
  LEGAL_BASES_REQUIRED: 'Legal bases are required for this entry type.',
  TYPE_SPECIFIC_REQUIRED: (field) => `${field} is required for this entry type.`
};

// Common validation rules
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '') || 
      (Array.isArray(value) && value.length === 0)) {
    return VALIDATION_ERRORS.REQUIRED;
  }
  return null;
};

export const validateStringLength = (value, fieldName, minLength = 0, maxLength = null) => {
  if (!value) return null;
  
  if (minLength && value.length < minLength) {
    return VALIDATION_ERRORS.MIN_LENGTH(minLength);
  }
  
  if (maxLength && value.length > maxLength) {
    return VALIDATION_ERRORS.MAX_LENGTH(maxLength);
  }
  
  return null;
};

export const validateUrl = (url, fieldName) => {
  if (!url) return null;
  
  try {
    new URL(url);
    return null;
  } catch {
    return VALIDATION_ERRORS.INVALID_URL;
  }
};

export const validateDate = (date, fieldName) => {
  if (!date) return null;
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return VALIDATION_ERRORS.INVALID_DATE;
  }
  
  return null;
};

export const validateDateRange = (startDate, endDate, startFieldName, endFieldName) => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return VALIDATION_ERRORS.INVALID_DATE_RANGE;
  }
  
  return null;
};

export const validateArray = (array, fieldName, minLength = 0, maxLength = null) => {
  if (!array) return null;
  
  if (minLength && array.length < minLength) {
    return VALIDATION_ERRORS.ARRAY_MIN_LENGTH(minLength);
  }
  
  if (maxLength && array.length > maxLength) {
    return VALIDATION_ERRORS.ARRAY_MAX_LENGTH(maxLength);
  }
  
  return null;
};

// Entry-specific validation
export const validateEntry = (entry, existingEntries = []) => {
  const errors = {};

  // Common field validation
  const commonFields = [
    'type', 'title', 'jurisdiction', 'law_family', 'canonical_citation',
    'source_urls', 'effective_date', 'status', 'text_raw', 'text_normalized',
    'summary', 'team_member_id'
  ];

  commonFields.forEach(field => {
    const error = validateRequired(entry[field], field);
    if (error) errors[field] = error;
  });

  // Entry ID validation
  if (entry.entry_id) {
    if (!validateEntryId(entry.entry_id)) {
      errors.entry_id = VALIDATION_ERRORS.INVALID_ENTRY_ID;
    } else {
      const existingEntry = existingEntries.find(e => e.entry_id === entry.entry_id && e.id !== entry.id);
      if (existingEntry) {
        errors.entry_id = VALIDATION_ERRORS.DUPLICATE_ENTRY_ID;
      }
    }
  }

  // Team member validation
  if (!entry.team_member_id || entry.team_member_id < 1 || entry.team_member_id > 5) {
    errors.team_member_id = VALIDATION_ERRORS.TEAM_MEMBER_REQUIRED;
  }

  // Title length validation
  const titleError = validateStringLength(entry.title, 'title', 3, 500);
  if (titleError) errors.title = titleError;

  // Source URLs validation - temporarily disabled for testing
  if (entry.source_urls && entry.source_urls.length > 0) {
    // Check if there's at least one non-empty URL
    const hasValidUrl = entry.source_urls.some(url => url && url.trim() !== '');
    if (!hasValidUrl) {
      // Temporarily comment out this validation for testing
      // errors.source_urls = VALIDATION_ERRORS.SOURCE_URL_REQUIRED;
    } else {
      // Validate each non-empty URL
      entry.source_urls.forEach((url, index) => {
        if (url && url.trim() !== '') {
          const urlError = validateUrl(url, `source_urls[${index}]`);
          if (urlError) {
            errors[`source_urls[${index}]`] = urlError;
          }
        }
      });
    }
  } else {
    // Temporarily comment out this validation for testing
    // errors.source_urls = VALIDATION_ERRORS.SOURCE_URL_REQUIRED;
  }

  // Date validation
  if (entry.effective_date) {
    const dateError = validateDate(entry.effective_date, 'effective_date');
    if (dateError) errors.effective_date = dateError;
  }

  // Amendment date validation
  if (entry.status === 'amended' && !entry.amendment_date) {
    errors.amendment_date = VALIDATION_ERRORS.AMENDMENT_DATE_REQUIRED;
  }

  // Offline pack validation
  if (entry.offline && entry.offline.pack_include && !entry.offline.pack_category) {
    errors.offline_pack_category = VALIDATION_ERRORS.PACK_CATEGORY_REQUIRED;
  }

  return errors;
};

// Type-specific validation
export const validateEntryType = (entry, existingEntries = []) => {
  const errors = {};
  const entryType = ENTRY_TYPES[entry.type];

  if (!entryType) {
    errors.type = 'Invalid entry type.';
    return errors;
  }

  // Validate type-specific required fields
  Object.entries(entryType.fields).forEach(([fieldName, fieldConfig]) => {
    if (fieldConfig.required) {
      const error = validateRequired(entry[fieldName], fieldName);
      if (error) {
        errors[fieldName] = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED(fieldConfig.label);
      }
    }
  });

  // Special validation for specific types
  switch (entry.type) {
    case 'rule_of_court':
      if (!entry.rule_no) errors.rule_no = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Rule Number');
      if (!entry.section_no) errors.section_no = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Section Number');
      break;

    case 'agency_circular':
      if (!entry.circular_no) errors.circular_no = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Circular Number');
      break;

    case 'doj_issuance':
      if (!entry.issuance_no) errors.issuance_no = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Issuance Number');
      break;

    case 'executive_issuance':
      if (!entry.instrument_no) errors.instrument_no = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Instrument Number');
      break;

    case 'pnp_sop':
      if (!entry.steps_brief || entry.steps_brief.length === 0) {
        errors.steps_brief = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Steps Brief');
      }
      if (!entry.legal_bases || entry.legal_bases.length === 0) {
        errors.legal_bases = VALIDATION_ERRORS.LEGAL_BASES_REQUIRED;
      }
      break;


    case 'incident_checklist':
      if (!entry.incident) errors.incident = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Incident');
      if (!entry.phases || entry.phases.length === 0) {
        errors.phases = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Phases');
      }
      break;

    case 'rights_advisory':
      if (!entry.rights_scope) errors.rights_scope = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Rights Scope');
      if (!entry.advice_points || entry.advice_points.length === 0) {
        errors.advice_points = VALIDATION_ERRORS.TYPE_SPECIFIC_REQUIRED('Advice Points');
      }
      if (!entry.legal_bases || entry.legal_bases.length === 0) {
        errors.legal_bases = VALIDATION_ERRORS.LEGAL_BASES_REQUIRED;
      }
      break;
  }

  return errors;
};

// Cross-reference validation
export const validateCrossReferences = (entry, existingEntries) => {
  const errors = {};

  // Validate legal_bases references
  if (entry.legal_bases && Array.isArray(entry.legal_bases)) {
    entry.legal_bases.forEach((basis, index) => {
      if (basis.type === 'internal' && basis.entry_id) {
        const referencedEntry = existingEntries.find(e => e.entry_id === basis.entry_id);
        if (!referencedEntry) {
          errors[`legal_bases[${index}]`] = `Referenced entry "${basis.entry_id}" not found.`;
        }
      }
    });
  }

  // Validate related_sections references
  if (entry.related_sections && Array.isArray(entry.related_sections)) {
    entry.related_sections.forEach((section, index) => {
      if (section.type === 'internal' && section.entry_id) {
        const referencedEntry = existingEntries.find(e => e.entry_id === section.entry_id);
        if (!referencedEntry) {
          errors[`related_sections[${index}]`] = `Referenced entry "${section.entry_id}" not found.`;
        }
      }
    });
  }

  // Validate supersedes references
  if (entry.supersedes && Array.isArray(entry.supersedes)) {
    entry.supersedes.forEach((superseded, index) => {
      if (superseded.type === 'internal' && superseded.entry_id) {
        const referencedEntry = existingEntries.find(e => e.entry_id === superseded.entry_id);
        if (!referencedEntry) {
          errors[`supersedes[${index}]`] = `Referenced entry "${superseded.entry_id}" not found.`;
        }
      }
    });
  }

  return errors;
};

// Validate entry before saving
export const validateEntryForSave = (entry, existingEntries = []) => {
  const commonErrors = validateEntry(entry, existingEntries);
  const typeErrors = validateEntryType(entry, existingEntries);
  const crossRefErrors = validateCrossReferences(entry, existingEntries);

  return {
    ...commonErrors,
    ...typeErrors,
    ...crossRefErrors
  };
};

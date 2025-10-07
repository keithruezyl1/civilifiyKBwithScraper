import { KbEntry } from './schemas';

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export function validateCrossFieldRules(data: Partial<KbEntry>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Rule 1: status = amended ⇒ amendment_date required
  if (data.status === 'amended' && !data.amendment_date) {
    errors.push({
      field: 'amendment_date',
      message: 'Amendment date is required when status is "amended"',
      type: 'error'
    });
  }
  
  // Rule 2: offline.pack_include = true ⇒ pack_category required
  if (data.offline?.pack_include && !data.offline?.pack_category) {
    errors.push({
      field: 'offline.pack_category',
      message: 'Pack category is required when including in offline pack',
      type: 'error'
    });
  }
  
  // Rule 3: pnp_sop, rights_advisory must have ≥1 legal_bases
  const typesRequiringLegalBases = ['pnp_sop', 'rights_advisory'];
  if (typesRequiringLegalBases.includes(data.type || '') && (data as any).legal_bases && (data as any).legal_bases.length === 0) {
    errors.push({
      field: 'legal_bases',
      message: 'At least one legal basis is required for this entry type',
      type: 'error'
    });
  }
  
  // Rule 4: rule_of_court ⇒ rule_no & section_no required
  if (data.type === 'rule_of_court') {
    if (!(data as any).rule_no) {
      errors.push({
        field: 'rule_no',
        message: 'Rule number is required for Rules of Court entries',
        type: 'error'
      });
    }
    if (!(data as any).section_no) {
      errors.push({
        field: 'section_no',
        message: 'Section number is required for Rules of Court entries',
        type: 'error'
      });
    }
  }
  
  // Rule 5: incident_checklist steps must have ≥1 legal_bases
  if (data.type === 'incident_checklist' && (data as any).phases) {
    (data as any).phases.forEach((phase: any, phaseIndex: number) => {
      phase.steps.forEach((step: any, stepIndex: number) => {
        if (!step.legal_bases || step.legal_bases.length === 0) {
          errors.push({
            field: `phases.${phaseIndex}.steps.${stepIndex}.legal_bases`,
            message: 'Each step must have at least one legal basis',
            type: 'error'
          });
        }
      });
    });
  }
  
  // Rule 6: At least one visibility flag must be true
  if (data.visibility) {
    const hasVisibility = data.visibility.gli || data.visibility.cpa;
    if (!hasVisibility) {
      errors.push({
        field: 'visibility',
        message: 'At least one visibility flag must be enabled',
        type: 'error'
      });
    }
  }
  
  return errors;
}

export function validateEntryIdFormat(entryId: string, type: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!entryId) {
    errors.push({
      field: 'entry_id',
      message: 'Entry ID is required',
      type: 'error'
    });
    return errors;
  }
  
  // Basic format validation based on type
  const validPatterns: Record<string, RegExp> = {
    'statute_section': /^(RPC-Art\d+|RA\d+-Sec\d+|[A-Z]+-\w+)$/,
    'rule_of_court': /^ROC-Rule\d+-Sec\d+$/,
    'city_ordinance_section': /^CEBU-CO\d+-Sec\d+$/,
    'pnp_sop': /^PNP-SOP-[A-Z]+-\d{4}$/,
    'incident_checklist': /^INC-[A-Z]+-\d{3}$/,
    'agency_circular': /^[A-Z]+-Circular-\d{4}$/,
    'doj_issuance': /^DOJ-[A-Z]+-\d{4}$/,
    'executive_issuance': /^EO-[A-Z]+-\d{4}$/,
    'rights_advisory': /^RIGHTS-[A-Z]+-\d{4}$/,
    'constitution_provision': /^CONST-[A-Z]+-Art\d+$/
  };
  
  const pattern = validPatterns[type];
  if (pattern && !pattern.test(entryId)) {
    errors.push({
      field: 'entry_id',
      message: `Entry ID format is invalid for type "${type}"`,
      type: 'error'
    });
  }
  
  return errors;
}

export function validateRequiredFields(data: Partial<KbEntry>, type: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Common required fields
  const commonRequired = ['title', 'jurisdiction', 'law_family', 'canonical_citation', 'status', 'effective_date', 'summary', 'text', 'source_urls', 'tags', 'last_reviewed'];
  
  commonRequired.forEach(field => {
    if (!data[field as keyof KbEntry]) {
      errors.push({
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        type: 'error'
      });
    }
  });
  
  // Type-specific required fields
  const typeRequiredFields: Record<string, string[]> = {
    'constitution_provision': ['topics'],
    'statute_section': ['elements', 'penalties'],
    'city_ordinance_section': ['elements', 'penalties'],
    'rule_of_court': ['rule_no', 'section_no', 'triggers'],
    'agency_circular': ['circular_no', 'applicability'],
    'doj_issuance': ['issuance_no', 'applicability'],
    'executive_issuance': ['instrument_no', 'applicability'],
    'pnp_sop': ['steps_brief', 'legal_bases'],
    'incident_checklist': ['incident', 'phases'],
    'rights_advisory': ['rights_scope', 'advice_points', 'legal_bases']
  };
  
  const requiredForType = typeRequiredFields[type] || [];
  requiredForType.forEach(field => {
    if (!data[field as keyof KbEntry]) {
      errors.push({
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required for ${type} entries`,
        type: 'error'
      });
    }
  });
  
  return errors;
}


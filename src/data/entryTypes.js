// Entry types for the law knowledge base
export const ENTRY_TYPES = {
  constitution_provision: {
    label: 'Constitution Provision',
    description: 'Article/Section of the PH Constitution',
    fields: {
      // No additional fields beyond base fields
    }
  },
  statute_section: {
    label: 'Statute Section',
    description: 'RA/RPC section (incl. IRR content if needed)',
    fields: {
      elements: { type: 'array', label: 'Elements', required: false },
      penalties: { type: 'array', label: 'Penalties', required: false },
      related_sections: { type: 'array', label: 'Related Sections', required: false }
    }
  },
  city_ordinance_section: {
    label: 'City Ordinance Section',
    description: 'Cebu City ordinance section',
    fields: {
      elements: { type: 'array', label: 'Elements', required: false },
      penalties: { type: 'array', label: 'Penalties', required: false },
      related_sections: { type: 'array', label: 'Related Sections', required: false }
    }
  },
  rule_of_court: {
    label: 'Rule of Court',
    description: 'Rule & Section (Criminal Procedure)',
    fields: {
      rule_no: { type: 'string', label: 'Rule Number', required: true },
      section_no: { type: 'string', label: 'Section Number', required: true },
      triggers: { type: 'array', label: 'Triggers', required: false },
      time_limits: { type: 'array', label: 'Time Limits', required: false }
    }
  },
  agency_circular: {
    label: 'Agency Circular',
    description: 'LTO/PNP/other agency circulars & admin orders',
    fields: {
      circular_no: { type: 'string', label: 'Circular Number', required: true },
      section_no: { type: 'string', label: 'Section Number', required: false },
      applicability: { type: 'array', label: 'Applicability', required: false },
      legal_bases: { type: 'array', label: 'Legal Bases', required: false }
    }
  },
  doj_issuance: {
    label: 'DOJ Issuance',
    description: 'DOJ circular/opinion/guideline',
    fields: {
      issuance_no: { type: 'string', label: 'Issuance Number', required: true },
      applicability: { type: 'array', label: 'Applicability', required: false },
      supersedes: { type: 'array', label: 'Supersedes', required: false },
      legal_bases: { type: 'array', label: 'Legal Bases', required: false }
    }
  },
  executive_issuance: {
    label: 'Executive Issuance',
    description: 'Official Gazette (EOs, newly signed RAs, etc.)',
    fields: {
      instrument_no: { type: 'string', label: 'Instrument Number', required: true },
      applicability: { type: 'array', label: 'Applicability', required: false },
      supersedes: { type: 'array', label: 'Supersedes', required: false },
      legal_bases: { type: 'array', label: 'Legal Bases', required: false }
    }
  },
  pnp_sop: {
    label: 'PNP SOP',
    description: 'PNP manual/SOP item',
    fields: {
      steps_brief: { type: 'array', label: 'Steps Brief', required: true },
      legal_bases: { type: 'array', label: 'Legal Bases', required: true },
      forms_required: { type: 'array', label: 'Forms Required', required: false },
      failure_states: { type: 'array', label: 'Failure States', required: false }
    }
  },
  incident_checklist: {
    label: 'Incident Checklist',
    description: 'Guided template (phases → steps)',
    fields: {
      incident: { type: 'string', label: 'Incident', required: true },
      phases: { type: 'array', label: 'Phases', required: true },
      forms: { type: 'array', label: 'Forms', required: false },
      handoff: { type: 'array', label: 'Handoff', required: false },
      rights_callouts: { type: 'array', label: 'Rights Callouts', required: false }
    }
  },
  rights_advisory: {
    label: 'Rights Advisory',
    description: 'Bill of Rights/CHR-style rights card',
    fields: {
      rights_scope: { type: 'select', label: 'Rights Scope', required: true, options: [
        { value: 'arrest', label: 'Arrest' },
        { value: 'search', label: 'Search' },
        { value: 'detention', label: 'Detention' },
        { value: 'counsel', label: 'Counsel' },
        { value: 'GBV', label: 'GBV' },
        { value: 'minors', label: 'Minors' },
        { value: 'privacy', label: 'Privacy' },
        { value: 'traffic stop', label: 'Traffic Stop' },
        { value: 'protective orders', label: 'Protective Orders' },
        { value: 'fair trial', label: 'Fair Trial' },
        { value: 'freedom of expression', label: 'Freedom of Expression' },
        { value: 'legal aid access', label: 'Legal Aid Access' },
        { value: 'complaint filing', label: 'Complaint Filing' },
        { value: 'labor rights', label: 'Labor Rights' },
        { value: 'consumer rights', label: 'Consumer Rights' },
        { value: 'housing/land rights', label: 'Housing/Land Rights' },
        { value: 'health/education', label: 'Health/Education' },
        { value: 'Other', label: 'Other (type your own)' }
      ]},
      advice_points: { type: 'array', label: 'Advice Points', required: true },
      legal_bases: { type: 'array', label: 'Legal Bases', required: true }
    }
  }
};

export const getEntryType = (type) => {
  return ENTRY_TYPES[type] || null;
};

export const getEntryTypeOptions = () => {
  // Limit to law input entry types used in the forms (GLI+CPA set)
  const allowed = [
    'constitution_provision',
    'statute_section',
    'city_ordinance_section',
    'rule_of_court',
    'agency_circular',
    'doj_issuance',
    'executive_issuance',
    'rights_advisory'
  ];
  return Object.entries(ENTRY_TYPES)
    .filter(([key]) => allowed.includes(key))
    .map(([value, type]) => ({
      value,
      label: type.label,
      description: type.description
    }));
};

// Team member assignments for daily quotas
export const TEAM_MEMBER_ASSIGNMENTS = {
  1: {
    name: 'Arda',
    description: 'RPC + Cebu Ordinances',
    dailyQuota: {
      statute_section: 7,
      city_ordinance_section: 3
    },
    fallback: 'executive_issuance'
  },
  2: {
    name: 'Delos Cientos',
    description: 'Rules of Court + DOJ (procedure-heavy)',
    dailyQuota: {
      rule_of_court: 7,
      doj_issuance: 2,
      rights_advisory: 1
    },
    fallback: 'executive_issuance'
  },
  3: {
    name: 'Paden',
    description: 'PNP SOPs + Incident Checklists',
    dailyQuota: {
      pnp_sop: 5,
      incident_checklist: 3,
      agency_circular: 2
    },
    fallback: null
  },
  4: {
    name: 'Sendrijas',
    description: 'Statute sections and agency circulars',
    dailyQuota: {
      statute_section: 8,
      agency_circular: 2
    },
    fallback: null
  },
  5: {
    name: 'Tagarao',
    description: 'Rights + Constitution + Policy',
    dailyQuota: {
      rights_advisory: 4,
      constitution_provision: 3,
      doj_issuance: 2,
      executive_issuance: 1
    },
    fallback: null
  }
};

export const getTeamMember = (id) => {
  return TEAM_MEMBER_ASSIGNMENTS[id] || null;
};

export const getAllTeamMembers = () => {
  return Object.entries(TEAM_MEMBER_ASSIGNMENTS).map(([id, member]) => ({
    id: parseInt(id),
    ...member
  }));
};









export interface KbField {
  name: string;
  kind: string;
  required: boolean;
  help?: string;
  options?: string[];
}

export interface KbType {
  label: string;
  fields: KbField[];
  crossRules?: string[];
}

export interface KbConfig {
  types: Record<string, KbType>;
  visibility: string[];
  offlineCategories: string[];
}

// Fallback defaults from the specification
const FALLBACK_TYPES: Record<string, KbType> = {
  constitution_provision: {
    label: "Constitution Provision",
    fields: [
      { name: "topics", kind: "string_array", required: true, help: "e.g., ['arrest','search','detention','privacy']" },
      { name: "related_sections", kind: "string_array", required: false, help: "refs to statutes/ROC that operationalize the right" },
      { name: "jurisprudence", kind: "string_array", required: false, help: "key case short cites (GR no., year, doctrine)" }
    ]
  },
  statute_section: {
    label: "Statute Section",
    fields: [
      { name: "elements", kind: "string_array", required: true, help: "enumerated elements/requirements" },
      { name: "penalties", kind: "string_array", required: true, help: "human-readable penalties (ranges/qualifiers)" },
      { name: "defenses", kind: "string_array", required: false, help: "typical statutory defenses/exceptions" },
      { name: "prescriptive_period", kind: "object", required: false, help: "{ value: number, unit: 'days|months|years' }" },
      { name: "standard_of_proof", kind: "string", required: false, help: "e.g., 'criminal:beyond_reasonable_doubt'" },
      { name: "related_sections", kind: "string_array", required: false, help: "related sections" },
      { name: "legal_bases", kind: "string_array", required: false, help: "legal bases" }
    ]
  },
  city_ordinance_section: {
    label: "City Ordinance Section",
    fields: [
      { name: "elements", kind: "string_array", required: true, help: "enumerated elements/requirements" },
      { name: "penalties", kind: "string_array", required: true, help: "human-readable penalties (ranges/qualifiers)" },
      { name: "defenses", kind: "string_array", required: false, help: "typical statutory defenses/exceptions" },
      { name: "related_sections", kind: "string_array", required: false, help: "related sections" },
      { name: "legal_bases", kind: "string_array", required: false, help: "legal bases" }
    ]
  },
  rule_of_court: {
    label: "Rule of Court",
    fields: [
      { name: "rule_no", kind: "string", required: true, help: "e.g., 'Rule 113'" },
      { name: "section_no", kind: "string", required: true, help: "e.g., 'Sec. 5'" },
      { name: "triggers", kind: "string_array", required: true, help: "when the rule applies" },
      { name: "time_limits", kind: "string_array", required: false, help: "deadlines ('within 12 hours', '10 days')" },
      { name: "required_forms", kind: "string_array", required: false, help: "required forms" },
      { name: "related_sections", kind: "string_array", required: false, help: "related sections" }
    ],
    crossRules: ["rule_no and section_no are required"]
  },
  agency_circular: {
    label: "Agency Circular",
    fields: [
      { name: "circular_no", kind: "string", required: true, help: "circular number" },
      { name: "section_no", kind: "string", required: false, help: "section number if applicable" },
      { name: "applicability", kind: "string_array", required: true, help: "domains/actors touched (licensing, towing, breath test)" },
      { name: "legal_bases", kind: "string_array", required: false, help: "legal bases" },
      { name: "supersedes", kind: "string_array", required: false, help: "earlier circulars affected" }
    ]
  },
  doj_issuance: {
    label: "DOJ Issuance",
    fields: [
      { name: "issuance_no", kind: "string", required: true, help: "issuance number" },
      { name: "applicability", kind: "string_array", required: true, help: "applicability" },
      { name: "legal_bases", kind: "string_array", required: false, help: "legal bases" },
      { name: "supersedes", kind: "string_array", required: false, help: "supersedes" }
    ]
  },
  executive_issuance: {
    label: "Executive Issuance",
    fields: [
      { name: "instrument_no", kind: "string", required: true, help: "instrument number" },
      { name: "applicability", kind: "string_array", required: true, help: "applicability" },
      { name: "legal_bases", kind: "string_array", required: false, help: "legal bases" },
      { name: "supersedes", kind: "string_array", required: false, help: "supersedes" }
    ]
  },
  pnp_sop: {
    label: "PNP SOP",
    fields: [
      { name: "steps_brief", kind: "string_array", required: true, help: "3–10 concise operational steps" },
      { name: "forms_required", kind: "string_array", required: false, help: "forms required" },
      { name: "failure_states", kind: "string_array", required: false, help: "pitfalls / suppression risks" },
      { name: "legal_bases", kind: "string_array", required: true, help: "legal bases" }
    ],
    crossRules: ["must have ≥1 legal_bases"]
  },
  incident_checklist: {
    label: "Incident Checklist",
    fields: [
      { name: "incident", kind: "string", required: true, help: "scenario name (e.g., DUI, Road Crash, Hot Pursuit)" },
      { name: "phases", kind: "phases_array", required: true, help: "ordered groups (Arrival, Rights, Actions, Documents…)" },
      { name: "forms", kind: "string_array", required: false, help: "forms" },
      { name: "handoff", kind: "string_array", required: false, help: "handoff" },
      { name: "rights_callouts", kind: "string_array", required: false, help: "rights callouts" }
    ]
  },
  rights_advisory: {
    label: "Rights Advisory",
    fields: [
      { name: "rights_scope", kind: "select", required: true, options: [
        "arrest",
        "search",
        "detention",
        "counsel",
        "GBV",
        "minors",
        "privacy",
        "traffic stop",
        "protective orders",
        "fair trial",
        "freedom of expression",
        "legal aid access",
        "complaint filing",
        "labor rights",
        "consumer rights",
        "housing/land rights",
        "health/education",
        "Other"
      ], help: "rights scope (choose 'Other' to type your own)" },
      { name: "advice_points", kind: "string_array", required: true, help: "short actionable lines" },
      { name: "legal_bases", kind: "string_array", required: true, help: "legal bases" },
      { name: "related_sections", kind: "string_array", required: false, help: "related sections" }
    ],
    crossRules: ["must have ≥1 legal_bases"]
  }
};

const FALLBACK_CONFIG: KbConfig = {
  types: FALLBACK_TYPES,
  visibility: ["gli", "cpa"],
  offlineCategories: ["sop", "checklist", "traffic", "rights", "roc"]
};

export function parseKbRules(): KbConfig {
  // For now, return the fallback config
  // In a real implementation, this would parse the KB-rules.md file
  // and extract the configuration dynamically
  return FALLBACK_CONFIG;
}

export function getKbConfig(): KbConfig {
  try {
    return parseKbRules();
  } catch (error) {
    console.warn('Failed to parse KB rules, using fallback config:', error);
    return FALLBACK_CONFIG;
  }
}


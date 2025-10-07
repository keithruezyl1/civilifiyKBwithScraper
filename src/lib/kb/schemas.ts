import { z } from 'zod';
import { getKbConfig } from './parseKbRules';

// Common field schemas
const commonFields = {
  entry_id: z.string().min(1, "Entry ID is required"),
  type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  law_family: z.string().min(1, "Law family is required"),
  section_id: z.string().optional(),
  canonical_citation: z.string().min(1, "Canonical citation is required"),
  status: z.string().optional(),
  effective_date: z.string().optional(),
  amendment_date: z.string().optional(),
  summary: z.string().min(1, "Summary is required"),
  text: z.string().min(1, "Text is required"),
  source_urls: z.array(z.string().url("Must be a valid URL")).min(1, "At least one source URL is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  last_reviewed: z.string().min(1, "Last reviewed date is required"),
  visibility: z.object({
    gli: z.boolean(),
    cpa: z.boolean()
  }),
  offline: z.object({
    pack_include: z.boolean().optional(),
    pack_category: z.enum(["sop", "checklist", "traffic", "rights", "roc"]).optional(),
    pack_priority: z.enum(["1", "2", "3"]).optional()
  }).optional()
};

// Type-specific field schemas
const typeSpecificSchemas = {
  constitution_provision: z.object({
    topics: z.array(z.string()).optional(),
    related_sections: z.array(z.string()).optional(),
    jurisprudence: z.array(z.string()).optional()
  }),
  
  statute_section: z.object({
    elements: z.array(z.string()).min(1, "At least one element is required"),
    penalties: z.array(z.string()).min(1, "At least one penalty is required"),
    defenses: z.array(z.string()).optional(),
    prescriptive_period: z.object({
      value: z.number().positive(),
      unit: z.enum(["days", "months", "years"])
    }).optional(),
    standard_of_proof: z.string().optional(),
    related_sections: z.array(z.string()).optional(),
    legal_bases: z.array(z.string()).optional()
  }),
  
  city_ordinance_section: z.object({
    elements: z.array(z.string()).min(1, "At least one element is required"),
    penalties: z.array(z.string()).min(1, "At least one penalty is required"),
    defenses: z.array(z.string()).optional(),
    related_sections: z.array(z.string()).optional(),
    legal_bases: z.array(z.string()).optional()
  }),
  
  rule_of_court: z.object({
    rule_no: z.string().min(1, "Rule number is required"),
    section_no: z.string().min(1, "Section number is required"),
    triggers: z.array(z.string()).min(1, "At least one trigger is required"),
    time_limits: z.array(z.string()).optional(),
    required_forms: z.array(z.string()).optional(),
    related_sections: z.array(z.string()).optional()
  }),
  
  agency_circular: z.object({
    circular_no: z.string().min(1, "Circular number is required"),
    section_no: z.string().optional(),
    applicability: z.array(z.string()).min(1, "At least one applicability is required"),
    legal_bases: z.array(z.string()).optional(),
    supersedes: z.array(z.string()).optional()
  }),
  
  doj_issuance: z.object({
    issuance_no: z.string().min(1, "Issuance number is required"),
    applicability: z.array(z.string()).min(1, "At least one applicability is required"),
    legal_bases: z.array(z.string()).optional(),
    supersedes: z.array(z.string()).optional()
  }),
  
  executive_issuance: z.object({
    instrument_no: z.string().min(1, "Instrument number is required"),
    applicability: z.array(z.string()).min(1, "At least one applicability is required"),
    legal_bases: z.array(z.string()).optional(),
    supersedes: z.array(z.string()).optional()
  }),
  
  pnp_sop: z.object({
    steps_brief: z.array(z.string()).min(1, "At least one step is required"),
    forms_required: z.array(z.string()).optional(),
    failure_states: z.array(z.string()).optional(),
    legal_bases: z.array(z.string()).min(1, "At least one legal basis is required")
  }),
  
  
  incident_checklist: z.object({
    incident: z.string().min(1, "Incident name is required"),
    phases: z.array(z.object({
      name: z.string().min(1, "Phase name is required"),
      steps: z.array(z.object({
        text: z.string().min(1, "Step text is required"),
        condition: z.string().optional(),
        deadline: z.string().optional(),
        evidence_required: z.array(z.string()).optional(),
        legal_bases: z.array(z.object({
          type: z.enum(["internal", "external"]),
          entry_id: z.string().optional(),
          citation: z.string().optional(),
          url: z.string().url().optional()
        })).optional(),
        failure_state: z.string().optional()
      })).min(1, "At least one step is required")
    })).min(1, "At least one phase is required"),
    forms: z.array(z.string()).optional(),
    handoff: z.array(z.string()).optional(),
    rights_callouts: z.array(z.string()).optional()
  }),
  
  rights_advisory: z.object({
    rights_scope: z.enum(["arrest", "search", "detention", "minors", "GBV", "counsel", "privacy"]),
    advice_points: z.array(z.string()).min(1, "At least one advice point is required"),
    legal_bases: z.array(z.string()).min(1, "At least one legal basis is required"),
    related_sections: z.array(z.string()).optional()
  })
};

// Cross-field validation functions
export function createKbEntrySchema() {
  const baseSchema = z.object(commonFields);
  
  return baseSchema.refine((data) => {
    // Cross-field validations
    if (data.status === "amended" && !data.amendment_date) {
      return false;
    }
    if (data.offline?.pack_include && !data.offline?.pack_category) {
      return false;
    }
    return true;
  }, {
    message: "Cross-field validation failed",
    path: ["status"]
  }).and(
    z.discriminatedUnion("type", [
      z.object({ type: z.literal("constitution_provision") }).merge(typeSpecificSchemas.constitution_provision),
      z.object({ type: z.literal("statute_section") }).merge(typeSpecificSchemas.statute_section),
      z.object({ type: z.literal("city_ordinance_section") }).merge(typeSpecificSchemas.city_ordinance_section),
      z.object({ type: z.literal("rule_of_court") }).merge(typeSpecificSchemas.rule_of_court),
      z.object({ type: z.literal("agency_circular") }).merge(typeSpecificSchemas.agency_circular),
      z.object({ type: z.literal("doj_issuance") }).merge(typeSpecificSchemas.doj_issuance),
      z.object({ type: z.literal("executive_issuance") }).merge(typeSpecificSchemas.executive_issuance),
      z.object({ type: z.literal("pnp_sop") }).merge(typeSpecificSchemas.pnp_sop),
      z.object({ type: z.literal("incident_checklist") }).merge(typeSpecificSchemas.incident_checklist),
      z.object({ type: z.literal("rights_advisory") }).merge(typeSpecificSchemas.rights_advisory)
    ])
  );
}

export const kbEntrySchema = createKbEntrySchema();

export type KbEntry = z.infer<typeof kbEntrySchema>;


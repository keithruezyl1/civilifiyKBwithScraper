// civilify-kb-schemas.ts (copied into app src/lib for CRA compatibility)
import { z } from "zod";

export const TypeEnum = z.enum([
  "constitution_provision",
  "statute_section",
  "city_ordinance_section",
  "rule_of_court",
  "agency_circular",
  "doj_issuance",
  "executive_issuance",
  "rights_advisory",
]);

export const StatusEnum = z.enum(["active", "amended", "repealed", "draft", "approved", "published"]);

const JurisdictionOther = z
  .string()
  .min(3, "Enter a jurisdiction like 'Cavite' or 'Quezon City'")
  .max(40, "Keep it under 40 characters")
  .regex(/^[A-Za-zÀ-ÿ]+(?:[-' ]+[A-Za-zÀ-ÿ]+)*(?: City| Province)?$/, "Use title case, letters/spaces only (e.g., 'Cavite', 'Quezon City', 'Baguio')");
export const Jurisdiction = z.union([z.literal("PH"), JurisdictionOther]);

export const Url = z.string().url("Provide a valid URL");
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const EntryRef = z.discriminatedUnion("type", [
  z.object({ type: z.literal("internal"), entry_id: z.string().min(1), note: z.string().optional() }),
  z.object({ type: z.literal("external"), citation: z.string().min(1), url: Url.optional(), note: z.string().optional() }),
]);
export type EntryRefType = z.infer<typeof EntryRef>;

export const LegalBasis = z.discriminatedUnion("type", [
  z.object({ type: z.literal("internal"), entry_id: z.string().min(1), note: z.string().optional(), title: z.string().optional() }),
  z.object({ type: z.literal("external"), citation: z.string().min(1), url: Url.optional(), note: z.string().optional(), title: z.string().optional() }),
]);
export type LegalBasisType = z.infer<typeof LegalBasis>;

export const FineRow = z.object({ offense_no: z.number().int().gte(1), amount: z.number().gte(0), currency: z.string().default("PHP") });
export type FineRowType = z.infer<typeof FineRow>;

export const IncidentStep = z.object({
  text: z.string().min(1, "Step text is required"),
  condition: z.string().optional(),
  deadline: z.string().optional(),
  evidence_required: z.array(z.string()).default([]),
  legal_bases: z.array(LegalBasis).default([]),
  failure_state: z.string().optional(),
});
export const IncidentPhase = z.object({ name: z.string().min(1), steps: z.array(IncidentStep).min(1, "Add at least one step") });

export const BaseEntry = z.object({
  type: TypeEnum,
  entry_id: z.string().min(1),
  title: z.string().min(1),
  jurisdiction: Jurisdiction.optional(),
  law_family: z.string().optional(),
  section_id: z.string().optional(),
  canonical_citation: z.string().optional(),
  status: StatusEnum.optional(),
  effective_date: IsoDate.optional(),
  amendment_date: IsoDate.nullable().optional(),
  summary: z.string().optional(),
  text: z.string().optional(),
  source_urls: z.array(Url).default([]),
  tags: z.array(z.string()).default([]),
  last_reviewed: IsoDate.optional(),
  visibility: z.object({ gli: z.boolean().default(true), cpa: z.boolean().default(false) }),
});

export const ConstitutionProvision = BaseEntry.extend({ type: z.literal("constitution_provision"), topics: z.array(z.string()).default([]), related_sections: z.array(EntryRef).default([]), jurisprudence: z.array(z.string()).default([]).optional() });
export const StatuteSection = BaseEntry.extend({
  type: z.literal("statute_section"),
  elements: z.array(z.string()).default([]),
  penalties: z.array(z.string()).default([]),
  defenses: z.array(z.string()).default([]).optional(),
  // Allow NA string for value, or a positive number; entire field optional
  prescriptive_period: z
    .object({
      value: z.union([z.number().positive(), z.literal('NA')]),
      unit: z.enum(["days", "months", "years", "NA"]).optional(),
    })
    .optional(),
  standard_of_proof: z.string().optional(),
  related_sections: z.array(EntryRef).default([]),
  legal_bases: z.array(LegalBasis).default([]),
});
export const CityOrdinanceSection = BaseEntry.extend({ type: z.literal("city_ordinance_section"), elements: z.array(z.string()).default([]), penalties: z.array(z.string()).default([]), defenses: z.array(z.string()).default([]).optional(), related_sections: z.array(EntryRef).default([]), legal_bases: z.array(LegalBasis).default([]) });
export const RuleOfCourt = BaseEntry.extend({ type: z.literal("rule_of_court"), rule_no: z.string().min(1), section_no: z.string().min(1), triggers: z.array(z.string()).default([]), time_limits: z.array(z.string()).default([]), required_forms: z.array(z.string()).default([]).optional(), related_sections: z.array(EntryRef).default([]) });
export const AgencyCircular = BaseEntry.extend({ type: z.literal("agency_circular"), circular_no: z.string().optional(), section_no: z.string().optional(), applicability: z.array(z.string()).default([]), legal_bases: z.array(LegalBasis).default([]), supersedes: z.array(EntryRef).default([]) });
export const DojIssuance = BaseEntry.extend({ type: z.literal("doj_issuance"), issuance_no: z.string().optional(), applicability: z.array(z.string()).default([]), legal_bases: z.array(LegalBasis).default([]), supersedes: z.array(EntryRef).default([]) });
export const ExecutiveIssuance = BaseEntry.extend({ type: z.literal("executive_issuance"), instrument_no: z.string().optional(), applicability: z.array(z.string()).default([]), legal_bases: z.array(LegalBasis).default([]), supersedes: z.array(EntryRef).default([]) });
export const RightsAdvisory = BaseEntry.extend({
  type: z.literal("rights_advisory"),
  rights_scope: z
    .union([
      z.enum([
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
      ]),
      // Allow custom scopes when user selects Other and types their own
      z.string().min(2).max(80),
    ])
    .optional(),
  advice_points: z.array(z.string()).default([]),
  legal_bases: z.array(LegalBasis).default([]),
  related_sections: z.array(EntryRef).default([]),
});

export const EntrySchema = z.discriminatedUnion("type", [ConstitutionProvision, StatuteSection, CityOrdinanceSection, RuleOfCourt, AgencyCircular, DojIssuance, ExecutiveIssuance, RightsAdvisory]);
export type Entry = z.infer<typeof EntrySchema>;
export type TypeEnumType = z.infer<typeof TypeEnum>;
export const schemasByType: Record<TypeEnumType, z.ZodTypeAny> = {
  constitution_provision: ConstitutionProvision,
  statute_section: StatuteSection,
  city_ordinance_section: CityOrdinanceSection,
  rule_of_court: RuleOfCourt,
  agency_circular: AgencyCircular,
  doj_issuance: DojIssuance,
  executive_issuance: ExecutiveIssuance,
  rights_advisory: RightsAdvisory,
} as const;

export function validateBusinessRules(entry: Entry): string[] {
  const errors: string[] = [];
  if (entry.status === "amended" && !entry.amendment_date) errors.push("amendment_date is required when status is 'amended'.");
  
  // Type-specific validations
  if (entry.type === "rights_advisory" && "legal_bases" in entry && entry.legal_bases.length === 0) errors.push("Rights advisory must include at least one legal basis.");
  
  const j = Jurisdiction.safeParse(entry.jurisdiction);
  if (!j.success) errors.push("Jurisdiction must be 'PH' or a title-cased location like 'Quezon City'.");
  return errors;
}




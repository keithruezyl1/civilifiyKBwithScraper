// Day 1 is fixed to 2025-09-04 as requested
export const KB_PROJECT_START = new Date("2025-09-04");

export const GLI_CPA_TYPES = [
  "statute_section",
  "rule_of_court",
  "rights_advisory",
  "constitution_provision",
  "agency_circular",
  "doj_issuance",
  "executive_issuance",
  "city_ordinance_section",
] as const;

export type PlanType = typeof GLI_CPA_TYPES[number];














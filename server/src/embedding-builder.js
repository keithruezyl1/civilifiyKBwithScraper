// Build a rich text blob for embeddings by flattening core, type-specific,
// and relation fields from a KB entry-like object.
// The input is expected to look like the parsed body used in kb routes
// (strings, arrays of strings, and arrays of relation objects).

function joinStrings(values) {
  if (!Array.isArray(values)) return '';
  return values
    .map((v) => (typeof v === 'string' ? v : (v == null ? '' : String(v))))
    .filter((v) => v && v.trim().length > 0)
    .join(' \u2022 ');
}

function joinObjects(values) {
  if (!Array.isArray(values)) return '';
  return values
    .map((v) => (v == null ? '' : String(v)))
    .filter((v) => v && v.trim().length > 0)
    .join(' \u2022 ');
}

function flattenRelations(relArray) {
  if (!Array.isArray(relArray)) return '';
  return relArray
    .map((it) => {
      if (!it) return '';
      const parts = [];
      if (it.type) parts.push(`[${String(it.type)}]`);
      if (it.entry_id) parts.push(String(it.entry_id));
      if (it.citation) parts.push(String(it.citation));
      if (it.title) parts.push(String(it.title));
      if (it.url) parts.push(String(it.url));
      if (it.note) parts.push(String(it.note));
      return parts.join(' ');
    })
    .filter(Boolean)
    .join(' \u2022 ');
}

function flattenPhases(phases) {
  if (!Array.isArray(phases)) return '';
  const lines = [];
  for (const ph of phases) {
    if (!ph) continue;
    const name = ph.name ? String(ph.name) : '';
    if (Array.isArray(ph.steps)) {
      for (const st of ph.steps) {
        if (!st) continue;
        const bits = [];
        if (st.text) bits.push(String(st.text));
        if (st.condition) bits.push(`cond: ${String(st.condition)}`);
        if (st.deadline) bits.push(`deadline: ${String(st.deadline)}`);
        if (Array.isArray(st.evidence_required) && st.evidence_required.length) {
          bits.push(`evidence: ${joinStrings(st.evidence_required)}`);
        }
        if (Array.isArray(st.legal_bases) && st.legal_bases.length) {
          const rel = st.legal_bases
            .map((lb) => {
              if (!lb) return '';
              const parts = [];
              if (lb.type) parts.push(`[${String(lb.type)}]`);
              if (lb.entry_id) parts.push(String(lb.entry_id));
              if (lb.citation) parts.push(String(lb.citation));
              if (lb.title) parts.push(String(lb.title));
              if (lb.url) parts.push(String(lb.url));
              return parts.join(' ');
            })
            .filter(Boolean)
            .join(' | ');
          if (rel) bits.push(`bases: ${rel}`);
        }
        if (st.failure_state) bits.push(`fail: ${String(st.failure_state)}`);
        const label = name ? `Phase ${name}` : 'Phase';
        const line = `${label}: ${bits.join(' | ')}`;
        if (line.trim()) lines.push(line);
      }
    }
  }
  return lines.join('\n');
}

function addIf(lines, label, value) {
  if (!value && value !== 0) return;
  const str = typeof value === 'string' ? value : String(value);
  if (str && str.trim().length > 0) lines.push(`${label}: ${str.trim()}`);
}

export function buildEmbeddingText(entry) {
  const e = entry || {};
  const lines = [];

  // Core
  addIf(lines, 'Title', e.title);
  addIf(lines, 'Type', e.type);
  addIf(lines, 'Canonical Citation', e.canonical_citation);
  addIf(lines, 'Section', e.section_id);
  addIf(lines, 'Status', e.status);
  addIf(lines, 'Jurisdiction', e.jurisdiction);
  addIf(lines, 'Law Family', e.law_family);
  addIf(lines, 'Summary', e.summary);
  addIf(lines, 'Text', e.text);
  addIf(lines, 'Tags', joinStrings(e.tags));
  addIf(lines, 'Source URLs', joinStrings(e.source_urls));
  addIf(lines, 'Effective Date', e.effective_date);
  addIf(lines, 'Amendment Date', e.amendment_date);
  addIf(lines, 'Last Reviewed', e.last_reviewed);

  // Statute / ordinance specifics
  addIf(lines, 'Elements', joinStrings(e.elements));
  addIf(lines, 'Penalties', joinStrings(e.penalties));
  addIf(lines, 'Defenses', joinStrings(e.defenses));
  addIf(lines, 'Prescriptive Period', e.prescriptive_period);
  addIf(lines, 'Standard of Proof', e.standard_of_proof);

  // Rules of Court
  addIf(lines, 'Rule No', e.rule_no);
  addIf(lines, 'Section No', e.section_no);
  addIf(lines, 'Triggers', joinStrings(e.triggers));
  addIf(lines, 'Time Limits', joinStrings(e.time_limits));
  addIf(lines, 'Required Forms', joinStrings(e.required_forms));

  // Agency/DOJ/Executive
  addIf(lines, 'Circular No', e.circular_no);
  addIf(lines, 'Applicability', joinStrings(e.applicability));
  addIf(lines, 'Issuance No', e.issuance_no);
  addIf(lines, 'Instrument No', e.instrument_no);
  addIf(lines, 'Supersedes', joinObjects(e.supersedes));

  // PNP SOP
  addIf(lines, 'Steps Brief', joinStrings(e.steps_brief));
  addIf(lines, 'Forms Required', joinStrings(e.forms_required));
  addIf(lines, 'Failure States', joinStrings(e.failure_states));

  // LTO / Traffic extras
  addIf(lines, 'Violation Code', e.violation_code);
  addIf(lines, 'Violation Name', e.violation_name);
  addIf(lines, 'License Action', e.license_action);
  if (e.fine_schedule != null) addIf(lines, 'Fine Schedule', typeof e.fine_schedule === 'string' ? e.fine_schedule : JSON.stringify(e.fine_schedule));
  addIf(lines, 'Apprehension Flow', joinStrings(e.apprehension_flow));

  // Incident checklist
  addIf(lines, 'Incident', e.incident);
  const phasesText = flattenPhases(e.phases);
  if (phasesText) lines.push(phasesText);
  addIf(lines, 'Forms', joinStrings(e.forms));
  addIf(lines, 'Handoff', joinStrings(e.handoff));
  addIf(lines, 'Rights Callouts', joinStrings(e.rights_callouts));

  // Rights advisory
  addIf(lines, 'Rights Scope', e.rights_scope);
  addIf(lines, 'Advice Points', joinStrings(e.advice_points));

  // Constitution
  addIf(lines, 'Topics', joinStrings(e.topics));
  addIf(lines, 'Jurisprudence', joinStrings(e.jurisprudence));

  // Relations
  const legalBasesText = flattenRelations(e.legal_bases);
  if (legalBasesText) lines.push(`Legal Bases: ${legalBasesText}`);
  const relatedSectionsText = flattenRelations(e.related_sections);
  if (relatedSectionsText) lines.push(`Related Sections: ${relatedSectionsText}`);

  return lines.join('\n\n');
}

export default buildEmbeddingText;



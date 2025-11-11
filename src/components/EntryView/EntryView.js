import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntryType } from '../../data/entryTypes';
import { getJurisdiction } from '../../data/jurisdictions';
// import { getTagByValue } from '../../data/tags';
import './EntryView.css';
import { fetchEntryById, verifyEntry, reverifyEntry } from '../../services/kbApi';
import { useAuth } from '../../contexts/AuthContext';

const EntryView = ({ entry, onEdit, onDelete, onExport, teamMemberNames = {} }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentEntry, setCurrentEntry] = useState(entry);

  // Sync internal state when parent-selected entry changes
  useEffect(() => {
    setCurrentEntry(entry);
    // also ensure the inner container scrolls to top when changing
    try {
      const overlay = document.querySelector('.entry-detail-overlay .entry-view-container');
      if (overlay) overlay.scrollTop = 0;
    } catch {}
  }, [entry]);
  const [isVerifying, setIsVerifying] = useState(false);
  
  if (!currentEntry) {
    return (
      <div className="no-entry">
        <h3>Entry not found</h3>
        <p>The requested entry could not be found.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Back to List
        </button>
      </div>
    );
  }

  const entryType = getEntryType(currentEntry.type);
  const jurisdiction = getJurisdiction(currentEntry.jurisdiction);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not specified';
    return new Date(dateTimeString).toLocaleString();
  };

  const handleVerify = async () => {
    if (!user) return;
    
    setIsVerifying(true);
    try {
      const updatedEntry = await verifyEntry(currentEntry.entry_id);
      if (updatedEntry) {
        setCurrentEntry(updatedEntry);
      }
    } catch (error) {
      console.error('Failed to verify entry:', error);
      alert('Failed to verify entry: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReverify = async () => {
    if (!user) return;
    
    setIsVerifying(true);
    try {
      const updatedEntry = await reverifyEntry(currentEntry.entry_id);
      if (updatedEntry) {
        setCurrentEntry(updatedEntry);
      }
    } catch (error) {
      console.error('Failed to re-verify entry:', error);
      alert('Failed to re-verify entry: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const renderArrayField = (fieldName, items, label) => {
    console.log(`Rendering ${fieldName}:`, items);
    if (!items || items.length === 0) return null;
    
    return (
      <div className="field-group">
        <h4>{label}</h4>
        <ul className="array-list">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderLegalBases = (legalBases) => {
    if (!legalBases || !Array.isArray(legalBases) || legalBases.length === 0) return null;
    
    return (
              <div className="field-group">
          <h4>Legal Bases</h4>
          <div className="legal-bases-grid">
            {legalBases.map((basis, index) => (
              <div
                key={index}
                className="legal-basis-card clickable"
                onClick={async () => {
                  if (basis?.type === 'internal' && basis?.entry_id) {
                    const target = await fetchEntryById(basis.entry_id);
                    if (target) {
                      window.dispatchEvent(new CustomEvent('open-entry-detail', { detail: { entry: { ...target, id: target.entry_id } } }));
                    }
                  }
                }}
              >
                <div className="basis-header">
                  <span className={`basis-type-pill ${basis.type}`}>
                    {basis.type === 'internal' ? 'Internal' : 'External'}
                  </span>
                  {basis.topic && <span className="basis-topic-pill">{basis.topic}</span>}
                </div>
                {/* Title - consistent for both types */}
                <div className="basis-title">
                  {basis.type === 'internal' ? (
                    <span
                      className="link-button"
                      onClick={async () => {
                        const entryId = basis.entry_id;
                        if (!entryId) return;
                        try {
                          const target = await fetchEntryById(entryId);
                          if (target) {
                            window.dispatchEvent(new CustomEvent('open-entry-detail', { detail: { entry: { ...target, id: target.entry_id }, entryId } }));
                          }
                        } catch {}
                      }}
                    >
                      {basis.title || basis.entry_id}
                    </span>
                  ) : (
                    <span className="basis-title-text">{basis.title || basis.citation}</span>
                  )}
                </div>
                
                {/* Citation - smaller grey text below title */}
                <div className="basis-citation">
                  {basis.type === 'internal' ? (
                    <span className="citation-text">{basis.canonical_citation || basis.entry_id}</span>
                  ) : (
                    <span className="citation-text">{basis.citation}</span>
                  )}
                </div>
                
                {/* Topic/Summary - descriptive text */}
                {(basis.topic || basis.summary) && (
                  <div className="basis-description">
                    {basis.type === 'internal' ? (
                      <span className="description-text">{basis.summary || basis.topic}</span>
                    ) : (
                      <span className="description-text">{basis.topic}</span>
                    )}
                  </div>
                )}
                
                {/* Note - if provided */}
                {basis.note && <div className="basis-note">{basis.note}</div>}
                
                {/* URL - at the bottom */}
                {basis.url && (
                  <div className="basis-url">
                    <a href={basis.url} target="_blank" rel="noopener noreferrer" className="url-link">
                      {basis.url}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    );
  };

  const renderFineSchedule = (fineSchedule) => {
    if (!fineSchedule || fineSchedule.length === 0) return null;
    
    return (
      <div className="field-group">
        <h4>Fine Schedule</h4>
        <div className="fine-schedule">
          <table>
            <thead>
              <tr>
                <th>Offense #</th>
                <th>Amount</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {fineSchedule.map((fine, index) => (
                <tr key={index}>
                  <td>{fine.offense_no}</td>
                  <td>{fine.amount}</td>
                  <td>{fine.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPhases = (phases) => {
    if (!phases || phases.length === 0) return null;
    
    return (
      <div className="field-group">
        <h4>Phases</h4>
        <div className="phases-list">
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="phase-item">
              <h5>{phase.name}</h5>
              {phase.steps && phase.steps.length > 0 && (
                <ol className="steps-list">
                  {phase.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="step-item">
                      <div className="step-text">{step.text}</div>
                      {step.condition && <div className="step-condition">Condition: {step.condition}</div>}
                      {step.deadline && <div className="step-deadline">Deadline: {step.deadline}</div>}
                      {step.evidence_required && step.evidence_required.length > 0 && (
                        <div className="step-evidence">
                          Evidence: {step.evidence_required.join(', ')}
                        </div>
                      )}
                      {step.failure_state && <div className="step-failure">Failure: {step.failure_state}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTypeSpecificFields = () => {
    if (!currentEntry.type) return null;

    // Helper function to render a field with proper alignment
    const renderField = (label, value, type = 'text') => {
      let displayValue = 'Empty';
      
      if (value !== null && value !== undefined && value !== '') {
        if (type === 'array' && Array.isArray(value)) {
          displayValue = value.length > 0 ? value.join(', ') : 'Empty';
        } else if (type === 'object' && typeof value === 'object') {
          displayValue = JSON.stringify(value, null, 2);
        } else if (type === 'date' && value) {
          displayValue = formatDate(value);
        } else {
          displayValue = String(value);
        }
      }
      
      // Special handling for Prescriptive Period
      if (label === 'Prescriptive Period') {
        try {
          // Handle JSON string format
          let parsedValue = value;
          if (typeof value === 'string' && value.startsWith('{')) {
            parsedValue = JSON.parse(value);
          }
          
          // Check if it's an object with value and unit
          if (parsedValue && typeof parsedValue === 'object' && parsedValue.value !== undefined && parsedValue.unit !== undefined) {
            const periodValue = parsedValue.value;
            const periodUnit = parsedValue.unit;
            
            // Check if value is a positive integer and unit is not NA
            if (periodValue && 
                !isNaN(periodValue) && 
                Number.isInteger(Number(periodValue)) && 
                Number(periodValue) > 0 && 
                periodUnit && 
                periodUnit !== 'NA' && 
                periodUnit !== 'na' && 
                periodUnit !== 'N/A' && 
                periodUnit !== 'Not Available' && 
                periodUnit !== 'Not available') {
              displayValue = `${periodValue} ${periodUnit}`;
            } else {
              displayValue = 'No Prescriptive Period';
            }
          } else if (value === null || value === undefined || value === '' || value === 'NA' || value === 'na' || value === 'N/A' || value === 'Not Available' || value === 'Not available') {
            displayValue = 'No Prescriptive Period';
          } else {
            displayValue = 'No Prescriptive Period';
          }
        } catch (error) {
          // If parsing fails, check for simple NA values
          if (value === null || value === undefined || value === '' || value === 'NA' || value === 'na' || value === 'N/A' || value === 'Not Available' || value === 'Not available') {
            displayValue = 'No Prescriptive Period';
          } else {
            displayValue = 'No Prescriptive Period';
          }
        }
      }
      
      return (
        <div className="info-item" key={label}>
          <span className="label">{label}:</span>
          <span className="value">{displayValue}</span>
        </div>
      );
    };

    // Helper function to render array fields with proper structure
    const renderArrayFieldStructured = (fieldName, items, label, itemRenderer = null) => {
      return (
        <div className="field-group" key={fieldName}>
          <h4 className="field-group-title">{label}</h4>
          <div className="field-group-content">
            {items && Array.isArray(items) && items.length > 0 ? (
              itemRenderer ? (
                items.map((item, index) => itemRenderer(item, index))
              ) : (
                <ul className="array-list">
                  {items.map((item, index) => (
                    <li key={index} className="array-item">
                      {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="empty-field">Empty</div>
            )}
          </div>
        </div>
      );
    };

    // Helper function to render legal bases with proper structure
    const renderLegalBasesStructured = (legalBases) => {
      return (
        <div className="field-group">
          <h4 className="field-group-title">Legal Bases</h4>
          <div className="field-group-content">
            {legalBases && Array.isArray(legalBases) && legalBases.length > 0 ? (
              <div className="legal-bases-list">
                {legalBases.map((basis, index) => (
                  <div key={index} className="legal-basis-item">
                    <div className="basis-header">
                      <span className="basis-type">{basis.type}</span>
                      {(basis.title || basis.topic) && <span className="basis-topic">({basis.title || basis.topic})</span>}
                    </div>
                    <div className="basis-content">
                      {basis.type === 'internal' ? (
                        <>
                          {basis.entry_id}
                          {(basis.title || basis.topic) && <span className="basis-title"> — {basis.title || basis.topic}</span>}
                        </>
                      ) : (
                        <>
                          {basis.citation}
                          {(basis.title || basis.topic) && <span className="basis-title"> — {basis.title || basis.topic}</span>}
                        </>
                      )}
                    </div>
                    {basis.note && <div className="basis-note">{basis.note}</div>}
                    {basis.url && (
                      <a href={basis.url} target="_blank" rel="noopener noreferrer" className="basis-url">
                        {basis.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-field">Empty</div>
            )}
          </div>
        </div>
      );
    };

    // Helper function to render fine schedule with proper table structure
    const renderFineScheduleStructured = (fineSchedule) => {
      if (!fineSchedule || !Array.isArray(fineSchedule) || fineSchedule.length === 0) return null;
      
      return (
        <div className="field-group">
          <h4 className="field-group-title">Fine Schedule</h4>
          <div className="field-group-content">
            <div className="fine-schedule">
              <table className="fine-table">
                <thead>
                  <tr>
                    <th>Offense #</th>
                    <th>Amount</th>
                    <th>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {fineSchedule.map((fine, index) => (
                    <tr key={index}>
                      <td>{fine.offense_no || index + 1}</td>
                      <td>{fine.amount}</td>
                      <td>{fine.currency || 'PHP'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    };

    // Helper function to render phases with proper structure
    const renderPhasesStructured = (phases) => {
      if (!phases || !Array.isArray(phases) || phases.length === 0) return null;
      
      return (
        <div className="field-group">
          <h4 className="field-group-title">Phases</h4>
          <div className="field-group-content">
            <div className="phases-list">
              {phases.map((phase, phaseIndex) => (
                <div key={phaseIndex} className="phase-item">
                  <h5 className="phase-name">{phase.name}</h5>
                  {phase.steps && Array.isArray(phase.steps) && phase.steps.length > 0 && (
                    <ol className="steps-list">
                      {phase.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="step-item">
                          <div className="step-text">{step.text}</div>
                          {step.condition && <div className="step-condition">Condition: {step.condition}</div>}
                          {step.deadline && <div className="step-deadline">Deadline: {step.deadline}</div>}
                          {step.evidence_required && Array.isArray(step.evidence_required) && step.evidence_required.length > 0 && (
                            <div className="step-evidence">Evidence: {step.evidence_required.join(', ')}</div>
                          )}
                          {step.failure_state && <div className="step-failure">Failure: {step.failure_state}</div>}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    const pp = (() => {
      const v = currentEntry.prescriptive_period;
      if (!v) return null;
      try {
        if (typeof v === 'string') {
          const parsed = JSON.parse(v);
          if (parsed && parsed.value && parsed.unit) return `${parsed.value} ${String(parsed.unit).replace(/s$/,'')}s`;
        }
        if (typeof v === 'object' && v.value && v.unit) {
          return `${v.value} ${String(v.unit).replace(/s$/,'')}s`;
        }
      } catch {}
      return String(v);
    })();

    // Function to render subtype-specific fields
    const renderSubtypeFields = (subtypeFields, entrySubtype) => {
      if (!subtypeFields || typeof subtypeFields !== 'object') return null;
      
      const fields = [];
      
      // Handle different statute subtypes
      if (entrySubtype === 'republic_act' && subtypeFields.ra_number) {
        fields.push({ label: 'Republic Act Number', value: `RA ${subtypeFields.ra_number}` });
      }
      if (entrySubtype === 'commonwealth_act' && subtypeFields.commonwealth_act_number) {
        fields.push({ label: 'Commonwealth Act Number', value: `CA ${subtypeFields.commonwealth_act_number}` });
      }
      if (entrySubtype === 'mga_batas_pambansa' && subtypeFields.mbp_number) {
        fields.push({ label: 'Batas Pambansa Number', value: `BP ${subtypeFields.mbp_number}` });
      }
      if (entrySubtype === 'act' && subtypeFields.act_number) {
        fields.push({ label: 'Act Number', value: `Act ${subtypeFields.act_number}` });
      }
      if (subtypeFields.section_number) {
        fields.push({ label: 'Section Number', value: subtypeFields.section_number });
      }
      
      if (fields.length === 0) return null;
      
      return (
        <div className="field-group">
          <h4 className="field-group-title">Statute Details</h4>
          <div className="field-group-content">
            <div className="info-grid">
              {fields.map((field, index) => (
                <div key={index} className="info-item">
                  <span className="label">{field.label}:</span>
                  <span className="value">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    switch (currentEntry.type) {
      case 'statute_section':
        return (
          <div className="type-specific-fields">
            <div className="info-grid">
              {renderField('Prescriptive Period', pp || 'Empty')}
              {renderField('Standard of Proof', currentEntry.standard_of_proof)}
            </div>
            {renderArrayFieldStructured('elements', currentEntry.elements, 'Elements')}
            {renderArrayFieldStructured('penalties', currentEntry.penalties, 'Penalties')}
            {renderArrayFieldStructured('defenses', currentEntry.defenses, 'Defenses')}
            {renderSubtypeFields(currentEntry.subtype_fields, currentEntry.entry_subtype)}
          </div>
        );

      case 'constitution_provision':
        return (
          <div className="type-specific-fields">
            {/* Constitution-specific: hide statute/process grids; show context fields */}
            {renderArrayFieldStructured('rights_callouts', currentEntry.rights_callouts, 'Rights Callouts')}
            {renderArrayFieldStructured('advice_points', currentEntry.advice_points, 'Advice Points')}
            {renderArrayFieldStructured('jurisprudence', currentEntry.jurisprudence, 'Jurisprudence')}
            {/* Remove Legal Bases outside of Relations; shown below in Relations */}
          </div>
        );

      case 'city_ordinance_section':
        return (
          <div className="type-specific-fields">
            {renderArrayFieldStructured('elements', currentEntry.elements, 'Elements')}
            {renderArrayFieldStructured('penalties', currentEntry.penalties, 'Penalties')}
            {renderArrayFieldStructured('defenses', currentEntry.defenses, 'Defenses')}
          </div>
        );

      case 'rule_of_court':
        return (
          <div className="type-specific-fields">
            <div className="info-grid">
              {renderField('Rule Number', currentEntry.rule_no)}
              {renderField('Section Number', currentEntry.section_no)}
            </div>
            {renderArrayFieldStructured('triggers', currentEntry.triggers, 'Triggers')}
            {renderArrayFieldStructured('time_limits', currentEntry.time_limits, 'Time Limits')}
            {renderArrayFieldStructured('required_forms', currentEntry.required_forms, 'Required Forms')}
          </div>
        );

      case 'agency_circular':
        return (
          <div className="type-specific-fields">
            <div className="info-grid">
              {renderField('Circular Number', currentEntry.circular_no)}
              {renderField('Section Number', currentEntry.section_no)}
            </div>
            {renderArrayFieldStructured('applicability', currentEntry.applicability, 'Applicability')}
            {renderArrayFieldStructured('supersedes', currentEntry.supersedes, 'Supersedes')}
          </div>
        );

      case 'doj_issuance':
        return (
          <div className="type-specific-fields">
            <div className="info-grid">
              {renderField('Issuance Number', currentEntry.issuance_no)}
            </div>
            {renderArrayFieldStructured('applicability', currentEntry.applicability, 'Applicability')}
            {renderArrayFieldStructured('supersedes', currentEntry.supersedes, 'Supersedes')}
          </div>
        );

      case 'executive_issuance':
        return (
          <div className="type-specific-fields">
            <div className="info-grid">
              {renderField('Instrument Number', currentEntry.instrument_no)}
            </div>
            {renderArrayFieldStructured('applicability', currentEntry.applicability, 'Applicability')}
            {renderArrayFieldStructured('supersedes', currentEntry.supersedes, 'Supersedes')}
          </div>
        );

      case 'pnp_sop':
        return (
          <div className="type-specific-fields">
            {renderArrayFieldStructured('steps_brief', currentEntry.steps_brief, 'Steps Brief')}
            {renderArrayFieldStructured('forms_required', currentEntry.forms_required, 'Forms Required')}
            {renderArrayFieldStructured('failure_states', currentEntry.failure_states, 'Failure States')}
          </div>
        );


      case 'incident_checklist':
        return (
          <div className="type-specific-fields">
            <div className="info-grid">
              {renderField('Incident', currentEntry.incident)}
            </div>
            {renderPhasesStructured(currentEntry.phases)}
            {renderArrayFieldStructured('forms', currentEntry.forms, 'Forms')}
            {renderArrayFieldStructured('handoff', currentEntry.handoff, 'Handoff')}
            {renderArrayFieldStructured('rights_callouts', currentEntry.rights_callouts, 'Rights Callouts')}
          </div>
        );

      case 'rights_advisory':
        return (
          <div className="type-specific-fields">
            <div className="info-grid">
              {renderField('Rights Scope', currentEntry.rights_scope)}
            </div>
            {renderArrayFieldStructured('advice_points', currentEntry.advice_points, 'Advice Points')}
          </div>
        );

      case 'constitution_provision':
        return null; // Topics and Jurisprudence are already shown in comprehensive enrichment sections above

      default:
        return (
          <div className="type-specific-fields">
            <div className="info-item">
              <span className="label">Entry Type:</span>
              <span className="value">{currentEntry.type}</span>
            </div>
          </div>
        );
    }
  };

  const getTeamMemberName = (teamMemberId) => {
    if (currentEntry.created_by_name) return currentEntry.created_by_name;
    if (teamMemberNames && teamMemberNames[teamMemberId]) {
      return teamMemberNames[teamMemberId];
    }
    return `Team Member ${teamMemberId || 'Unknown'}`;
  };

  return (
    <div className="entry-view-container">
      <div className="entry-view-content">
        <div className="entry-header">
          <div className="entry-title-section">
            <div className="entry-title-row">
              <h1>{currentEntry.title}</h1>
              <span className="entry-id-badge">{currentEntry.entry_id}</span>
            </div>
            <div className="entry-badges-row">
              <span className="entry-type-badge">{entryType ? entryType.label : currentEntry.type}</span>
              <span className={`status-badge status-${currentEntry.status}`}>
                {currentEntry.status}
              </span>
            </div>
            {currentEntry.offline && currentEntry.offline.pack_include && (
              <div className="offline-pack-indicator">
                Included in Offline Pack
              </div>
            )}
          </div>
          
          <div className="entry-actions">
            <button onClick={onExport} className="btn-icon" title="Export Entry">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7"/>
                <path d="M7 7h10v10"/>
              </svg>
            </button>
            <button onClick={onEdit} className="btn-icon" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onClick={onDelete} className="btn-icon btn-icon-danger" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,6 5,6 21,6"/>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="entry-sections">
          {/* Basic Information */}
          <div className="entry-section">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Visibility:</span>
                <span className="value">GLI & CPA</span>
              </div>
              <div className="info-item">
                <span className="label">Jurisdiction:</span>
                <span className="value">{jurisdiction ? jurisdiction.label : currentEntry.jurisdiction}</span>
              </div>
              <div className="info-item">
                <span className="label">Law Family:</span>
                <span className="value">{currentEntry.law_family ? currentEntry.law_family.charAt(0).toUpperCase() + currentEntry.law_family.slice(1).replace(/_/g, ' ') : 'Not specified'}</span>
              </div>
              {currentEntry.section_id && (
                <div className="info-item">
                  <span className="label">Section ID:</span>
                  <span className="value">{currentEntry.section_id}</span>
                </div>
              )}
              <div className="info-item">
                <span className="label">Canonical Citation:</span>
                <span className="value">{currentEntry.canonical_citation}</span>
              </div>

            </div>
          </div>

          {/* Dates */}
          <div className="entry-section">
            <h3>Dates</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Entry Created:</span>
                <span className="value">{formatDateTime(currentEntry.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="label">Effective Date:</span>
                <span className="value">{formatDate(currentEntry.effective_date)}</span>
              </div>
              {/* Hide verified row here; show status below */}
              {currentEntry.amendment_date && (
                <div className="info-item">
                  <span className="label">Amendment Date:</span>
                  <span className="value">{formatDate(currentEntry.amendment_date)}</span>
                </div>
              )}
              <div className="info-item">
                <span className="label">Last Updated:</span>
                <span className="value">{formatDateTime(currentEntry.updated_at)}</span>
              </div>
            </div>
          </div>


          {/* Source URLs */}
          {currentEntry.source_urls && currentEntry.source_urls.length > 0 && (
            <div className="entry-section">
              <h3>Source URLs</h3>
              <div className="source-urls">
                {currentEntry.source_urls.map((url, index) => {
                  // Clean up URLs by removing "unknown" parts and malformed anchors
                  let cleanUrl = url;
                  if (typeof url === 'string') {
                    // Remove malformed anchors like "#artunknown" or "#ordinance#artunknown"
                    cleanUrl = url.replace(/#artunknown/g, '').replace(/#ordinance#artunknown/g, '#ordinance');
                    // If URL ends with just "#", remove it
                    cleanUrl = cleanUrl.replace(/#$/, '');
                  }
                  return (
                  <a
                    key={index}
                      href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-url"
                  >
                      {cleanUrl}
                  </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {currentEntry.summary && (
            <div className="entry-section">
              <h3>Summary</h3>
              <div className="summary-text">{currentEntry.summary}</div>
            </div>
          )}

          {/* Tags */}
          {currentEntry.tags && currentEntry.tags.length > 0 && (
            <div className="entry-section">
              <h3>Tags</h3>
              <div className="tags-list">
                {currentEntry.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Key Concepts */}
          {currentEntry.key_concepts && currentEntry.key_concepts.length > 0 && (
            <div className="entry-section">
              <h3>Key Concepts</h3>
              <div className="tags-list">
                {currentEntry.key_concepts.map(concept => (
                  <span key={concept} className="tag tag-concept">{concept}</span>
                ))}
              </div>
            </div>
          )}


          {/* Legal Elements */}
          {currentEntry.elements && (
            <div className="entry-section">
              <h3>Legal Elements</h3>
              <div className="text-content">{currentEntry.elements}</div>
            </div>
          )}

          {/* Triggers */}
          {currentEntry.triggers && (
            <div className="entry-section">
              <h3>Triggers</h3>
              <div className="text-content">{currentEntry.triggers}</div>
            </div>
          )}

          {/* Violation Information */}
          {(currentEntry.violation_code || currentEntry.violation_name) && (
            <div className="entry-section">
              <h3>Violation Information</h3>
              <div className="info-grid">
                {currentEntry.violation_code && (
                  <div className="info-item">
                    <span className="label">Violation Code:</span>
                    <span className="value">{currentEntry.violation_code}</span>
                  </div>
                )}
                {currentEntry.violation_name && (
                  <div className="info-item">
                    <span className="label">Violation Name:</span>
                    <span className="value">{currentEntry.violation_name}</span>
                  </div>
                )}
                {currentEntry.fine_schedule && (
                  <div className="info-item">
                    <span className="label">Fine Schedule:</span>
                    <span className="value">{currentEntry.fine_schedule}</span>
                  </div>
                )}
                {currentEntry.license_action && (
                  <div className="info-item">
                    <span className="label">License Action:</span>
                    <span className="value">{currentEntry.license_action}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enforcement Process */}
          {(currentEntry.apprehension_flow || currentEntry.incident) && (
            <div className="entry-section">
              <h3>Enforcement Process</h3>
              <div className="info-grid">
                {currentEntry.apprehension_flow && (
                  <div className="info-item">
                    <span className="label">Apprehension Flow:</span>
                    <span className="value">{currentEntry.apprehension_flow}</span>
                  </div>
                )}
                {currentEntry.incident && (
                  <div className="info-item">
                    <span className="label">Incident Definition:</span>
                    <span className="value">{currentEntry.incident}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Process Information */}
          {(currentEntry.phases || currentEntry.forms || currentEntry.handoff) && (
            <div className="entry-section">
              <h3>Process Information</h3>
              <div className="info-grid">
                {currentEntry.phases && (
                  <div className="info-item">
                    <span className="label">Phases:</span>
                    <span className="value">
                      {(() => {
                        if (typeof currentEntry.phases === 'string') {
                          return currentEntry.phases;
                        } else if (Array.isArray(currentEntry.phases)) {
                          return currentEntry.phases.join(', ');
                        } else if (typeof currentEntry.phases === 'object') {
                          return JSON.stringify(currentEntry.phases).replace(/[{}"]/g, '').replace(/,/g, ', ');
                        }
                        return currentEntry.phases;
                      })()}
                    </span>
                  </div>
                )}
                {currentEntry.forms && (
                  <div className="info-item">
                    <span className="label">Forms:</span>
                    <span className="value">
                      {(() => {
                        if (typeof currentEntry.forms === 'string') {
                          return currentEntry.forms;
                        } else if (Array.isArray(currentEntry.forms)) {
                          return currentEntry.forms.join(', ');
                        } else if (typeof currentEntry.forms === 'object') {
                          return JSON.stringify(currentEntry.forms).replace(/[{}"]/g, '').replace(/,/g, ', ');
                        }
                        return currentEntry.forms;
                      })()}
                    </span>
                  </div>
                )}
                {currentEntry.handoff && (
                  <div className="info-item">
                    <span className="label">Handoff Procedures:</span>
                    <span className="value">
                      {(() => {
                        if (typeof currentEntry.handoff === 'string') {
                          return currentEntry.handoff;
                        } else if (Array.isArray(currentEntry.handoff)) {
                          return currentEntry.handoff.join(', ');
                        } else if (typeof currentEntry.handoff === 'object') {
                          return JSON.stringify(currentEntry.handoff).replace(/[{}"]/g, '').replace(/,/g, ', ');
                        }
                        return currentEntry.handoff;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rights and Protections section removed; content shown within Constitution Provision Details */}

          {/* Legal Context removed for constitution entries - shown in Relations and Constitution Provision Details */}

          {/* Full Text Content */}
          {currentEntry.text && (
            <div className="entry-section">
              <h3>Full Text Content</h3>
              <div className="text-content">{currentEntry.text}</div>
            </div>
          )}

          {/* Type-Specific Information - only show if there's content */}
          {renderTypeSpecificFields() && (
          <div className="entry-section">
            <h3>{entryType ? entryType.label : 'Entry'} Details</h3>
            {renderTypeSpecificFields()}
          </div>
          )}

          {/* Related Laws - show 1–3 items; format: Citation, URL */}
          {(Array.isArray(currentEntry.related_laws) && currentEntry.related_laws.length > 0) ? (
            <div className="entry-section">
              <h3>Related Laws</h3>
              {Array.isArray(currentEntry.related_laws) && currentEntry.related_laws.length > 0 && (
                <div className="field-group">
                  <div className="related-sections-grid">
                    {currentEntry.related_laws.map((rel, idx) => {
                      const asObj = typeof rel === 'object' && rel !== null ? rel : null;
                      const asStr = typeof rel === 'string' ? rel : null;
                      let citation = '', url = '';
                      if (asObj) {
                        citation = asObj.citation || asObj.canonical_citation || '';
                        url = asObj.url || '';
                      } else if (asStr) {
                        // Parse "Citation\nURL" format (citation on first line, URL on second)
                        const lines = asStr.split('\n').map(s => s.trim()).filter(Boolean);
                        citation = lines[0] || '';
                        url = lines[1] || lines[2] || ''; // Allow URL on second or third line
                      }
                      
                      // Validate and sanitize URL - must be a valid, working URL
                      const isValidUrl = (urlStr) => {
                        if (!urlStr || typeof urlStr !== 'string') return false;
                        // Reject localhost, placeholder URLs, or non-URL text
                        if (urlStr.includes('localhost') || urlStr.includes('LawPhil URL') || urlStr.includes('LawPhil%20URL')) return false;
                        // Must start with http:// or https://
                        if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) return false;
                        try {
                          new URL(urlStr); // Validate URL format
                          return true;
                        } catch {
                          return false;
                        }
                      };
                      
                      // If URL is invalid, try to generate a valid LawPhil URL from citation
                      if (!isValidUrl(url) && citation) {
                        // Generate LawPhil URL based on citation pattern
                        if (citation.includes('1987 Constitution') || citation.includes('Constitution')) {
                          url = 'https://lawphil.net/consti/cons1987.html';
                        } else if (citation.includes('Republic Act') || citation.includes('RA ')) {
                          const raMatch = citation.match(/RA\s*(\d+)/i) || citation.match(/Republic\s+Act\s+(\d+)/i);
                          if (raMatch) {
                            url = `https://lawphil.net/statutes/repacts/ra${raMatch[1]}/ra${raMatch[1]}.html`;
                          } else {
                            url = 'https://lawphil.net/statutes/statutes.html';
                          }
                        } else if (citation.includes('Commonwealth Act') || citation.includes('CA ')) {
                          const caMatch = citation.match(/CA\s*(\d+)/i) || citation.match(/Commonwealth\s+Act\s+(\d+)/i);
                          if (caMatch) {
                            url = `https://lawphil.net/statutes/comacts/ca${caMatch[1]}/ca${caMatch[1]}.html`;
                          } else {
                            url = 'https://lawphil.net/statutes/statutes.html';
                          }
                        } else {
                          // Default to LawPhil main page if we can't determine
                          url = 'https://lawphil.net';
                        }
                      } else if (!isValidUrl(url)) {
                        url = ''; // Remove invalid URL
                      }
                      
                      return (
                        <div key={idx} className="legal-basis-card">
                          {citation && <div className="basis-citation"><span className="citation-text text-white">{citation}</span></div>}
                          {url && isValidUrl(url) && (
                            <div className="basis-url">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="url-link text-white">{url}</a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
};

export default EntryView;






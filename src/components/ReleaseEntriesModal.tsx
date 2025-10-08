import React, { useState } from 'react';
import Modal from './Modal/Modal';

interface DraftEntry {
  entry_id: string;
  title: string;
  type: string;
  entry_subtype: string;
  created_at: string;
  provenance: any;
}

interface ReleaseEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftEntries: DraftEntry[];
  onReleaseAll: () => void;
}

export default function ReleaseEntriesModal({ 
  isOpen, 
  onClose, 
  draftEntries, 
  onReleaseAll 
}: ReleaseEntriesModalProps) {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isReleasing, setIsReleasing] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<DraftEntry | null>(null);
  const [entryDetails, setEntryDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSelectAll = () => {
    if (selectedEntries.length === draftEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(draftEntries.map(entry => entry.entry_id));
    }
  };

  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleEntryClick = async (entry: DraftEntry) => {
    setExpandedEntry(entry);
    setLoadingDetails(true);
    setEntryDetails(null);

    try {
      const API = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
      const response = await fetch(`${API}/api/entries/${entry.entry_id}`);
      const data = await response.json();
      
      if (data.success) {
        setEntryDetails(data.entry);
      } else {
        console.error('Failed to fetch entry details:', data.error);
        setEntryDetails(null);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setEntryDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseExpanded = () => {
    setExpandedEntry(null);
    setEntryDetails(null);
  };

  const handleReleaseSelected = () => {
    if (selectedEntries.length === 0) {
      alert('Please select entries to release');
      return;
    }
    setShowConfirm(true);
  };

  const confirmRelease = async () => {
    setIsReleasing(true);
    try {
      const API = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
      const response = await fetch(`${API}/api/scraping/release-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entryIds: selectedEntries })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully released ${data.released_count} entries!`);
        onClose();
        setSelectedEntries([]);
        // Refresh the page to show updated entries
        window.location.reload();
      } else {
        alert('Failed to release entries');
      }
    } catch (error) {
      console.error('Error releasing entries:', error);
      alert('Failed to release entries');
    } finally {
      setIsReleasing(false);
      setShowConfirm(false);
    }
  };

  const handleClose = () => {
    setSelectedEntries([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Release Draft Entries" subtitle="Manage and publish draft entries from scraping">
      <div className="release-modal-content">
        {draftEntries.length === 0 ? (
          <div className="no-entries">
            <p>No draft entries found.</p>
            <p>All entries have been published or no scraping has been done yet.</p>
          </div>
        ) : (
          <>
            <div className="entries-header">
              <h3>
                <span className="entries-title">Draft Entries</span>
                <span className="count-badge">{selectedEntries.length > 0 ? `${selectedEntries.length} selected out of ${draftEntries.length}` : draftEntries.length}</span>
              </h3>
              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedEntries.length === draftEntries.length && draftEntries.length > 0} onChange={handleSelectAll} />
                  <span className={selectedEntries.length === draftEntries.length && draftEntries.length > 0 ? 'label-orange' : ''}>Select All</span>
                </label>
              </div>
            </div>

            <div className="entries-list">
              {draftEntries.map((entry) => (
                <div key={entry.entry_id} className="entry-item no-hover">
                  <div className="entry-checkbox">
                    <input
                      type="checkbox"
                      id={entry.entry_id}
                      checked={selectedEntries.includes(entry.entry_id)}
                      onChange={() => handleSelectEntry(entry.entry_id)}
                    />
                    <label htmlFor={entry.entry_id}></label>
                  </div>
                  <div 
                    className="entry-details"
                  >
                    <div className="entry-title entry-title-orange">{entry.title}</div>
                    <div className="entry-meta">
                      <span className="entry-type orange-chip">{entry.type}</span>
                      <span className="entry-subtype subtype-text lowered">{entry.entry_subtype}</span>
                      <span className="entry-date light-dark lowered">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="entry-id green-text lowered-more">ID: {entry.entry_id}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="btn btn-danger equal"
                onClick={handleClose}
                disabled={isReleasing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-orange equal"
                onClick={handleReleaseSelected}
                disabled={selectedEntries.length === 0 || isReleasing}
              >
                {isReleasing ? 'Releasing...' : `Release Selected (${selectedEntries.length})`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Expanded Entry View Modal */}
      {expandedEntry && (
        <div className="expanded-entry-overlay" onClick={handleCloseExpanded}>
          <div className="expanded-entry-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expanded-entry-header">
              <h3>{expandedEntry.title}</h3>
              <button 
                className="close-btn"
                onClick={handleCloseExpanded}
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div className="expanded-entry-content">
              {loadingDetails ? (
                <div className="loading">Loading entry details...</div>
              ) : entryDetails ? (
                <>
                  <div className="entry-info">
                    <div className="info-row">
                      <strong>Entry ID:</strong> {entryDetails.entry_id}
                    </div>
                    <div className="info-row">
                      <strong>Type:</strong> {entryDetails.type}
                    </div>
                    <div className="info-row">
                      <strong>Subtype:</strong> {entryDetails.entry_subtype}
                    </div>
                    <div className="info-row">
                      <strong>Citation:</strong> {entryDetails.canonical_citation}
                    </div>
                  </div>
                  
                  {/* Summary */}
                  {entryDetails.summary && (
                    <div className="entry-section">
                      <h4>Summary:</h4>
                      <div className="summary-text">{entryDetails.summary}</div>
                    </div>
                  )}

                  {/* Tags */}
                  {entryDetails.tags && entryDetails.tags.length > 0 && (
                    <div className="entry-section">
                      <h4>Tags:</h4>
                      <div className="tags-list">
                        {entryDetails.tags.map((tag: string) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Concepts */}
                  {entryDetails.key_concepts && entryDetails.key_concepts.length > 0 && (
                    <div className="entry-section">
                      <h4>Key Concepts:</h4>
                      <div className="tags-list">
                        {entryDetails.key_concepts.map((concept: string) => (
                          <span key={concept} className="tag tag-concept">{concept}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legal Analysis */}
                  {(entryDetails.applicability || entryDetails.penalties || entryDetails.defenses || entryDetails.time_limits || entryDetails.required_forms) && (
                    <div className="entry-section">
                      <h4>Legal Analysis:</h4>
                      <div className="info-grid">
                        {entryDetails.applicability && (
                          <div className="info-item">
                            <span className="label">Applicability:</span>
                            <span className="value">{entryDetails.applicability}</span>
                          </div>
                        )}
                        {entryDetails.penalties && (
                          <div className="info-item">
                            <span className="label">Penalties:</span>
                            <span className="value">{entryDetails.penalties}</span>
                          </div>
                        )}
                        {entryDetails.defenses && (
                          <div className="info-item">
                            <span className="label">Defenses:</span>
                            <span className="value">{entryDetails.defenses}</span>
                          </div>
                        )}
                        {entryDetails.time_limits && (
                          <div className="info-item">
                            <span className="label">Time Limits:</span>
                            <span className="value">{entryDetails.time_limits}</span>
                          </div>
                        )}
                        {entryDetails.required_forms && (
                          <div className="info-item">
                            <span className="label">Required Forms:</span>
                            <span className="value">{entryDetails.required_forms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legal Elements */}
                  {entryDetails.elements && (
                    <div className="entry-section">
                      <h4>Legal Elements:</h4>
                      <div className="text-content">{entryDetails.elements}</div>
                    </div>
                  )}

                  {/* Triggers */}
                  {entryDetails.triggers && (
                    <div className="entry-section">
                      <h4>Triggers:</h4>
                      <div className="text-content">{entryDetails.triggers}</div>
                    </div>
                  )}

                  {/* Violation Information */}
                  {(entryDetails.violation_code || entryDetails.violation_name || entryDetails.fine_schedule || entryDetails.license_action) && (
                    <div className="entry-section">
                      <h4>Violation Information:</h4>
                      <div className="info-grid">
                        {entryDetails.violation_code && (
                          <div className="info-item">
                            <span className="label">Violation Code:</span>
                            <span className="value">{entryDetails.violation_code}</span>
                          </div>
                        )}
                        {entryDetails.violation_name && (
                          <div className="info-item">
                            <span className="label">Violation Name:</span>
                            <span className="value">{entryDetails.violation_name}</span>
                          </div>
                        )}
                        {entryDetails.fine_schedule && (
                          <div className="info-item">
                            <span className="label">Fine Schedule:</span>
                            <span className="value">{entryDetails.fine_schedule}</span>
                          </div>
                        )}
                        {entryDetails.license_action && (
                          <div className="info-item">
                            <span className="label">License Action:</span>
                            <span className="value">{entryDetails.license_action}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enforcement Process */}
                  {(entryDetails.apprehension_flow || entryDetails.incident) && (
                    <div className="entry-section">
                      <h4>Enforcement Process:</h4>
                      <div className="info-grid">
                        {entryDetails.apprehension_flow && (
                          <div className="info-item">
                            <span className="label">Apprehension Flow:</span>
                            <span className="value">{entryDetails.apprehension_flow}</span>
                          </div>
                        )}
                        {entryDetails.incident && (
                          <div className="info-item">
                            <span className="label">Incident Definition:</span>
                            <span className="value">{entryDetails.incident}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Process Information */}
                  {(entryDetails.phases || entryDetails.forms || entryDetails.handoff) && (
                    <div className="entry-section">
                      <h4>Process Information:</h4>
                      <div className="info-grid">
                        {entryDetails.phases && (
                          <div className="info-item">
                            <span className="label">Phases:</span>
                            <span className="value">{entryDetails.phases}</span>
                          </div>
                        )}
                        {entryDetails.forms && (
                          <div className="info-item">
                            <span className="label">Forms:</span>
                            <span className="value">{entryDetails.forms}</span>
                          </div>
                        )}
                        {entryDetails.handoff && (
                          <div className="info-item">
                            <span className="label">Handoff Procedures:</span>
                            <span className="value">{entryDetails.handoff}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rights and Protections */}
                  {(entryDetails.rights_callouts || entryDetails.rights_scope || entryDetails.advice_points) && (
                    <div className="entry-section">
                      <h4>Rights and Protections:</h4>
                      <div className="info-grid">
                        {entryDetails.rights_callouts && (
                          <div className="info-item">
                            <span className="label">Rights Callouts:</span>
                            <span className="value">{entryDetails.rights_callouts}</span>
                          </div>
                        )}
                        {entryDetails.rights_scope && (
                          <div className="info-item">
                            <span className="label">Rights Scope:</span>
                            <span className="value">{entryDetails.rights_scope}</span>
                          </div>
                        )}
                        {entryDetails.advice_points && (
                          <div className="info-item">
                            <span className="label">Advice Points:</span>
                            <span className="value">{entryDetails.advice_points}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legal Context */}
                  {(entryDetails.jurisprudence || entryDetails.legal_bases) && (
                    <div className="entry-section">
                      <h4>Legal Context:</h4>
                      <div className="info-grid">
                        {entryDetails.jurisprudence && (
                          <div className="info-item">
                            <span className="label">Jurisprudence:</span>
                            <span className="value">{entryDetails.jurisprudence}</span>
                          </div>
                        )}
                        {entryDetails.legal_bases && (
                          <div className="info-item">
                            <span className="label">Legal Bases:</span>
                            <span className="value">{entryDetails.legal_bases}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="entry-text">
                    <h4>Content:</h4>
                    <div className="text-content">
                      {entryDetails.text}
                    </div>
                  </div>
                  
                  {entryDetails.provenance && (
                    <div className="entry-provenance">
                      <h4>Provenance:</h4>
                      <pre className="provenance-content">
                        {JSON.stringify(entryDetails.provenance, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="error">Failed to load entry details</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="expanded-entry-overlay dark-blur" onClick={() => setShowConfirm(false)}>
          <div className="confirm-modal dark-surface" onClick={(e) => e.stopPropagation()}>
            <h3>You are releasing {selectedEntries.length} entries</h3>
            <p style={{marginTop: '0.25rem'}}>Confirming will add all selected entries into the KB.</p>
            <div className="confirm-actions">
              <button className="btn btn-danger" onClick={() => setShowConfirm(false)} disabled={isReleasing}>Go back</button>
              <button className="btn btn-orange" onClick={confirmRelease} disabled={isReleasing}>{isReleasing ? 'Releasing...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .release-modal-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .no-entries {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        .no-entries p {
          margin: 0.5rem 0;
        }

        .entries-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #dee2e6;
        }

        .entries-header h3 { margin: 0; color: #333; }
        .entries-header .entries-title { color: #ffffff; }

        .count-badge {
          background: #111827;
          color: #e5e7eb;
          border: 1px solid #1f2937;
          font-size: 0.85rem;
          padding: 2px 8px;
          border-radius: 999px;
          margin-left: 6px;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .entries-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .entry-item {
          display: flex;
          align-items: flex-start;
          padding: 1rem;
          border-bottom: 1px solid #f8f9fa;
        }

        .entry-item:last-child {
          border-bottom: none;
        }

        .entry-checkbox {
          margin-right: 1rem;
          margin-top: 0.25rem;
        }

        .entry-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .entry-details {
          flex: 1;
        }

        .entry-details { cursor: pointer; }

        .entry-title { font-weight: 600; margin-bottom: 0.5rem; }
        .entry-title-orange { color: #d97706; }

        .entry-meta { display: flex; gap: 1rem; margin-bottom: 0.25rem; font-size: 0.875rem; color: #6c757d; }
        .lowered { position: relative; top: 2px; }
        .lowered-more { position: relative; top: 4px; }

        .entry-type.orange-chip { background: #d97706; color: #ffffff; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 500; }
        .entry-subtype.subtype-text { background: none; color: #b45309; padding: 0; font-weight: 600; }
        .entry-date.light-dark { background: none; color: #6b7280; padding: 0; }
        .green-text { color: #16a34a; }

        .entry-id { font-size: 0.75rem; color: #16a34a; font-family: monospace; background: none; }
        .entry-checkbox input[type="checkbox"]:checked { accent-color: #d97706; }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
        }

        .btn-orange { background-color: #d97706; color: #ffffff; }
        .btn-orange:hover:not(:disabled) { background-color: #b45309; }

        /* Expanded Entry Modal Styles */
        .expanded-entry-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; z-index: 1001; }
        .dark-blur { background-color: rgba(0,0,0,0.55); backdrop-filter: blur(6px); }

        .expanded-entry-modal {
          background: white;
          border-radius: 8px;
          max-width: 90vw;
          max-height: 90vh;
          width: 800px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .confirm-modal { border-radius: 12px; width: 520px; padding: 1.25rem 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .dark-surface { background: #0f172a; color: #e5e7eb; border: 1px solid rgba(148,163,184,0.15); }
        .dark-surface h3 { color: #e5e7eb; margin: 0 0 0.25rem 0; }
        .dark-surface p { color: #cbd5e1; }

        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .expanded-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #dee2e6;
          background-color: #f8f9fa;
          border-radius: 8px 8px 0 0;
        }

        .expanded-entry-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.25rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: #e9ecef;
          color: #495057;
        }

        .expanded-entry-content {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .entry-info {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 6px;
        }

        .info-row {
          margin-bottom: 0.5rem;
          display: flex;
          gap: 0.5rem;
        }

        .info-row strong {
          min-width: 100px;
          color: #495057;
        }

        .entry-text {
          margin-bottom: 1.5rem;
        }

        .entry-text h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .text-content {
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 6px;
          white-space: pre-wrap;
          line-height: 1.6;
          max-height: 300px;
          overflow-y: auto;
        }

        .entry-provenance {
          margin-bottom: 1rem;
        }

        .entry-provenance h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .provenance-content {
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 6px;
          font-size: 0.9rem;
          max-height: 200px;
          overflow-y: auto;
          margin: 0;
        }

        .loading, .error {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        .error {
          color: #dc3545;
        }
      `}</style>
    </Modal>
  );
}

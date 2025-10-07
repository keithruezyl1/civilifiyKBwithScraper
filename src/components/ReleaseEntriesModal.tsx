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

  const handleReleaseSelected = async () => {
    if (selectedEntries.length === 0) {
      alert('Please select entries to release');
      return;
    }

    setIsReleasing(true);
    try {
      const response = await fetch('/api/scraping/release-entries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
              <h3>Draft Entries ({draftEntries.length})</h3>
              <div className="header-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSelectAll}
                >
                  {selectedEntries.length === draftEntries.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onReleaseAll}
                  disabled={isReleasing}
                >
                  Release All
                </button>
              </div>
            </div>

            <div className="entries-list">
              {draftEntries.map((entry) => (
                <div key={entry.entry_id} className="entry-item">
                  <div className="entry-checkbox">
                    <input
                      type="checkbox"
                      id={entry.entry_id}
                      checked={selectedEntries.includes(entry.entry_id)}
                      onChange={() => handleSelectEntry(entry.entry_id)}
                    />
                    <label htmlFor={entry.entry_id}></label>
                  </div>
                  <div className="entry-details">
                    <div className="entry-title">{entry.title}</div>
                    <div className="entry-meta">
                      <span className="entry-type">{entry.type}</span>
                      <span className="entry-subtype">{entry.entry_subtype}</span>
                      <span className="entry-date">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="entry-id">ID: {entry.entry_id}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isReleasing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReleaseSelected}
                disabled={selectedEntries.length === 0 || isReleasing}
              >
                {isReleasing ? 'Releasing...' : `Release Selected (${selectedEntries.length})`}
              </button>
            </div>
          </>
        )}
      </div>

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

        .entries-header h3 {
          margin: 0;
          color: #333;
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

        .entry-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .entry-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .entry-type {
          background-color: #e9ecef;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .entry-subtype {
          background-color: #d1ecf1;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .entry-id {
          font-size: 0.75rem;
          color: #6c757d;
          font-family: monospace;
        }

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
      `}</style>
    </Modal>
  );
}

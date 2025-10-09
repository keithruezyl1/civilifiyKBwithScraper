import React, { useEffect, useState } from 'react';
import Modal from './Modal/Modal';
import { listScrapeBatches, generateEntriesForBatch, deleteScrapeBatch } from '../services/kbApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScrapeBatchesModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ action: 'generate' | 'delete'; id: string; desc?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listScrapeBatches();
      setBatches(Array.isArray(res?.batches) ? res.batches : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const handleGenerate = async (id: string) => {
    setConfirm(null);
    try {
      await generateEntriesForBatch(id);
      alert('Generation started/completed for this batch. Check entries.');
    } catch (e: any) {
      alert(e?.message || 'Failed to generate entries');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirm(null);
    try {
      await deleteScrapeBatch(id);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete batch');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scrape Batches" subtitle="View previously scraped and parsed documents in batches, ready for entry generation">
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div style={{ padding: 16 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {batches.length === 0 ? (
            <div style={{ padding: 16, color: '#9ca3af' }}>No saved batches yet.</div>
          ) : (
            batches.map((b) => (
              <div key={b.id} style={{ border: '1px solid #1f2937', borderRadius: 10, padding: 14, background: '#111827', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#e5e7eb' }}>Batch {b.id}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '52vw' }}>
                      {b.category} • {new Date(b.created_at).toLocaleString()}
                      {b.description ? ` • ${b.description}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Count</div>
                    <div style={{ fontWeight: 700, color: '#e5e7eb' }}>{b.total_documents}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn"
                      style={{ background: '#16a34a', color: '#ffffff', border: 'none', minWidth: '120px', padding: '8px 16px', borderRadius: 6, height: 44 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#15803d'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#16a34a'; }}
                      onClick={() => setConfirm({ action: 'generate', id: b.id })}
                    >
                      Generate Entries
                    </button>
                    <button className="btn btn-danger" style={{ minWidth: '120px', padding: '8px 16px', borderRadius: 6, height: 44 }} onClick={() => setConfirm({ action: 'delete', id: b.id })}>Delete Batch</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {confirm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#111827', border: '1px solid #1f2937', color: '#e5e7eb', borderRadius: 12, padding: 20, width: 360 }}>
            <h3 style={{ marginTop: 0 }}>{confirm.action === 'generate' ? 'Generate Entries?' : 'Delete Batch?'}</h3>
            <p style={{ color: '#9ca3af' }}>
              {confirm.action === 'generate' ? 'This will generate KB entries for this batch.' : 'This will permanently delete the batch and its parsed documents.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              {confirm.action === 'generate' ? (
                <button className="btn btn-success" style={{ background: '#16a34a', color: '#ffffff', border: 'none' }} onClick={() => handleGenerate(confirm.id)}>Confirm</button>
              ) : (
                <button className="btn btn-danger" onClick={() => handleDelete(confirm.id)}>Confirm</button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}



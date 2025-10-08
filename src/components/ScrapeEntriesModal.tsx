import React, { useState, useEffect } from 'react';
import Modal from './Modal/Modal';
import Confetti from './Confetti/Confetti';
const API = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

interface ScrapeEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ScrapingSession {
  id: string;
  status: string;
  total_documents: number;
  parsed_documents: number;
  failed_documents: number;
  created_at: string;
}

interface ScrapingStatus {
  id: string;
  status: string;
  total_documents: number;
  parsed_documents: number;
  failed_documents: number;
  started_at: string;
  finished_at?: string;
}

export default function ScrapeEntriesModal({ isOpen, onClose, onSuccess }: ScrapeEntriesModalProps) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showNotepad, setShowNotepad] = useState(false);
  const [notepadDocs, setNotepadDocs] = useState<Array<{index:number,title?:string,metadata:any,extracted_text:string}>>([]);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [normalizedView, setNormalizedView] = useState(true);
  const [notepadSearchQuery, setNotepadSearchQuery] = useState('');
  const [isClearingData, setIsClearingData] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState({
    total: 0,
    processed: 0,
    created: 0,
    skipped: 0,
    errors: 0
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Utilities for normalization
  const numberToRoman = (num: number) => {
    if (!num || num < 1) return '';
    const map: Array<[number, string]> = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let n = Math.floor(num); let res = '';
    for (const [val, sym] of map) { while (n >= val) { res += sym; n -= val; } }
    return res;
  };

  const normalizeDoc = (d: any): string | null => {
    const md = d?.metadata || {};
    const artNum = parseInt(md.articleNumber, 10);
    const secNum = md.sectionNumber;
    const body = (d?.extracted_text || '').trim();
    
    // Handle preamble case
    if (md.preamble) {
      return `PREAMBLE\n${body}`;
    }
    
    if (!artNum || !secNum || !body) return null;
    
    // Build article title from metadata.title if present
    let articleTitle = '';
    if (typeof md.title === 'string' && md.title) {
      // Extract article title from "Article Title - Section X" format
      const m = md.title.match(/^(.+?)\s*-\s*Section\s+\d+/i);
      if (m && m[1]) {
        articleTitle = m[1].trim();
      }
    }
    
    const roman = numberToRoman(artNum);
    const header = `ARTICLE ${roman}`;
    const subtitle = articleTitle ? `\n${articleTitle.toUpperCase()}` : '';
    
    // Ensure body has a clear Section prefix
    const bodyPrefixed = /^Section\s+/i.test(body) ? body : `Section ${secNum}. ${body}`;
    
    return `${header}${subtitle}\n${bodyPrefixed}`;
  };

  // Search functionality for notepad
  const filterNotepadDocs = (docs: any[], query: string) => {
    if (!query.trim()) return docs;
    
    const searchTerm = query.toLowerCase();
    return docs.filter(doc => {
      const title = (doc.title || '').toLowerCase();
      const text = (doc.extracted_text || '').toLowerCase();
      const metadata = doc.metadata || {};
      const articleNum = metadata.articleNumber?.toString() || '';
      const sectionNum = metadata.sectionNumber?.toString() || '';
      const topics = (metadata.topics || []).join(' ').toLowerCase();
      
      return title.includes(searchTerm) ||
             text.includes(searchTerm) ||
             articleNum.includes(searchTerm) ||
             sectionNum.includes(searchTerm) ||
             topics.includes(searchTerm) ||
             `article ${articleNum}`.includes(searchTerm) ||
             `section ${sectionNum}`.includes(searchTerm);
    });
  };

  // Regenerate entries - delete recently generated entries and restart generation
  const regenerateEntries = async () => {
    if (!sessionId) {
      alert('No active session found');
      return;
    }

    try {
      // Clear recently generated entries
      const clearResponse = await fetch(`${API}/api/scraping/clear-draft-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!clearResponse.ok) {
        throw new Error('Failed to clear draft entries');
      }

      // Reset generation state
      setGenerationResult(null);
      setShowSuccessModal(false);
      
      // Restart generation process
      await generateEntries();
      
    } catch (error) {
      console.error('Failed to regenerate entries:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate entries');
    }
  };

  // Go to dashboard and reset lastScrapeCompleted
  const goToDashboard = () => {
    try {
      localStorage.setItem('lastScrapeCompleted', '0');
    } catch (error) {
      console.warn('Failed to update localStorage:', error);
    }
    setShowSuccessModal(false);
    onSuccess?.();
  };

  // Generate KB entries from scraped documents
  const generateEntries = async () => {
    if (!sessionId) {
      alert('No active session found');
      return;
    }

    setIsGenerating(true);
    setGenerationResult(null);
    setError(null);
    
    // Set initial total from status
    const initialTotal = status?.parsed_documents || 0;
    setGenerationProgress({
      total: initialTotal,
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0
    });

    try {
      const response = await fetch(`${API}/api/scraping/session/${sessionId}/generate-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate entries');
      }

      setGenerationResult(result);
      setGenerationProgress({
        total: result.total_documents || initialTotal,
        processed: result.total_documents || initialTotal,
        created: result.created_count || 0,
        skipped: result.skipped_count || 0,
        errors: result.error_count || 0
      });
      setShowSuccessModal(true);
      console.log('✅ Entry generation completed:', result);
      
    } catch (error) {
      console.error('Failed to generate entries:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate entries');
      alert(`Failed to generate entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear all stored scraped data when modal opens
  const clearAllStoredData = async () => {
    try {
      setIsClearingData(true);
      console.log('🧹 Clearing all stored scraped data...');
      
      // Clear any existing scraping sessions
      const response = await fetch(`${API}/api/scraping/clear-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ All stored scraped data cleared:', result.deleted_counts);
      } else {
        console.warn('⚠️ Failed to clear stored data:', response.statusText);
      }
    } catch (error) {
      console.warn('⚠️ Error clearing stored data:', error);
    } finally {
      setIsClearingData(false);
    }
  };

  // Clear data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Preserve previously scraped/pending data; do not auto-clear
      setNotepadSearchQuery('');
    }
  }, [isOpen]);

  // Handle keyboard shortcuts for notepad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNotepad) {
        if (e.key === 'Escape') {
          setShowNotepad(false);
          setNotepadSearchQuery('');
        } else if (e.key === 'Escape' && notepadSearchQuery) {
          setNotepadSearchQuery('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showNotepad, notepadSearchQuery]);

  // Poll for status updates
  useEffect(() => {
    if (!sessionId || !isScraping) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${API}/api/scraping/session/${sessionId}/status`);
        const data = await response.json();
        
        if (data.success) {
          setStatus(data.status);
          
          // Calculate progress
          if (data.status.total_documents > 0) {
            const progressPercent = (data.status.parsed_documents / data.status.total_documents) * 100;
            setProgress(Math.round(progressPercent));
          }
          
          // Check if completed
          if (data.status.status === 'completed' || data.status.status === 'failed') {
            // Keep modal open on completion/failure; do not flip back to the form
            if (data.status.status === 'completed') {
              onSuccess?.();
              try { localStorage.setItem('lastScrapeCompleted', '1'); } catch {}
              setShowSuccessView(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    };

    const interval = setInterval(pollStatus, 1000); // Poll every second
    return () => clearInterval(interval);
  }, [sessionId, isScraping, onSuccess]);

  // When opening the modal, persist success view unless user cleared entries
  useEffect(() => {
    if (isOpen && !isScraping) {
      try {
        const last = localStorage.getItem('lastScrapeCompleted');
        setShowSuccessView(last === '1');
      } catch {}
    }
  }, [isOpen, isScraping]);

  // When opening in success view, backfill with the latest completed session so counts and URL appear
  useEffect(() => {
    const loadLatest = async () => {
      try {
        const resp = await fetch(`${API}/api/scraping/sessions`);
        const data = await resp.json();
        if (data?.success && Array.isArray(data.sessions) && data.sessions.length > 0) {
          const s = data.sessions[0];
          setSessionId(String(s.id));
          setStatus({
            id: String(s.id),
            status: s.status || 'completed',
            total_documents: Number(s.total_documents || 0),
            parsed_documents: Number(s.parsed_documents || 0),
            failed_documents: Number(s.failed_documents || 0),
            started_at: s.started_at,
            finished_at: s.finished_at
          });
          if (s.root_url) setUrl(s.root_url);
        }
      } catch (e) {
        // no-op
      }
    };

    if (isOpen && showSuccessView && !sessionId) {
      loadLatest();
    }
  }, [isOpen, showSuccessView, sessionId]);

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsScraping(true);
    setError(null);
    setProgress(0);
    setStatus(null);

    try {
      // Start scraping session
      const startResponse = await fetch(`${API}/api/scraping/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          category: 'constitution_1987',
          operator: 'user'
        }),
      });

      if (!startResponse.ok) {
        const txt = await startResponse.text();
        throw new Error(txt || 'Failed to start scraping session');
      }
      const startData = await startResponse.json();
      
      if (!startData.success) {
        throw new Error(startData.error || 'Failed to start scraping session');
      }

      setSessionId(startData.sessionId);

      // Process the URL
      const processResponse = await fetch(`${API}/api/scraping/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: startData.sessionId,
          url: url.trim(),
          parserType: 'constitution_1987'
        }),
      });

      if (!processResponse.ok) {
        const err = await processResponse.json().catch(async () => ({ error: await processResponse.text() }));
        throw new Error(err?.error || 'Failed to process URL');
      }
      const processData = await processResponse.json();
      if (!processData?.success) {
        throw new Error(processData?.error || 'Failed to process URL');
      }

      // Complete the session
      await fetch(`${API}/api/scraping/session/${startData.sessionId}/complete`, {
        method: 'POST',
      });

    } catch (err) {
      console.error('Scraping failed:', err);
      setError(err instanceof Error ? err.message : 'Scraping failed');
      setIsScraping(false);
      setStatus({ id: sessionId || 'n/a', status: 'failed', total_documents: 0, parsed_documents: 0, failed_documents: 1, started_at: new Date().toISOString() });
    }
  };

  const handleClose = () => {
    // Always allow closing; reset local state
    setUrl('');
    setError(null);
    setStatus(null);
    setProgress(0);
    setSessionId(null);
    onClose();
  };

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showNotepad) { setShowNotepad(false); return; }
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, showNotepad]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#007bff';
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      case 'paused': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Scraping in progress...';
      case 'completed': return 'Scraping completed!';
      case 'failed': return 'Scraping failed';
      case 'paused': return 'Scraping paused';
      default: return 'Unknown status';
    }
  };

  // Trigger a short confetti burst when generation finishes successfully
  useEffect(() => {
    if (status?.status === 'completed' && !isGenerating && (generationResult?.created_count || 0) > 0) {
      setShowConfetti(true);
    }
  }, [status?.status, isGenerating, generationResult?.created_count]);

  // After a successful scrape, when success modal is closed, clear the flag in localStorage
  useEffect(() => {
    if (!showSuccessModal && generationResult) {
      try { localStorage.removeItem('lastScrapeCompleted'); } catch {}
    }
  }, [showSuccessModal, generationResult]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scrape Entries" subtitle="Extract and parse legal documents from LawPhil">
      <div className="scrape-modal-content" style={{ overflow: 'hidden' }}>
        {isClearingData && (
          <div className="alert alert-info">
            <div className="spinner"></div>
            Clearing all stored scraped data for fresh start...
          </div>
        )}
        {!isScraping && !showSuccessView ? (
          <div className="scrape-form">
            <div className="form-group">
              <label htmlFor="url">Enter LawPhil URL:</label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://lawphil.net/consti/cons1987.html"
                className="form-control"
                disabled={isScraping || isClearingData}
              />
              <small className="form-text">
                Paste the URL of the legal document you want to scrape and parse.
              </small>
            </div>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <div className="modal-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-cancel"
                style={{ marginTop: -16 }}
                onClick={handleClose}
                disabled={isScraping}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-orange"
                style={{ marginTop: 0 }}
                onClick={handleScrape}
                disabled={!url.trim() || isScraping || isClearingData}
              >
                {isClearingData ? 'Clearing Data...' : isScraping ? 'Scraping...' : 'Start Scraping'}
              </button>
            </div>
          </div>
        ) : (
          <div className="scraping-progress">
            {status?.status === 'failed' && (
              <div className="progress-header">
                <h3>Scraping Failed</h3>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor('failed') }}
                >
                  {getStatusText('failed')}
                </div>
              </div>
            )}

            <div className="progress-section">
              {status?.status === 'running' ? (
                <div className="spinner-wrapper">
                  <div className="spinner" />
                  <div className="spinner-text">Scraping in progress...</div>
                  <div className="progress-stats">
                    <div className="stat">
                      <span className="stat-label">Total Documents:</span>
                      <span className="stat-value warning">{status?.total_documents ?? 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Parsed:</span>
                      <span className="stat-value success">{status?.parsed_documents ?? 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Failed:</span>
                      <span className="stat-value error">{status?.failed_documents ?? 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="progress-stats">
                    <div className="stat">
                      <span className="stat-label">Total Documents:</span>
                      <span className="stat-value warning">{status?.total_documents ?? 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Parsed:</span>
                      <span className="stat-value success">{status?.parsed_documents ?? 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Failed:</span>
                      <span className="stat-value error">{status?.failed_documents ?? 0}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="scraping-details">
              <p><strong>URL:</strong> {url}</p>
              <p><strong>Session ID:</strong> {sessionId}</p>
              {status?.started_at && (
                <p><strong>Started:</strong> {new Date(status.started_at).toLocaleString()}</p>
              )}
            </div>

            {/* Generation Status: simplified */}
            {isGenerating && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <div className="wave-text" aria-live="polite" aria-busy="true">
                  {['G','e','n','e','r','a','t','i','n','g',' ','e','n','t','r','i','e','s','.','.','.'].map((ch, idx) => (
                    <span key={idx}>{ch}</span>
                  ))}
                </div>
              </div>
            )}

            {status?.status === 'completed' && !isGenerating && (
              <div className="completion-message">
                <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
                <div style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #0ea5e9 100%)',
                  color: 'white',
                  borderRadius: 12,
                  padding: '18px 16px',
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.35)'
                }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Scraping Completed</div>
                  <div style={{ opacity: 0.95 }}>Processed {status.parsed_documents} of {status.total_documents} documents{status.failed_documents > 0 ? ` • ${status.failed_documents} failed` : ''}.</div>
                </div>

                {generationResult && (
                  <div style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
                    gap: 12
                  }}>
                    <div style={{
                      background: '#052e16',
                      border: '1px solid #064e3b',
                      color: '#bbf7d0',
                      borderRadius: 10,
                      padding: 12,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Entries Created</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{generationResult.created_count}</div>
                    </div>
                    <div style={{
                      background: '#111827',
                      border: '1px solid #374151',
                      color: '#fde68a',
                      borderRadius: 10,
                      padding: 12,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Skipped</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{generationResult.skipped_count}</div>
                    </div>
                    <div style={{
                      background: '#180d0f',
                      border: '1px solid #7f1d1d',
                      color: '#fca5a5',
                      borderRadius: 10,
                      padding: 12,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Errors</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{generationResult.error_count}</div>
                    </div>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: 0, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'nowrap' }}>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={async () => {
                      try {
                        if (!sessionId) return;
                        const resp = await fetch(`${API}/api/scraping/session/${sessionId}/documents`);
                        const data = await resp.json();
                        const docs = Array.isArray(data?.documents) ? data.documents : [];
                        let mapped = docs.map((d:any, i:number) => {
                          let text = d?.extracted_text || '';
                          if (normalizedView) {
                            const norm = normalizeDoc(d);
                            if (!norm) return null;
                            text = norm;
                          }
                          return ({ index: i, title: d?.metadata?.title || `Article ${d?.metadata?.articleNumber} - Section ${d?.metadata?.sectionNumber}`, metadata: d?.metadata, extracted_text: text });
                        }).filter(Boolean) as Array<{index:number,title?:string,metadata:any,extracted_text:string}>;
                        setNotepadDocs(mapped);
                        setShowNotepad(true);
                      } catch (e) {
                        alert('Failed to load scraped documents.');
                      }
                    }}
                  >
                    View Scraped Entries
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={isGenerating || !sessionId}
                    onClick={generateEntries}
                  >
                    {isGenerating ? 'Generating Entries…' : 'Generate Entries'}
                  </button>
                  {/* Go to Dashboard button removed per request */}
                  <button
                    type="button"
                    className="btn btn-orange"
                    onClick={() => setShowSuccessView(false)}
                  >
                    Run Another Scrape
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={async () => {
                      try {
                        const r = await fetch(`${API}/api/scraping/clear-scraped-data`, { method: 'POST' });
                        const d = await r.json();
                        alert(`Cleared ${d.deleted_count || 0} scraped documents and sessions. Generated KB entries were preserved.`);
                        setUrl('');
                        setStatus(null);
                        setProgress(0);
                        setSessionId(null);
                        setIsScraping(false);
                        setGenerationResult(null);
                        setShowSuccessModal(false);
                        setShowSuccessView(false);
                      } catch (e) {
                        alert('Failed to clear scraped data.');
                      }
                    }}
                  >
                    Clear Scraped Data
                  </button>
                </div>
              </div>
            )}

            {status?.status === 'failed' && (
              <div className="error-message">
                <div className="alert alert-danger">
                  <h4>Scraping Failed</h4>
                  <p>There was an error during the scraping process. Please try again.</p>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsScraping(false);
                      setStatus(null);
                      setProgress(0);
                      setSessionId(null);
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNotepad && (
        <div className="notepad-overlay" onClick={() => setShowNotepad(false)}>
          <div className="notepad-window" onClick={(e) => e.stopPropagation()}>
            <div className="notepad-header">
              <div className="notepad-title">Scraped Documents {normalizedView ? '(Normalized Per Entry)' : '(Parsed Per Entry)'} — press Esc to close</div>
              <div className="notepad-controls">
                <div className="notepad-search">
                  <input
                    type="text"
                    placeholder="Search by title, article, section, or content..."
                    value={notepadSearchQuery}
                    onChange={(e) => setNotepadSearchQuery(e.target.value)}
                    className="notepad-search-input"
                  />
                </div>
                <div className="notepad-toggle">
                  <label><input type="checkbox" checked={normalizedView} onChange={(e)=>setNormalizedView(e.target.checked)} /> Normalized</label>
                </div>
              </div>
            </div>
            <div className="notepad-body">
              {notepadDocs.length === 0 ? (
                <pre className="notepad-pre">No documents to display.</pre>
              ) : (() => {
                const filteredDocs = filterNotepadDocs(notepadDocs, notepadSearchQuery);
                return filteredDocs.length === 0 ? (
                  <pre className="notepad-pre">No documents match your search.</pre>
                ) : (
                  <>
                    {notepadSearchQuery && (
                      <div className="notepad-search-results">
                        Showing {filteredDocs.length} of {notepadDocs.length} documents
                      </div>
                    )}
                    {filteredDocs.map(d => {
                      const displayText = normalizedView ? (normalizeDoc(d) || d.extracted_text) : d.extracted_text;
                      return (
                        <div key={d.index} className="notepad-doc">
                          <div className="notepad-doc-title">{d.title || `Document ${d.index+1}`}</div>
                          <pre className="notepad-pre">{displayText}</pre>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrape-modal-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: white;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-text {
          display: block;
          margin-top: 0.25rem;
          color: #d1d5db;
          font-size: 0.875rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .alert-success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .alert-info {
          background-color: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #0c5460;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: nowrap; /* force one row */
          margin-top: 2rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px; /* keep text on one line without wrap */
          line-height: 1;  /* avoid multi-line height growth */
          cursor: pointer;
          transition: all 0.2s;
          min-width: 180px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          white-space: nowrap; /* single-line labels */
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
          transform: translateY(-1px);
        }

        .btn-secondary {
          background-color: #dc3545;
          color: white;
        }
        .btn-success {
          background-color: #16a34a; /* green */
          color: #ffffff;
        }

        .btn-success:hover:not(:disabled) {
          background-color: #15803d;
          transform: translateY(-1px);
        }

        .btn-warning {
          background-color: #f59e0b; /* amber */
          color: #ffffff; /* white text requested */
        }

        .btn-warning:hover:not(:disabled) {
          background-color: #d97706;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .btn-danger {
          background-color: #b91c1c;
          color: #ffffff;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #991b1b;
          transform: translateY(-1px);
        }

        .btn-outline-danger {
          background-color: transparent;
          color: #b91c1c;
          border: 2px solid #b91c1c;
        }

        .btn-outline-danger:hover:not(:disabled) {
          background-color: #b91c1c;
          color: #ffffff;
          transform: translateY(-1px);
        }


        .btn-secondary:hover:not(:disabled) {
          background-color: #c82333;
          transform: translateY(7px);
        }

        .btn-cancel {
          transform: translateY(8px);
        }

        .scraping-progress {
          text-align: center;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .progress-header h3 {
          margin: 0;
          color: #333;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .progress-section {
          margin-bottom: 2rem;
        }

        .spinner-wrapper { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 0.5rem; 
        }

        .spinner { 
          width: 36px; 
          height: 36px; 
          border: 4px solid #e5e7eb; 
          border-top-color: #f59e0b; /* orange */
          border-radius: 50%; 
          animation: spin 1s linear infinite; 
        }

        .spinner-text { 
          color: #22c55e; /* green */
          font-weight: 600; 
        }

        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }

        .progress-bar-container {
          margin-bottom: 1rem;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background-color: #007bff;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-weight: 600;
          color: #333;
        }

        .progress-stats {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }


        .stat-label {
          display: block;
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
        }

        .modal-content .progress-stats .stat {
          text-align: center;
          min-width: 120px;
          background: none !important;
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
        }

        /* Override any inherited styles */
        .modal-content .progress-stats .stat * {
          background: none !important;
          background-color: transparent !important;
          border: none !important;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .modal-content .progress-stats .stat-value.warning {
          color: #f59e0b !important; /* yellow text */
        }

        .modal-content .progress-stats .stat-value.success {
          color: #22c55e !important; /* green text */
        }

        .modal-content .progress-stats .stat-value.error {
          color: #ef4444 !important; /* red text */
        }

        .scraping-details {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          text-align: left;
        }

        .scraping-details p {
          margin: 0.5rem 0;
          font-size: 0.875rem;
        }

        /* Dark mode overrides */
        :root.dark-mode .scrape-modal-content .scraping-details {
          background-color: #111827; /* slate-900 */
          border: 1px solid #1f2937; /* slate-800 */
          color: #d1d5db; /* slate-300 */
        }
        :root.dark-mode .scrape-modal-content .scraping-details p {
          color: #d1d5db;
        }

        .completion-message,
        .error-message {
          margin-top: 2rem;
        }

        .completion-message h4,
        .error-message h4 {
          margin-top: 0;
        }

        /* Notepad overlay */
        .notepad-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .notepad-window { 
          width: 80vw; 
          max-width: 900px; 
          max-height: 80vh; 
          background: #111827; 
          color: #e5e7eb; 
          border: 1px solid #374151; 
          border-radius: 8px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.4); 
          display: flex; 
          flex-direction: column; 
        }
        .notepad-header { 
          padding: 0.75rem 1rem; 
          background: #1f2937; 
          border-bottom: 1px solid #374151; 
        }
        .notepad-title { 
          font-weight: 700; 
          margin-bottom: 0.5rem; 
          font-size: 0.9rem;
        }
        .notepad-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .notepad-search {
          flex: 1;
        }
        .notepad-search-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #374151;
          border-radius: 4px;
          font-size: 0.8rem;
          background: #111827;
          color: #f9fafb;
        }
        .notepad-search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
        }
        .notepad-search-input::placeholder {
          color: #6b7280;
        }
        .notepad-toggle { font-weight: 400; font-size: 0.9rem; }
        .notepad-toggle input { margin-right: 0.5rem; }
        .notepad-search-results {
          padding: 0.5rem 1rem;
          background: #374151;
          border-bottom: 1px solid #4b5563;
          font-size: 0.8rem;
          color: #9ca3af;
          font-style: italic;
        }
        .notepad-body { 
          padding: 1rem; 
          overflow: auto; 
        }
        .notepad-doc { 
          margin-bottom: 1rem; 
          border-bottom: 1px dashed #374151; 
          padding-bottom: 1rem; 
        }
        .notepad-doc-title { 
          font-weight: 700; 
          margin-bottom: 0.5rem; 
        }
        .notepad-pre { 
          white-space: pre-wrap; 
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; 
          background: #0b1220; 
          border: 1px solid #1f2937; 
          border-radius: 6px; 
          padding: 0.75rem; 
          color: #d1d5db; 
        }
        
        /* Generation Progress Styles */
        .generating-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .progress-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #666;
        }
        
        .progress-stats span {
          padding: 0.2rem 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        /* Success Modal Styles */
        .success-modal {
          max-width: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .success-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        /* Custom button colors */
        .btn { margin-top: 32px; }
        .btn.btn-warning { background: #f59e0b; border-color: #f59e0b; color: #ffffff; }
        .btn.btn-warning:hover { background: #d97706; border-color: #d97706; color: #111827; }
        .btn.btn-orange { background: #c2410c; border-color: #c2410c; color: #ffffff; }
        .btn.btn-orange:hover { background: #9a3412; border-color: #9a3412; color: #ffffff; }

        /* Animated wave text for generating indicator */
        .wave-text {
          font-weight: 700;
          font-size: 1.25rem;
          color: #22c55e; /* green */
          display: inline-block;
          letter-spacing: 1px;
        }
        .wave-text span {
          display: inline-block;
          animation: wave 1.2s ease-in-out infinite;
        }
        .wave-text span:nth-child(2) { animation-delay: 0.1s; }
        .wave-text span:nth-child(3) { animation-delay: 0.2s; }
        .wave-text span:nth-child(4) { animation-delay: 0.3s; }
        .wave-text span:nth-child(5) { animation-delay: 0.4s; }
        .wave-text span:nth-child(6) { animation-delay: 0.5s; }
        .wave-text span:nth-child(7) { animation-delay: 0.6s; }
        .wave-text span:nth-child(8) { animation-delay: 0.7s; }
        .wave-text span:nth-child(9) { animation-delay: 0.8s; }
        .wave-text span:nth-child(10) { animation-delay: 0.9s; }
        .wave-text span:nth-child(11) { animation-delay: 1.0s; }
        .wave-text span:nth-child(12) { animation-delay: 1.1s; }
        .wave-text span:nth-child(13) { animation-delay: 1.2s; }
        @keyframes wave {
          0%, 100% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
        }
        
        .stat-item.success {
          background: #d4edda;
          border-color: #c3e6cb;
        }
        
        .stat-item.warning {
          background: #fff3cd;
          border-color: #ffeaa7;
        }
        
        .stat-item.error {
          background: #f8d7da;
          border-color: #f5c6cb;
        }
        
        .stat-label {
          font-weight: 500;
          color: #495057;
        }
        
        .stat-value {
          font-weight: 700;
          font-size: 1.1rem;
        }
        
        .stat-item.success .stat-value {
          color: #155724;
        }
        
        .stat-item.warning .stat-value {
          color: #856404;
        }
        
        .stat-item.error .stat-value {
          color: #721c24;
        }
        
        .success-message {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .success-message p {
          margin-bottom: 0.5rem;
          color: #495057;
        }
        
        .success-message strong {
          color: #28a745;
        }
      `}</style>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()} style={{ overflow: 'visible' }}>
            <div className="modal-header" style={{ marginBottom: 12 }}>
              <h3>✅ Entry Generation Complete!</h3>
            </div>
            
            <div className="modal-body">
              <div className="success-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Documents:</span>
                  <span className="stat-value" style={{ color: '#6b7280' }}>{generationProgress.total}</span>
                </div>
                <div className="stat-item success">
                  <span className="stat-label">Entries Created:</span>
                  <span className="stat-value">{generationProgress.created}</span>
                </div>
                <div className="stat-item warning">
                  <span className="stat-label">Skipped:</span>
                  <span className="stat-value">{generationProgress.skipped}</span>
                </div>
                <div className="stat-item error">
                  <span className="stat-label">Errors:</span>
                  <span className="stat-value">{generationProgress.errors}</span>
                </div>
              </div>
              
              <div className="success-message">
                <p>🎉 Successfully generated <strong>{generationProgress.created}</strong> KB entries with comprehensive GPT enrichment and vector embeddings!</p>
                <p>You can now view these entries in the dashboard and release them when ready.</p>
              </div>
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn-orange"
                style={{ flex: 1, minWidth: 0 }}
                onClick={goToDashboard}
              >
                View Entries in Dashboard
              </button>
              <button 
                className="btn btn-success"
                style={{ flex: 1, minWidth: 0 }}
                onClick={regenerateEntries}
              >
                Regenerate Entries
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

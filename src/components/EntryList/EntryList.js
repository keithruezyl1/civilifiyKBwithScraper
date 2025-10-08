import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { fetchEntryById, serverSearch } from '../../services/kbApi';
import { getEntryTypeOptions } from '../../data/entryTypes';
import { getJurisdictionOptions } from '../../data/jurisdictions';
import EntryView from '../EntryView/EntryView';
import { PageNavigator } from '../ui/PageNavigator';
// import { getAllTags } from '../../data/tags';
import './EntryList.css';

// Entry subtypes mapping based on the database schema
const ENTRY_SUBTYPES = {
  constitution_provision: [
    { value: 'constitution_1987', label: '1987 Constitution' },
    { value: 'constitution_1986', label: '1986 Constitution' },
    { value: 'constitution_1973', label: '1973 Constitution' },
    { value: 'constitution_1935', label: '1935 Constitution' },
    { value: 'constitution_malolos', label: 'Malolos Constitution' }
  ],
  statute_section: [
    { value: 'republic_act', label: 'Republic Act' },
    { value: 'commonwealth_act', label: 'Commonwealth Act' },
    { value: 'mga_batas_pambansa', label: 'Mga Batas Pambansa' },
    { value: 'act', label: 'Act' }
  ],
  rule_of_court_provision: [
    { value: 'roc_criminal_proc_1985', label: 'Criminal Procedure 1985' },
    { value: 'roc_civil_proc', label: 'Civil Procedure' },
    { value: 'roc_evidence_2019', label: 'Evidence 2019' },
    { value: 'roc_special_proceedings', label: 'Special Proceedings' },
    { value: 'roc_other', label: 'Other Rules' }
  ]
};

// Function to get subtypes for a given entry type
const getSubtypesForType = (entryType) => {
  return ENTRY_SUBTYPES[entryType] || [];
};

const EntryList = ({ entries, onViewEntry, onEditEntry, onDeleteEntry, onExportEntry, searchEntries, teamMemberNames = {} }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryStack, setEntryStack] = useState([]); // stack of previously opened entries
  // Listen for requests to open an entry detail (from EntryView link clicks)
  useEffect(() => {
    const handler = async (e) => {
      const entry = e?.detail?.entry;
      const entryId = e?.detail?.entryId;
      let target = entry || null;
      if (!target && entryId) {
        try {
          const fetched = await fetchEntryById(entryId);
          if (fetched) target = { ...fetched, id: fetched.entry_id };
        } catch {}
      }
      if (target) {
        // Push current entry to stack if we are navigating from an open entry
        setEntryStack((prev) => (selectedEntry ? [...prev, selectedEntry] : prev));
        setSelectedEntry(target);
        // Ensure overlay scrolls to top after switching entries
        setTimeout(() => {
          try {
            const overlay = document.querySelector('.entry-detail-overlay .entry-view-container');
            if (overlay) overlay.scrollTop = 0;
          } catch {}
        }, 0);
      }
    };
    window.addEventListener('open-entry-detail', handler);
    return () => window.removeEventListener('open-entry-detail', handler);
  }, [selectedEntry]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedEntry) {
        if (entryStack.length > 0) {
          const prev = entryStack[entryStack.length - 1];
          setEntryStack(entryStack.slice(0, -1));
          setSelectedEntry(prev);
        } else {
          setSelectedEntry(null);
        }
      }
    };
    
    if (selectedEntry) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedEntry, entryStack]);

  // Handle browser back button to close modal
  useEffect(() => {
    const handlePopState = (e) => {
      if (selectedEntry) {
        e.preventDefault();
        if (entryStack.length > 0) {
          const prev = entryStack[entryStack.length - 1];
          setEntryStack(entryStack.slice(0, -1));
          setSelectedEntry(prev);
        } else {
          setSelectedEntry(null);
        }
        // Push a new state to prevent the browser from actually going back
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (selectedEntry) {
      // Push a state when modal opens to enable back button handling
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [selectedEntry, entryStack]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Feature flag for server lexical search
  const useServerSearch = String(process.env.REACT_APP_USE_SERVER_SEARCH || '').toLowerCase() === 'true';
  const [remoteResults, setRemoteResults] = useState([]);
  const [didYouMean, setDidYouMean] = useState(null);

  const renderHighlighted = useCallback((html, fallback) => {
    if (!useServerSearch) return fallback;
    if (!html || typeof html !== 'string') return fallback;
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html.replaceAll('<b>', '<b style="background:#fff3cd;color:#92400e;border-radius:4px;padding:0 2px;">') }}
      />
    );
  }, [useServerSearch]);
  const [showFilters, setShowFilters] = useState(false);
  const [customJurisdiction, setCustomJurisdiction] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    subtype: 'all',
    jurisdiction: 'all',
    status: 'all',
    verified: 'all',
    team_member_id: 'all'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Increased from 10 to 20 for better performance

  // Debounce search query to improve performance
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  const entryTypeOptions = getEntryTypeOptions();
  const jurisdictionOptions = getJurisdictionOptions();
  // const allTags = getAllTags();

  const filteredEntriesLocal = useMemo(() => {
    const filtered = searchEntries(debouncedSearchQuery, filters);
    return filtered;
  }, [debouncedSearchQuery, filters, searchEntries, teamMemberNames]);

  // Fetch server search results (debounced) when flag is on
  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!useServerSearch) return;
      const q = String(debouncedSearchQuery || '').trim();
      // For empty query, fall back to local list (no server call) to avoid flicker
      if (!q) {
        if (alive) setRemoteResults(filteredEntriesLocal);
        return;
      }
      try {
        setIsSearching(true);
        const res = await serverSearch({
          query: q,
          type: filters?.type && filters.type !== 'all' ? filters.type : undefined,
          jurisdiction: filters?.jurisdiction && filters.jurisdiction !== 'all' ? filters.jurisdiction : undefined,
          status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
          verified: filters?.verified && filters.verified !== 'all' ? (filters.verified === 'yes' ? 'yes' : 'not_verified') : undefined,
          team_member_id: filters?.team_member_id && filters.team_member_id !== 'all' ? String(filters.team_member_id) : undefined,
          limit: 50,
          explain: true,
        });
        if (!alive) return;
        // Server returns a projection; normalize id field
        const rows = Array.isArray(res.results) ? res.results.map(r => ({ ...r, id: r.entry_id || r.id })) : [];
        setRemoteResults(rows);
        setDidYouMean(res.suggestion || null);
        // keep current page stable unless it exceeds new total
      } catch (e) {
        if (alive) {
          console.warn('Server search failed; using local fallback', e);
          setRemoteResults(filteredEntriesLocal);
          setDidYouMean(null);
        }
      } finally {
        if (alive) setIsSearching(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [useServerSearch, debouncedSearchQuery, filters, filteredEntriesLocal]);

  // Persist current filters and search so Export can follow them
  useEffect(() => {
    try {
      localStorage.setItem('entry_filter_snapshot', JSON.stringify(filters || {}));
      localStorage.setItem('entry_search_query', String(debouncedSearchQuery || ''));
    } catch (e) {
      // non-fatal
    }
  }, [filters, debouncedSearchQuery]);

  // Calculate pagination with memoization
  const effectiveEntries = useServerSearch ? remoteResults : filteredEntriesLocal;

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(effectiveEntries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEntries = effectiveEntries.slice(startIndex, endIndex);
    
    return { totalPages, startIndex, endIndex, paginatedEntries };
  }, [effectiveEntries, currentPage, itemsPerPage]);
  
  const { totalPages, paginatedEntries } = paginationData;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filters, useServerSearch]);

  // Ensure current page is valid when total pages change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleFilterChange = (filterName, value) => {
    if (filterName === 'jurisdiction') {
      if (value === 'other') {
        setFilters(prev => ({ ...prev, jurisdiction: customJurisdiction }));
      } else {
        setFilters(prev => ({ ...prev, jurisdiction: value }));
        setCustomJurisdiction('');
      }
    } else if (filterName === 'type') {
      // When entry type changes, reset subtype to 'all'
      setFilters(prev => ({ ...prev, type: value, subtype: 'all' }));
    } else {
      setFilters(prev => ({ ...prev, [filterName]: value }));
    }
  };

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      subtype: 'all',
      jurisdiction: 'all',
      status: 'all',
      verified: 'all',
      team_member_id: 'all'
    });
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCustomJurisdiction('');
  }, []);

  const getEntryTypeLabel = (type) => {
    const option = entryTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  const getJurisdictionLabel = (jurisdiction) => {
    const option = jurisdictionOptions.find(opt => opt.value === jurisdiction);
    return option ? option.label : jurisdiction;
  };

  const getTeamMemberName = (teamMemberId) => {
    if (!teamMemberId) return 'Unassigned';
    if (!teamMemberNames || Object.keys(teamMemberNames).length === 0) return 'Unknown';
    return teamMemberNames[teamMemberId] || `Team Member ${teamMemberId}`;
  };

  // Determine if there are any exact matches for the current query
  const normalize = useCallback((text) => String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim(), []);
  
  const searchTerm = normalize(debouncedSearchQuery);
  const hasExactMatch = useMemo(() => {
    if (!searchTerm) return true;
    const source = useServerSearch ? effectiveEntries : entries;
    return source.some(e => {
      const haystacks = [
        e.title,
        e.entry_id,
        e.canonical_citation,
        e.section_id,
        e.law_family,
        Array.isArray(e.tags) ? e.tags.join(' ') : '',
        // Also consider exact matches where the user types "Title — Citation"
        (e.title && e.canonical_citation) ? `${e.title} ${e.canonical_citation}` : '',
        // And the reverse order just in case
        (e.title && e.canonical_citation) ? `${e.canonical_citation} ${e.title}` : ''
      ];
      return haystacks.some(h => normalize(h) === searchTerm);
    });
  }, [searchTerm, entries, effectiveEntries, normalize, useServerSearch]);

  return (
    <div className="entry-list-container">
      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search entries by title, ID, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                title="Clear"
              >
                ×
              </button>
            )}
            {isSearching && (
              <div className="search-loading-indicator">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          {useServerSearch && didYouMean && (
            <div style={{ marginTop: 6 }}>
              <span style={{ color: '#6b7280' }}>Did you mean:&nbsp;</span>
              <button
                type="button"
                onClick={() => setSearchQuery(didYouMean)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#2563eb',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontWeight: 600
                }}
              >{didYouMean}</button>
            </div>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="toggle-filters-btn"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <>
            <div className="filter-row">
              <div className="filter-group">
                <label>Entry Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  {entryTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {filters.type !== 'all' && getSubtypesForType(filters.type).length > 0 && (
                <div className="filter-group">
                  <label>Sub Entry Type</label>
                  <select
                    value={filters.subtype}
                    onChange={(e) => handleFilterChange('subtype', e.target.value)}
                  >
                    <option value="all">All Subtypes</option>
                    {getSubtypesForType(filters.type).map(subtype => (
                      <option key={subtype.value} value={subtype.value}>
                        {subtype.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label>Jurisdiction</label>
                <select
                  value={filters.jurisdiction === 'all' ? 'all' : (filters.jurisdiction === customJurisdiction ? 'other' : filters.jurisdiction)}
                  onChange={(e) => handleFilterChange('jurisdiction', e.target.value)}
                >
                  <option value="all">All Jurisdictions</option>
                  <option value="PH">PH Philippines (PH)</option>
                  <option value="other">Other…</option>
                </select>
                {filters.jurisdiction === customJurisdiction && (
                  <input
                    type="text"
                    placeholder="e.g., Cavite, Quezon City, Baguio"
                    value={customJurisdiction}
                    onChange={(e) => {
                      setCustomJurisdiction(e.target.value);
                      setFilters(prev => ({ ...prev, jurisdiction: e.target.value }));
                    }}
                    className="custom-jurisdiction-input"
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                )}
              </div>

              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="released">Released</option>
                  <option value="unreleased">Unreleased</option>
                </select>
              </div>


              <div className="filter-group">
                <button onClick={clearFilters} className="btn-secondary btn-sm">
                  Clear Filters
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        {debouncedSearchQuery && !hasExactMatch ? (
          <>
            <p style={{ marginBottom: '4px' }}>No exact matches for "{debouncedSearchQuery}"</p>
            <p>
              Showing {effectiveEntries.length} of {entries.length} entries that might be a match
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
          </>
        ) : (
          <p>
            Showing {effectiveEntries.length} of {entries.length} entries
            {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
        )}
      </div>

      {/* Entries List */}
      {effectiveEntries.length === 0 ? (
        <div className="no-results">
          <h3>No entries found.</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <>
          <div className="entry-list">
            {paginatedEntries.map(entry => (
            <div key={entry.id} className="entry-card">
              {/* Mobile badges - positioned absolutely */}
              <div className="entry-badges-mobile">
                <span className="entry-type-badge">{getEntryTypeLabel(entry.type)}</span>
              </div>
              <div className="entry-content">
                <div className="entry-main">
                  <div className="entry-title-row">
                    <h3 className="entry-title" onClick={async () => {
                      setEntryStack([]);
                      try {
                        if (useServerSearch && entry && entry.entry_id) {
                          const full = await fetchEntryById(entry.entry_id);
                          if (full) {
                            setSelectedEntry({ ...full, id: full.entry_id });
                            return;
                          }
                        }
                      } catch {}
                      setSelectedEntry(entry);
                    }}>
                      {useServerSearch && entry.hl_title ? renderHighlighted(entry.hl_title, entry.title || 'Untitled Entry') : (entry.title || 'Untitled Entry')}
                    </h3>
                    <div className="entry-badges">
                      <span className="entry-type-badge">{getEntryTypeLabel(entry.type)}</span>
                      {entry.status && (
                        <span className={`status-badge status-${entry.status}`}>
                          {entry.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="entry-subtitle-row">
                      <div className="entry-subtitle">
                        civilify.local/{entry.type ? getEntryTypeLabel(entry.type).toLowerCase().replace(/\s+/g,'-') : 'unknown'}/{entry.entry_id || 'no-id'}
                        {useServerSearch && (entry.hl_citation || entry.hl_summary) && (
                          <>
                            <span style={{ margin: '0 6px', color: '#9ca3af' }}>|</span>
                            <span style={{ color: '#6b7280' }}>
                              {entry.hl_citation ? renderHighlighted(entry.hl_citation, entry.canonical_citation) : null}
                              {!entry.hl_citation && entry.hl_summary ? renderHighlighted(entry.hl_summary, '') : null}
                            </span>
                          </>
                        )}
                      </div>
                      {useServerSearch && Array.isArray(entry.matched_fields) && entry.matched_fields.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
                          matched: {entry.matched_fields.join(', ')}
                        </div>
                      )}
                      
                      {entry.team_member_id && (
                        <div className="entry-team-member">
                          Team: {getTeamMemberName(entry.team_member_id)}
                        </div>
                      )}
                      
                      {entry.tags && entry.tags.length > 0 && (
                      <div className="entry-tags-text">
                        {entry.tags.slice(0, 3).join(', ')}
                        {entry.tags.length > 3 && ` + ${entry.tags.length - 3} more`}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="entry-actions">
                  <button
                    onClick={() => onEditEntry(entry.id)}
                    className="btn-icon"
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="btn-icon btn-icon-danger"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
          
          {/* Page Navigator */}
          {totalPages > 1 && (
            <PageNavigator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={effectiveEntries.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}
      
      {/* Entry Detail View */}
      {selectedEntry && (
        <div 
          className="entry-detail-overlay"
          onClick={(e) => {
            // Close modal when clicking on the overlay (not the content)
            if (e.target === e.currentTarget) {
              if (entryStack.length > 0) {
                const prev = entryStack[entryStack.length - 1];
                setEntryStack(entryStack.slice(0, -1));
                setSelectedEntry(prev);
              } else {
                setSelectedEntry(null);
              }
            }
          }}
        >
          <EntryView
            entry={selectedEntry}
            onEdit={() => onEditEntry(selectedEntry.id)}
            onDelete={() => {
              onDeleteEntry(selectedEntry.id);
              setSelectedEntry(null);
            }}
            onExport={() => onExportEntry(selectedEntry)}
            teamMemberNames={teamMemberNames}
          />
        </div>
      )}
    </div>
  );
};

export default EntryList;

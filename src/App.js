import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import EntryForm from './components/kb/EntryForm.tsx'; // new TS + RHF + Zod wizard
import EntryList from './components/EntryList/EntryList';
import DashboardNotifications from './components/DashboardNotifications';
import EntryView from './components/EntryView/EntryView';
// Login component removed - no authentication required
import Confetti from './components/Confetti/Confetti';
import Modal from './components/Modal/Modal';
import LoadingModal from './components/Modal/LoadingModal';
import { ImportJsonModal } from './components/ImportJsonModal';
import ScrapeEntriesModal from './components/ScrapeEntriesModal';
import ReleaseEntriesModal from './components/ReleaseEntriesModal';
import { loadPlanFromJson, computeDayIndex, rowsForDay, getPlanDate, toISODate } from './lib/plan/planLoader';
import { format } from 'date-fns';
import { setDay1Date } from './lib/plan/progressStore';
import { upsertEntry, deleteEntryVector, clearEntriesVector } from './services/vectorApi';
// import { fetchAllEntriesFromDb } from './services/kbApi';
import { fetchEntryById } from './services/kbApi';
// Plans API removed: we now load from bundled JSON
import ChatModal from './components/kb/ChatModal';
import { AuthProvider } from './contexts/AuthContext';
// Authentication removed - no login required, but EntryView still needs AuthProvider
const API = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

function HeaderNotificationsButton() {
  // Replace with a round refresh button that forces a DB refetch
  const handleRefresh = () => {
    try {
      localStorage.removeItem('law_entries');
      sessionStorage.clear();
    } catch {}
    // Notify listeners to refresh from DB immediately
    try { window.dispatchEvent(new Event('force-refresh-entries')); } catch {}
  };
  return (
    <button
      aria-label="Refresh from DB"
      className="icon-btn"
      onClick={handleRefresh}
      title="Refresh from DB"
      style={{ borderRadius: '9999px' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 13.65-6.65z"/>
      </svg>
    </button>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/law-entry/:step" element={<LawEntryForm />} />
          <Route path="/entry/:entryId" element={<EntryDetails />} />
          <Route path="/entry/:entryId/edit" element={<EntryEdit />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Authentication components removed - no login required

// Dashboard Component - Main list view
function Dashboard() {
  return <AppContent currentView="list" />;
}

// Law Entry Form Component
function LawEntryForm() {
  const { step } = useParams();
  return <AppContent currentView="form" formStep={parseInt(step) || 1} />;
}

// Entry Details Component
function EntryDetails() {
  const { entryId } = useParams();
  return <AppContent currentView="view" selectedEntryId={entryId} />;
}

// Entry Edit Component
function EntryEdit() {
  const { entryId } = useParams();
  return <AppContent currentView="form" isEditing={true} selectedEntryId={entryId} />;
}

function AppContent({ currentView: initialView = 'list', isEditing = false, formStep = 1, selectedEntryId: initialEntryId = null, importedData = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mock user object for compatibility
  const user = { id: 1, name: 'User', personId: 'P1' };
  
  const [currentView] = useState(initialView);
  const [selectedEntryId, setSelectedEntryId] = useState(initialEntryId);
  const [editingEntry, setEditingEntry] = useState(null);
  
  // Track which entries are currently being saved to prevent duplicates
  const savingEntries = useRef(new Set());
  
  // Check for imported data in sessionStorage
  const [importedEntryData, setImportedEntryData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('importedEntryData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Ensure imported data is maintained during navigation
  useEffect(() => {
    if (currentView === 'form' && !importedEntryData) {
      try {
        const stored = sessionStorage.getItem('importedEntryData');
        if (stored) {
          const parsed = JSON.parse(stored);
          setImportedEntryData(parsed);
          console.log('Restored imported data from sessionStorage:', parsed);
        }
      } catch (e) {
        console.error('Failed to restore imported data:', e);
      }
    }
  }, [currentView, importedEntryData]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearModalStep, setClearModalStep] = useState(1);
  const [clearOption, setClearOption] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeDraft, setResumeDraft] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [incompleteEntries, setIncompleteEntries] = useState([]);
  const [yesterdayMode, setYesterdayMode] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const [planData, setPlanData] = useState(null);
  const [day1Date, setDay1DateState] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  // Logout modal state removed - no authentication required
  const [showIncompleteEntriesModal, setShowIncompleteEntriesModal] = useState(false);
  const [pendingEntryForModal, setPendingEntryForModal] = useState(null);
  const [showImportSuccessModal, setShowImportSuccessModal] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showImportLoadingModal, setShowImportLoadingModal] = useState(false);
  const [showImportJsonModal, setShowImportJsonModal] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [draftEntries, setDraftEntries] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEntrySavedModal, setShowEntrySavedModal] = useState(false);
  const [showEntryLoadingModal, setShowEntryLoadingModal] = useState(false);
  const [savedEntryTitle, setSavedEntryTitle] = useState('');
  const [isUpdatingEntry, setIsUpdatingEntry] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [isResumingYes, setIsResumingYes] = useState(false);
  const [isResumingNo, setIsResumingNo] = useState(false);
  // Logout state removed - no authentication required
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('app_theme');
      return saved === 'dark';
    } catch (_) { return false; }
  });

  // Clear drafts when returning to dashboard (no toast popup)
  useEffect(() => {
    try {
      const flag = sessionStorage.getItem('entryCreated');
      if (flag && location.pathname === '/dashboard') {
        // Clear any remaining drafts when returning to dashboard
        try {
          localStorage.removeItem('kb_entry_draft');
          localStorage.removeItem('kb_draft');
          localStorage.removeItem('kb_drafts');
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('kb_entry_') || 
                key.startsWith('entry_draft_') || 
                key.startsWith('kb_draft') ||
                key.includes('draft') ||
                key.includes('autosave')) {
              localStorage.removeItem(key);
            }
          });
          console.log('Draft clearing on dashboard return');
        } catch (e) {
          console.warn('Failed to clear drafts on dashboard return:', e);
        }
        
        sessionStorage.removeItem('entryCreated');
      }
    } catch {}
  }, [location.pathname]);

  // Load plan from bundled JSON on mount
  useEffect(() => {
    const init = async () => {
      try {
        setPlanLoading(true);
        const rows = await loadPlanFromJson('/Civilify_KB30_Schedule_CorePH.json');
        setPlanData(rows);
        // Day 1 fixed to 2025-09-04
        const day1 = '2025-09-04';
        setDay1Date(day1);
        setDay1DateState(day1);
        try { window.__KB_PLAN__ = rows; window.__KB_DAY1__ = day1; } catch (_) {}
      } catch (err) {
        console.error('Failed to load plan JSON:', err);
        setPlanData([]);
        setDay1DateState('2025-09-04');
        try { window.__KB_PLAN__ = []; window.__KB_DAY1__ = '2025-09-04'; } catch (_) {}
      } finally {
        setPlanLoading(false);
      }
    };
    init();
  }, []);

  // Live clock (updates every second)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
    try { localStorage.setItem('app_theme', isDarkMode ? 'dark' : 'light'); } catch (_) {}
  }, [isDarkMode]);

  // Note: Removed force dark mode for P5/Tagarao - users can now choose their preferred theme

  // React to verification refresh or progress changes (trigger re-render)
  useEffect(() => {
    const forceRerender = () => setHeaderOpacity((v) => v);
    window.addEventListener('refresh-entries', forceRerender);
    window.addEventListener('refresh-progress', forceRerender);
    return () => {
      window.removeEventListener('refresh-entries', forceRerender);
      window.removeEventListener('refresh-progress', forceRerender);
    };
  }, []);

  const planRows = (() => {
    if (Array.isArray(planData)) return planData;
    if (planData && Array.isArray(planData.rows)) return planData.rows;
    if (planData && Array.isArray(planData.data)) return planData.data;
    return [];
  })();

  // Get entries from useLocalStorage hook
  const { entries, loading, error, clearError, addEntry, updateEntry, deleteEntry, getEntryById, getEntryByEntryId, searchEntries, exportEntries, exportSingleEntry, importEntries, clearAllEntries, getStorageStats, getAllTeamProgress, getYesterdayTeamProgress, updateProgressForEntry, checkDailyCompletion } = useLocalStorage();

  // Function to check incomplete entries from yesterday
  const checkIncompleteEntries = useCallback(() => {
    if (!planRows || !day1Date) return;
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDayIndex = computeDayIndex(yesterday, day1Date);
    const yesterdayRows = rowsForDay(planRows, yesterdayDayIndex);
    
    const incomplete = [];
    const teamMemberNames = { 1: 'Arda', 2: 'Delos Cientos', 3: 'Paden', 4: 'Sendrijas', 5: 'Tagarao' };
    
    yesterdayRows.forEach(row => {
      const personId = parseInt(row.Person.replace('P', ''));
      const personName = teamMemberNames[personId];
      if (!personName) return;
      
      // Get yesterday's entries for this person
      const yesterdayISO = toISODate(getPlanDate(yesterday));
      const personEntries = entries.filter(entry => 
        entry.created_by === personId && 
        toISODate(getPlanDate(new Date(entry.created_at))) === yesterdayISO
      );
      
      // Count entries by type
      const doneByType = {};
      personEntries.forEach(entry => {
        doneByType[entry.type] = (doneByType[entry.type] || 0) + 1;
      });
      
      // Check if any quota is incomplete
      const totalReq = row.Total || 0;
      const totalDone = Object.values(doneByType).reduce((sum, count) => sum + count, 0);
      
      if (totalDone < totalReq) {
        const incompleteEntry = {
          personId,
          personName,
          totalDone,
          totalReq,
          quotas: {
            constitution_provision: row.constitution_provision || 0,
            statute_section: row.statute_section || 0,
            rule_of_court: row.rule_of_court || 0,
            agency_circular: row.agency_circular || 0,
            doj_issuance: row.doj_issuance || 0,
            executive_issuance: row.executive_issuance || 0,
            rights_advisory: row.rights_advisory || 0,
            city_ordinance_section: row.city_ordinance_section || 0
          },
          doneByType
        };
        incomplete.push(incompleteEntry);
      }
    });
    
    setIncompleteEntries(incomplete);
    
    // Store in sessionStorage for use in EntryForm
    try {
      sessionStorage.setItem('incompleteEntries', JSON.stringify(incomplete));
    } catch (e) {
      console.error('Failed to store incomplete entries in sessionStorage:', e);
    }
  }, [planRows, day1Date, entries]);

  // Check incomplete entries when data changes
  useEffect(() => {
    checkIncompleteEntries();
  }, [checkIncompleteEntries]);

  const hasPlan = true; // Always treat plan as present since it's bundled

  // Guard: prevent opening the form route when plan failed to load
  useEffect(() => {
    if (currentView !== 'form') return;
    // Wait until plan loading completes to avoid false negatives on first mount
    if (planLoading) return;
    // no-op; plan is always bundled
  }, [currentView, hasPlan, navigate, planLoading]);
  
  

  // Redirect to login if on root path (this is now handled by the router)
  // The login component will handle redirecting to dashboard after authentication
  
  // const {
  //   entries,
  //   loading,
  //   error,
  //   addEntry,
  //   updateEntry,
  //   deleteEntry,
  //   getEntryById,
  //   searchEntries,
  //   exportEntries,
  //   importEntries,
  //   clearAllEntries,
  //   getStorageStats,
  //   getAllTeamProgress,
  //   getYesterdayTeamProgress,
  //   checkDailyCompletion
  // } = useLocalStorage();

  // Handle initial entry loading for view/edit
  useEffect(() => {
    const ensureEntryLoaded = async () => {
      if (!initialEntryId || !(currentView === 'view' || isEditing) || loading) return;

      let entry = getEntryById(initialEntryId);
      console.log('Found entry:', entry);

      // Fallback: fetch from DB if not present in memory yet
      if (!entry && !importedEntryData) {
        try {
          console.log('Entry not found in memory, fetching from DB by id:', initialEntryId);
          const fetched = await fetchEntryById(initialEntryId);
          if (fetched) {
            entry = { ...fetched, id: fetched.entry_id };
            console.log('Fetched entry from DB:', entry);
          }
        } catch (e) {
          console.warn('Failed to fetch entry by id:', e);
        }
      }

      if (entry) {
        if (isEditing) {
          console.log('Setting editing entry:', entry);
          setEditingEntry(entry);
        }
        setSelectedEntryId(initialEntryId);
        return;
      }

      if (importedEntryData) {
        console.log('No existing entry found, but imported data available for new entry creation');
        setSelectedEntryId(null);
        return;
      }

      console.log('Entry not found and no imported data, redirecting to dashboard');
      navigate('/dashboard');
    };

    ensureEntryLoaded();
  }, [initialEntryId, currentView, isEditing, getEntryById, navigate, entries, loading, importedEntryData]);

  const stats = getStorageStats();
  const teamProgress = getAllTeamProgress();
  const yesterdayProgress = getYesterdayTeamProgress();
  
  // Use database team members instead of hardcoded data
  const [dbTeamMembers, setDbTeamMembers] = useState([]);
  
  // Fetch team members from database
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const ORIGIN_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
        const API_BASE = ORIGIN_BASE.endsWith('/api') ? ORIGIN_BASE : `${ORIGIN_BASE}/api`;
        const response = await fetch(`${API_BASE}/auth/team-members`);
        
        if (response.ok) {
          const data = await response.json();
          setDbTeamMembers(data.team_members);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        // Fallback to hardcoded data if API fails
        setDbTeamMembers([
          { id: 1, name: 'Arda', person_id: 'P1' },
          { id: 2, name: 'Delos Cientos', person_id: 'P2' },
          { id: 3, name: 'Paden', person_id: 'P3' },
          { id: 4, name: 'Sendrijas', person_id: 'P4' },
          { id: 5, name: 'Tagarao', person_id: 'P5' }
        ]);
      }
    };
    
    fetchTeamMembers();
  }, []);

  // Allow ScrapeEntriesModal to open ReleaseEntriesModal after success
  useEffect(() => {
    const openRelease = () => setShowReleaseModal(true);
    window.addEventListener('open-release-entries-modal', openRelease);
    return () => window.removeEventListener('open-release-entries-modal', openRelease);
  }, []);


  // Team member names from database - use the same data as dbTeamMembers
  const teamMemberNames = useMemo(() => {
    const names = {};
    dbTeamMembers.forEach(member => {
      names[member.id] = member.name;
    });
    return names;
  }, [dbTeamMembers]);

  // Handle scroll for header background opacity
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const opacity = scrollTop > 0 ? 0.7 : 1;
      setHeaderOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check yesterday's completion status with carryover logic
  // const getYesterdayStatus = () => {
  //   const incompleteMembers = [];
  //   let allCompleted = true;
  //   let someCompleted = false;
    
  //   for (let i = 1; i <= 5; i++) {
  //     const yesterdayTotal = yesterdayProgress[i]?.total || 0;
  //     const todayTotal = teamProgress[i]?.total || 0;
      
  //     // Calculate total progress including today's carryover
  //     const totalProgress = yesterdayTotal + todayTotal;
      
  //     if (totalProgress < 10) {
  //       allCompleted = false;
  //       const memberName = dbTeamMembers.find(m => m.id === i)?.name || `P${i}`;
  //       incompleteMembers.push(memberName);
  //     } else {
  //       someCompleted = true;
  //     }
  //   }
    
  //   if (allCompleted) {
  //     return { 
  //       text: "ALL COMPLETED", 
  //       completed: true, 
  //       status: 'completed' // green
  //     };
  //   } else if (someCompleted) {
  //     return { 
  //       text: `INCOMPLETE ENTRIES: ${incompleteMembers.join(', ')}`, 
  //       completed: false, 
  //       status: 'partial' // orange
  //     };
  //   } else {
  //     return { 
  //       text: `INCOMPLETE ENTRIES: ${incompleteMembers.join(', ')}`, 
  //       completed: false, 
  //       status: 'incomplete' // red
  //     };
  //   }
  // };

  const handleCreateNew = async () => {
    if (!hasPlan) return alert('Plan not loaded.');
    
    setIsCreatingEntry(true);
    try {
      // Check if current user has incomplete entries from yesterday
      const currentUserIncomplete = incompleteEntries.find(incomplete => 
        incomplete.personName === user?.name
      );
      
      // Always navigate to form - modal will be shown during form submission if needed
      setYesterdayMode(false);
      sessionStorage.removeItem('yesterdayMode');
      sessionStorage.removeItem('yesterdayQuotas');
      
      // Check if we just created an entry - if so, clear all drafts and start fresh
      const justCreated = sessionStorage.getItem('entryJustCreated');
      if (justCreated === '1') {
        // Clear all draft data immediately
        try {
          localStorage.removeItem('kb_entry_draft');
          localStorage.removeItem('kb_draft');
          localStorage.removeItem('kb_drafts');
          // Clear any other draft-related keys
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('kb_entry_') || 
                key.startsWith('entry_draft_') || 
                key.startsWith('kb_draft') ||
                key.includes('draft') ||
                key.includes('autosave')) {
              localStorage.removeItem(key);
            }
          });
          console.log('Cleared all drafts after successful entry creation');
        } catch (e) {
          console.warn('Failed to clear drafts:', e);
        }
        // Don't clear the flag here - let the form loading logic handle it
        setEditingEntry(null);
        sessionStorage.setItem('cameFromDashboard', 'true');
        navigate('/law-entry/1');
        return;
      }
    
      try {
        const raw = localStorage.getItem('kb_entry_draft');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              // Always ask user whether to resume or start new when a draft exists
              setResumeDraft(parsed);
              setShowResumeModal(true);
              return;
            }
          } catch (_) {
            // ignore parse errors and proceed to fresh form
          }
        }
      } catch (_) {}
      setEditingEntry(null);
      // Set session storage to indicate user came from dashboard
      sessionStorage.setItem('cameFromDashboard', 'true');
      navigate('/law-entry/1');
    } finally {
      setIsCreatingEntry(false);
    }
  };

  const handleResumeYes = async () => {
    setIsResumingYes(true);
    try {
      setEditingEntry(resumeDraft || null);
      setShowResumeModal(false);
      // Set session storage to indicate user came from dashboard
      sessionStorage.setItem('cameFromDashboard', 'true');
      navigate('/law-entry/1');
    } finally {
      setIsResumingYes(false);
    }
  };

  const handleResumeNo = async () => {
    setIsResumingNo(true);
    try {
      // Clear all draft data comprehensively
      try {
        localStorage.removeItem('kb_entry_draft');
        localStorage.removeItem('kb_draft');
        localStorage.removeItem('kb_drafts');
        // Clear any other draft-related keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('kb_entry_') || 
              key.startsWith('entry_draft_') || 
              key.startsWith('kb_draft') ||
              key.includes('draft') ||
              key.includes('autosave')) {
            localStorage.removeItem(key);
          }
        });
        console.log('🧹 Cleared all drafts when starting new entry');
      } catch (e) {
        console.warn('Failed to clear drafts:', e);
      }
      
      // Set flag to ensure form doesn't load any drafts
      sessionStorage.setItem('entryJustCreated', '1');
      console.log('🧹 Set entryJustCreated flag to prevent draft loading');
      setResumeDraft(null);
      setShowResumeModal(false);
      setEditingEntry(null);
      // Set session storage to indicate user came from dashboard
      sessionStorage.setItem('cameFromDashboard', 'true');
      console.log('🧹 Navigating to clean form after clearing drafts');
      navigate('/law-entry/1');
    } finally {
      setIsResumingNo(false);
    }
  };

  const handleEditEntry = (entryId) => {
    console.log('handleEditEntry called with entryId:', entryId);
    console.log('Entry type:', typeof entryId);
    
    // Find the entry to edit
    const entryToEdit = entries.find(entry => entry.id === entryId || entry.entry_id === entryId);
    if (entryToEdit) {
      setEditingEntry(entryToEdit);
      // Set session storage to indicate user came from dashboard
      sessionStorage.setItem('cameFromDashboard', 'true');
      // Route to dedicated edit URL so edit mode is activated and drafts do not load
      navigate(`/entry/${entryId}/edit?step=1`);
    } else {
      console.error('Entry not found for editing:', entryId);
      alert('Entry not found for editing');
    }
  };

  const handleViewEntry = (entryId) => {
    navigate(`/entry/${entryId}`);
  };

  const handleSaveEntry = async (entryData) => {
    console.log('🎯 HANDLE SAVE ENTRY CALLED');
    console.log('📝 Entry data:', entryData);
    console.log('🔍 Editing entry:', editingEntry);
    console.log('🆔 Entry ID:', entryData.entry_id);
    
    // Prevent multiple submissions for the same entry
    const entryId = entryData.entry_id;
    if (savingEntries.current.has(entryId)) {
      console.log('Entry already being saved, ignoring duplicate submission:', entryId);
      return;
    }
    
    savingEntries.current.add(entryId);
    try {
      // Check if we're in yesterday mode OR if user has incomplete entries
      const isYesterdayMode = sessionStorage.getItem('yesterdayMode') === 'true';
      const incompleteEntries = JSON.parse(sessionStorage.getItem('incompleteEntries') || '[]');
      const userHasIncompleteEntries = incompleteEntries.some((entry) => 
        entry.personId === user?.personId || 
        entry.personName === user?.name
      );
      
      if (isYesterdayMode || userHasIncompleteEntries) {
        // Set created_at to yesterday's date for yesterday mode entries or incomplete entries
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        entryData.created_at = yesterday.toISOString();
        console.log('Yesterday mode or incomplete entries: Setting created_at to', entryData.created_at);
      }
      
      // Treat as update if we have an editing entry in state OR we're on the edit route with a selectedEntryId
      const effectiveEditId = (editingEntry && editingEntry.id) || selectedEntryId || null;
      if (effectiveEditId) {
        console.log('🔄 UPDATE FLOW STARTED');
        console.log('📝 Editing entry ID:', effectiveEditId);
        console.log('📊 Update data:', entryData);
        
        // Show loading state for update
        setIsUpdatingEntry(true);
        
        try {
          await updateEntry(effectiveEditId, entryData);
          console.log('✅ Entry updated successfully:', entryData);
          
          // Clear editing state after successful update
          setEditingEntry(null);
          
          // Clear imported data if this was an imported entry being updated
          setImportedEntryData(null);
          sessionStorage.removeItem('importedEntryData');
          sessionStorage.removeItem('cameFromDashboard');
          
          // Show success modal and redirect to dashboard
          setSavedEntryTitle(entryData.title);
          setShowEntrySavedModal(true);
          
          // Note: Vector embeddings are automatically updated by the backend PUT endpoint
          // No need for additional upsertEntry call which was causing duplication
        } finally {
          // Hide loading state
          setIsUpdatingEntry(false);
        }
      } else {
        // Check if this entry will complete a daily quota
        if (entryData.team_member_id && entryData.type) {
          const willComplete = checkDailyCompletion(entryData.team_member_id, entryData.type);
          if (willComplete) {
            setShowConfetti(true);
          }
        }
        const newEntry = await addEntry(entryData);
        
        // Clear any previous errors when entry is successfully created
        clearError();
        
        // Set session flag for success toast on dashboard (instead of showing modal)
        try { sessionStorage.setItem('entryCreated', '1'); } catch {}
        
        // Clear ALL localStorage drafts/autosaves for create entry
        try {
          // Clear specific known draft keys
          localStorage.removeItem('kb_entry_draft');
          localStorage.removeItem('kb_draft');
          localStorage.removeItem('kb_drafts');
          
          // Clear any other draft-related keys with comprehensive patterns
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('kb_entry_') || 
                key.startsWith('entry_draft_') || 
                key.startsWith('kb_draft') ||
                key.includes('draft') ||
                key.includes('autosave')) {
              localStorage.removeItem(key);
            }
          });
          
        // Set a flag to indicate successful entry creation
        sessionStorage.setItem('entryJustCreated', '1');
        console.log('🎉 Entry created successfully, set entryJustCreated flag');
          
          console.log('Cleared all entry drafts and autosaves from localStorage');
        } catch (e) {
          console.warn('Failed to clear localStorage drafts:', e);
        }
        // Vector indexing is already handled by addEntry() above
        // Show loading modal first, then success modal after 2 seconds
        setSavedEntryTitle(entryData.title);
        setShowEntryLoadingModal(true);
        setImportedEntryData(null); // Clear imported data after successful save
        sessionStorage.removeItem('importedEntryData'); // Clear from sessionStorage
        sessionStorage.removeItem('cameFromDashboard'); // Clear dashboard access flag
        
        // After 2 seconds, hide loading modal and show success modal
        setTimeout(() => {
          setShowEntryLoadingModal(false);
          setShowEntrySavedModal(true);
        }, 2000);
      }
      try { localStorage.removeItem('kb_entry_draft'); } catch (_) {}
      setEditingEntry(null);
    } catch (err) {
      console.error('Error saving entry:', err);
      // Hide loading modal if it was shown
      setShowEntryLoadingModal(false);
      const msg = (err && err.message) ? String(err.message) : 'Please try again.';
      alert(`Failed to save entry: ${msg}`);
    } finally {
      // Always remove the entry from the saving set
      savingEntries.current.delete(entryId);
    }
  };

  const handleDeleteEntry = (entryId) => {
    const entry = entries.find(e => e.id === entryId);
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    
    setIsDeletingEntry(true);
    try {
      // 1) Gather inbound references (entries that cite this entry internally)
      const inbound = entries.filter(e => {
        const lb = Array.isArray(e.legal_bases) ? e.legal_bases : [];
        const rs = Array.isArray(e.related_sections) ? e.related_sections : [];
        const citesInLB = lb.some((x) => x && (x.entry_id === entryToDelete.entry_id || x.entry_id === entryToDelete.id));
        const citesInRS = rs.some((x) => x && (x.entry_id === entryToDelete.entry_id || x.entry_id === entryToDelete.id));
        return citesInLB || citesInRS;
      });

      // 2) If there are inbound references, warn the user with a detailed prompt
      if (inbound.length > 0) {
        const list = inbound.map(e => `• ${e.title} (${e.entry_id || e.id})`).join('\n');
        const confirmed = window.confirm(
          `This entry is cited internally by ${inbound.length} other entries.\n\n${list}\n\nProceed with deletion? Those references will be removed automatically.`
        );
        if (!confirmed) {
          return;
        }
      }

      // 3) Delete the target entry
      await deleteEntry(entryToDelete.id);

      // 4) Auto-remove dangling internal references from inbound entries
      for (const e of inbound) {
        const lb = Array.isArray(e.legal_bases) ? e.legal_bases : [];
        const rs = Array.isArray(e.related_sections) ? e.related_sections : [];
        const filteredLB = lb.filter((x) => x && (x.entry_id !== entryToDelete.entry_id && x.entry_id !== entryToDelete.id));
        const filteredRS = rs.filter((x) => x && (x.entry_id !== entryToDelete.entry_id && x.entry_id !== entryToDelete.id));
        if (filteredLB.length !== lb.length || filteredRS.length !== rs.length) {
          try {
            await updateEntry(e.id, { legal_bases: filteredLB, related_sections: filteredRS });
          } catch (err) {
            console.warn('Failed to clean references for', e.id, err);
          }
        }
      }

      if (currentView === 'view' && selectedEntryId === entryToDelete.id) {
        navigate('/dashboard');
        setSelectedEntryId(null);
      }
      // Fire-and-forget vector delete
      if (entryToDelete.id) {
        deleteEntryVector(entryToDelete.id).catch((e) => console.warn('Vector delete error:', e));
      }
      setShowDeleteModal(false);
      setEntryToDelete(null);
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setIsDeletingEntry(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEntryToDelete(null);
  };

  const handleExport = () => {
    try {
      exportEntries();
    } catch (err) {
      console.error('Error exporting entries:', err);
      alert('Failed to export entries. Please try again.');
    }
  };

  const handleImportClick = () => {
    setShowScrapeModal(true);
  };

  const handleReleaseClick = async () => {
    try {
      // Fetch draft entries
      const response = await fetch(`${API}/api/scraping/draft-entries`);
      const data = await response.json();
      
      if (data.success) {
        setDraftEntries(data.entries);
        setShowReleaseModal(true);
      } else {
        alert('Failed to fetch draft entries');
      }
    } catch (error) {
      console.error('Error fetching draft entries:', error);
      alert('Failed to fetch draft entries');
    }
  };

  const handleReleaseAll = async () => {
    try {
      const response = await fetch(`${API}/api/scraping/release-all-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully released ${data.released_count} entries!`);
        setShowReleaseModal(false);
        setDraftEntries([]);
        // Refresh the entries list
        window.location.reload();
      } else {
        alert('Failed to release entries');
      }
    } catch (error) {
      console.error('Error releasing entries:', error);
      alert('Failed to release entries');
    }
  };

  // Allow other components/pages to open the Import JSON modal via a global event
  useEffect(() => {
    const openImportListener = () => setShowImportJsonModal(true);
    window.addEventListener('open-import-json-modal', openImportListener);
    return () => window.removeEventListener('open-import-json-modal', openImportListener);
  }, []);

  const handleImportJson = async (jsonText) => {
    // Show loading modal
    setShowImportLoadingModal(true);
    setShowImportJsonModal(false);
    
    try {
      const result = await importEntries(jsonText, user);
      
      // Hide loading modal
      setShowImportLoadingModal(false);
      
      if (result.success) {
        // Store the imported data and update state so the form prefills immediately
        sessionStorage.setItem('importedEntryData', JSON.stringify(result.data));
        setImportedEntryData(result.data);
        // Set the cameFromDashboard flag to allow access to the form
        sessionStorage.setItem('cameFromDashboard', 'true');
        // Ensure we're on the form step; if already there, state update is enough
        if (!window.location.pathname.startsWith('/law-entry/')) {
          navigate('/law-entry/1');
        }
      } else {
        // Show error
        alert(`Import failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Error importing entries:', err);
      setShowImportLoadingModal(false);
      alert('Failed to import entries. Please check the JSON format.');
    }
  };

  const handleClearAll = () => {
    // Admin check removed - no authentication required
    setShowClearModal(true);
    setClearModalStep(1);
    setClearOption(null);
  };

  // Logout functionality removed - no authentication required

  const handleIncompleteEntriesModalOK = () => {
    if (pendingEntryForModal) {
      // Set the entry's created_at to yesterday with the same time
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      pendingEntryForModal.created_at = yesterday.toISOString();
      
      console.log('Setting created_at to yesterday:', {
        originalDate: now.toISOString(),
        yesterdayDate: yesterday.toISOString(),
        entryTitle: pendingEntryForModal.title,
        entryType: pendingEntryForModal.type
      });
      
      // Save the entry with yesterday's date
      addEntry(pendingEntryForModal);
      
      // Show success popup
      setShowSuccessModal(true);
      
      // Clear the pending entry and close modal
      setPendingEntryForModal(null);
      setShowIncompleteEntriesModal(false);
      
      // Navigation to dashboard will happen after success modal auto-closes (3 seconds)
    }
  };

  const handleIncompleteEntriesModalCancel = () => {
    // Clear the pending entry and close modal without saving
    setPendingEntryForModal(null);
    setShowIncompleteEntriesModal(false);
  };

  const showIncompleteEntriesModalWithEntry = (entryData) => {
    setPendingEntryForModal(entryData);
    setShowIncompleteEntriesModal(true);
  };

  // Auto-close success modal after 5 seconds and navigate to dashboard
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        // Navigate to dashboard after success modal closes
        navigate('/dashboard');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, navigate]);

  // Auto-close entry saved modal after 5 seconds and navigate to dashboard
  useEffect(() => {
    if (showEntrySavedModal) {
      const timer = setTimeout(() => {
        setShowEntrySavedModal(false);
        // Navigate to dashboard after entry saved modal closes
        navigate('/dashboard');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showEntrySavedModal, navigate]);

  const handleClearOptionSelect = (option) => {
    setClearOption(option);
    setClearModalStep(2);
  };

  const handleClearConfirm = () => {
    try {
      if (clearOption === 'all') {
        clearEntriesVector().then(async (resp) => {
          if (!resp?.success) console.warn('Vector clear all failed:', resp?.error);
          clearAllEntries();
          // Ensure cache is nuked and UI refetches
          try { localStorage.removeItem('law_entries'); sessionStorage.clear(); } catch {}
          alert('All entries have been cleared from the database.');
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        clearEntriesVector(today).then(async (resp) => {
          if (!resp?.success) console.warn('Vector clear today failed:', resp?.error);
          // Update UI list to remove todays
          const remaining = entries.filter(entry => {
            const entryDate = new Date(entry.created_at).toISOString().split('T')[0];
            return entryDate !== today;
          });
          try { localStorage.removeItem('law_entries'); } catch {}
          alert('Today\'s entries have been cleared from the database.');
        });
      }
      setShowClearModal(false);
      setClearModalStep(1);
      setClearOption(null);
    } catch (err) {
      console.error('Error clearing entries:', err);
      alert('Error clearing entries. Please try again.');
    }
  };

  const handleClearCancel = () => {
    setShowClearModal(false);
    setClearModalStep(1);
    setClearOption(null);
  };

  // Plan import removed

  // Plan import removed

  // Plan import removed

  // Plan import removed

  // Plan import removed

  const handleBackToList = () => {
    setImportedEntryData(null); // Clear imported data
    sessionStorage.removeItem('importedEntryData'); // Clear from sessionStorage
    sessionStorage.removeItem('cameFromDashboard'); // Clear dashboard access flag
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">

      {currentView !== 'form' && (
      <header className="App-header" style={{ 
        background: isDarkMode
          ? `linear-gradient(135deg, rgba(178, 84, 34, ${headerOpacity}) 0%, rgba(153, 61, 28, ${headerOpacity}) 100%)`
          : `linear-gradient(135deg, rgba(255, 140, 66, ${headerOpacity}) 0%, rgba(255, 107, 53, ${headerOpacity}) 100%)`
      }}>
        <div className="header-left">
          <h1>Civilify Law Entry</h1>
          <span className="header-entries-count">{stats.totalEntries} entries</span>
        </div>
        <div className="header-actions">
          {/* Inline notifications dropdown state */}
          <HeaderNotificationsButton />
          <button
            aria-label="Toggle theme"
            className={`theme-toggle ${isDarkMode ? 'theme-toggle--dark' : 'theme-toggle--light'}`}
            onClick={() => setIsDarkMode(v => !v)}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              // Half moon icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
              </svg>
            ) : (
              // Sun icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm7.03-3.34l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM20 11v2h3v-2h-3zm-2.76-6.16l1.8-1.79-1.79-1.79-1.79 1.79 1.78 1.79zM12 4a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zM4.34 17.66l-1.79 1.79 1.79 1.79 1.79-1.79-1.79-1.79z"/>
              </svg>
            )}
          </button>
          {/* Logout button removed - no authentication required */}
        </div>
      </header>
      )}


      {currentView !== 'form' && (
      <nav className="App-nav">
        <div className="nav-center">
          <button 
            onClick={handleCreateNew} 
            className="btn-primary"
            disabled={currentView === 'form' || !hasPlan || isCreatingEntry}
          >
            {isCreatingEntry ? 'Loading...' : 'Create New Entry'}
          </button>
          <button 
            onClick={handleReleaseClick} 
            className="btn-release"
            style={{ whiteSpace: 'nowrap' }}
          >
            Release Entries
          </button>
          <button 
            onClick={handleImportClick} 
            className="btn-import"
            style={{ whiteSpace: 'nowrap' }}
          >
            Scrape Entries
          </button>
          <button onClick={() => setShowChat(true)} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            Ask Villy (RAG)
          </button>
          <button onClick={handleExport} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            Export Entries
          </button>
          <button onClick={handleClearAll} className="btn-danger" style={{ whiteSpace: 'nowrap' }}>
            Clear All Entries
          </button>
        </div>
      </nav>
      )}

      <main className="App-main">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {currentView === 'list' && (
                  <EntryList
          entries={entries}
          onViewEntry={handleViewEntry}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          onExportEntry={exportSingleEntry}
          searchEntries={searchEntries}
          teamMemberNames={teamMemberNames}
        />
        )}

        {currentView === 'list' && new URLSearchParams(location.search).get('tab') === 'notifications' && (
          <DashboardNotifications />
        )}

        {currentView === 'form' && (
          <>
            <EntryForm
              entry={editingEntry || importedEntryData}
              existingEntries={entries}
              onSave={handleSaveEntry}
              onCancel={handleBackToList}
              onShowIncompleteEntriesModal={showIncompleteEntriesModalWithEntry}
              isUpdatingEntry={isUpdatingEntry}
            />
          </>
        )}

        {currentView === 'view' && selectedEntryId && (
          <EntryView
            entry={getEntryById(selectedEntryId)}
            onEdit={() => handleEditEntry(selectedEntryId)}
            onDelete={() => handleDeleteEntry(selectedEntryId)}
            onExport={() => exportSingleEntry(getEntryById(selectedEntryId))}
            teamMemberNames={teamMemberNames}
          />
        )}
      </main>


      
      {/* Confetti Effect */}
      <Confetti 
        show={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
      
      {/* Clear Modal */}
      <Modal 
        isOpen={showClearModal} 
        onClose={handleClearCancel}
        title={clearModalStep === 1 ? "Choose clear option" : 
               clearOption === 'all' ? "You are deleting all law entries IN THE ENTIRE DATABASE." :
               "You are deleting all law entries for TODAY."}
        subtitle={clearModalStep === 2 ? "Would you like to continue?" : null}
      >
        {clearModalStep === 1 ? (
          <div className="modal-options">
            <button 
              className="modal-option" 
              onClick={() => handleClearOptionSelect('today')}
            >
              Today
            </button>
            <button 
              className="modal-option" 
              onClick={() => handleClearOptionSelect('all')}
            >
              All
            </button>
            <button 
              className="modal-option cancel" 
              onClick={handleClearCancel}
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="modal-buttons">
            <button 
              className="modal-button danger" 
              onClick={handleClearConfirm}
            >
              Yes
            </button>
            <button 
              className="modal-button cancel" 
              onClick={handleClearCancel}
            >
              No
            </button>
          </div>
        )}
      </Modal>

      {/* Resume Draft Modal */}
      <Modal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        title={"Previous Session Found"}
        subtitle={"Would you like to continue inputting?"}
      >
        <div className="modal-buttons">
          <button
            className="modal-button orange-outline"
            onClick={handleResumeYes}
            disabled={isResumingYes || isResumingNo}
          >
            {isResumingYes ? 'Loading...' : 'Yes, continue inputting'}
          </button>
          <button
            className="modal-button cancel"
            onClick={handleResumeNo}
            disabled={isResumingYes || isResumingNo}
          >
            {isResumingNo ? 'Loading...' : 'No, create new entry'}
          </button>
        </div>
      </Modal>

      {/* Plan Import Modal removed */}

      {/* Logout modal removed - no authentication required */}

      {/* Import Loading Modal */}
      <LoadingModal
        isOpen={showImportLoadingModal}
        message="Importing Entry..."
        subtitle="Please wait while we process your import..."
      />

      {/* Update Loading Modal */}
      <LoadingModal
        isOpen={isUpdatingEntry}
        message="Updating Entry..."
        subtitle="Please wait while we update your entry..."
      />

      {/* Import Success Modal */}
      <Modal
        isOpen={showImportSuccessModal}
        onClose={() => setShowImportSuccessModal(false)}
        title="Import Successful!"
        subtitle={`Successfully imported ${importedCount} ${importedCount === 1 ? 'entry' : 'entries'}.`}
      >
        <div className="modal-buttons">
          <button
            className="modal-button success"
            onClick={() => setShowImportSuccessModal(false)}
          >
            Hell Yeah! 🎉
          </button>
        </div>
      </Modal>

      {/* Incomplete Entries Modal */}
      <Modal
        isOpen={showIncompleteEntriesModal}
        onClose={handleIncompleteEntriesModalCancel}
        title="You have unfinished quotas from yesterday"
        subtitle={pendingEntryForModal ? `"${pendingEntryForModal.title}" (${pendingEntryForModal.type}) will be credited to missing progress` : "New entry will be credited to missing progress"}
      >
        <div className="modal-buttons">
          <button
            className="modal-button orange"
            onClick={handleIncompleteEntriesModalOK}
          >
            I understand
          </button>
          <button
            className="modal-button orange-outline"
            onClick={handleIncompleteEntriesModalCancel}
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {}} // Prevent closing until auto-close
        title="Entry Created Successfully!"
        subtitle={pendingEntryForModal ? 
          (pendingEntryForModal.created_at && new Date(pendingEntryForModal.created_at).getDate() !== new Date().getDate() ? 
            `"${pendingEntryForModal.title}" has been saved and credited to yesterday's progress.` : 
            `"${pendingEntryForModal.title}" has been saved successfully.`) : 
          "Entry has been saved successfully."}
      >
        <div className="modal-buttons">
          <button
            className="modal-button orange"
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            Auto-closing in 5 seconds...
          </button>
        </div>
      </Modal>

      {/* Delete Entry Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        title="Delete Entry"
        subtitle={entryToDelete ? `Are you sure you want to delete "${entryToDelete.title}"?` : "Are you sure you want to delete this entry?"}
      >
        <div className="modal-buttons">
          <button
            className="modal-button danger"
            onClick={handleDeleteConfirm}
            disabled={isDeletingEntry}
          >
            {isDeletingEntry ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button
            className="modal-button cancel"
            onClick={handleDeleteCancel}
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Entry Loading Modal */}
      <LoadingModal
        isOpen={showEntryLoadingModal}
        title="Creating Entry..."
        subtitle={`"${savedEntryTitle}" is being saved to the database and indexed.`}
      />

      {/* Entry Saved Modal */}
      <Modal
        isOpen={showEntrySavedModal}
        onClose={() => {}} // Prevent closing until auto-close
        title="Entry Saved Successfully!"
        subtitle={`"${savedEntryTitle}" has been saved to the database and indexed.`}
      >
        <div className="modal-buttons">
          <button
            className="modal-button orange"
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            Auto-closing in 5 seconds...
          </button>
        </div>
      </Modal>

      {/* Import JSON Modal */}
      <ImportJsonModal
        isOpen={showImportJsonModal}
        onClose={() => setShowImportJsonModal(false)}
        onImport={handleImportJson}
      />

      {/* Scrape Entries Modal */}
      <ScrapeEntriesModal
        isOpen={showScrapeModal}
        onClose={() => setShowScrapeModal(false)}
        onSuccess={() => {
          // Keep modal open after success; store a flag for next time
          try { localStorage.setItem('lastScrapeCompleted', '1'); } catch {}
        }}
      />

      {/* Release Entries Modal */}
      <ReleaseEntriesModal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        draftEntries={draftEntries}
        onReleaseAll={handleReleaseAll}
      />

      {/* Chat Modal (RAG) */}
      <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}

export default App;


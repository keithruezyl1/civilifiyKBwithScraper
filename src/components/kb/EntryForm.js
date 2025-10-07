import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './EntryForm.css';

export default function EntryForm({ entry, existingEntries, onSave, onCancel, onShowIncompleteEntriesModal }) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState(entry ? {
    ...entry,
    source_urls: entry.source_urls || [''],
    tags: entry.tags || [''],
    visibility: { gli: true, cpa: true }, // Always set both GLI and CPA
    offline: entry.offline || { pack_include: false }
  } : {
    type: '',
    title: '',
    jurisdiction: '',
    law_family: '',
    section_id: '',
    canonical_citation: '',
    status: 'active',
    effective_date: '',
    amendment_date: '',
    summary: '',
    text: '',
    source_urls: [''],
    tags: [''],
    last_reviewed: new Date().toISOString().split('T')[0],
    visibility: {
      gli: true,
      cpa: true
    },
    offline: {
      pack_include: false,
      pack_category: undefined,
      pack_priority: undefined
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Basic entry_id preview generator (heuristic)
  const generateEntryIdPreview = () => {
    const { type, law_family, section_id, title } = formData || {};
    if (!type || !law_family) return '';
    const clean = (s) => (s || '').toString().replace(/\s+/g, ' ').trim();
    const lf = clean(law_family);
    const sec = clean(section_id);
    if (type === 'statute_section') {
      const ra = lf.match(/RA\s*([0-9]+)/i);
      const rpc = /RPC|Revised Penal Code/i.test(lf);
      if (ra) return `RA${ra[1]}-${sec ? sec.replace(/\s+/g,'') : 'SecX'}`;
      if (rpc) return `RPC-${sec ? sec.replace(/\s+/g,'') : 'ArtX'}`;
      return `${lf.replace(/\s+/g,'')}-${sec ? sec.replace(/\s+/g,'') : 'SecX'}`;
    }
    if (type === 'city_ordinance_section') {
      const co = lf.match(/CO\s*([0-9]+)/i) || lf.match(/Ord\.?\s*([0-9]+)/i);
      return `CEBU-CO${co ? co[1] : 'XXXX'}-${sec ? sec.replace(/\s+/g,'') : 'SecX'}`;
    }
    if (type === 'rule_of_court') {
      return `ROC-${sec ? sec.replace(/\s+/g,'-') : 'RuleX-SecY'}`;
    }
    if (type === 'pnp_sop') {
      return `PNP-SOP-${(title || lf).replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$|--+/g,'')}`;
    }
    if (type === 'incident_checklist') {
      return `INC-${(title || 'Checklist').toUpperCase().replace(/[^A-Z0-9]+/g,'-')}`;
    }
    return `${lf.replace(/\s+/g,'-')}`;
  };

  // Load draft from localStorage on mount (if creating new)
  React.useEffect(() => {
    if (!entry) {
      try {
        const raw = localStorage.getItem('kb_draft');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') setFormData((prev) => ({ ...prev, ...parsed }));
        }
      } catch (_) {}
    }
  }, [entry]);

  // Autosave (debounced)
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem('kb_draft', JSON.stringify(formData));
        setLastSavedAt(new Date());
      } catch (_) {}
    }, 800);
    return () => clearTimeout(t);
  }, [formData]);

  // Step validation based on KB rules
  const getMissingFieldsForStep = (step) => {
    const missing = [];
    if (step === 1) {
      if (!formData.type) missing.push('Entry Type');
      if (!formData.title) missing.push('Title');
      if (!formData.jurisdiction) missing.push('Jurisdiction');
      if (!formData.law_family) missing.push('Law Family');
      if (!formData.canonical_citation) missing.push('Canonical Citation');
      if (!formData.status) missing.push('Status');
    }
    if (step === 2) {
      if (!formData.effective_date) missing.push('Effective Date');
      if (formData.status === 'amended' && !formData.amendment_date) missing.push('Amendment Date');
      const firstUrl = (formData.source_urls || [])[0];
      if (!firstUrl) missing.push('At least 1 Source URL');
      if (!formData.last_reviewed) missing.push('Last Reviewed');
    }
    if (step === 3) {
      if (!formData.summary) missing.push('Summary');
      if (!formData.text) missing.push('Legal Text');
    }
    if (step === 5) {
      if (formData?.offline?.pack_include && !formData?.offline?.pack_category) missing.push('Offline Pack Category');
    }
    return missing;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Clear type-specific fields when entry type changes
      if (field === 'type' && prev.type && prev.type !== value) {
        console.log(`Entry type changed from ${prev.type} to ${value}, clearing type-specific fields`);
        
        // Clear all type-specific fields with correct default values
        const fieldsToClear = {
          // Array fields
          'elements': [],
          'penalties': [],
          'defenses': [],
          'triggers': [],
          'time_limits': [],
          'required_forms': [],
          'applicability': [],
          'supersedes': [],
          'steps_brief': [],
          'forms_required': [],
          'failure_states': [],
          'fine_schedule': [],
          'apprehension_flow': [],
          'phases': [],
          'forms': [],
          'handoff': [],
          'rights_callouts': [],
          'advice_points': [],
          'legal_bases': [],
          'related_sections': [],
          'topics': [],
          'jurisprudence': [],
          // String fields
          'standard_of_proof': '',
          'rule_no': '',
          'section_no': '',
          'circular_no': '',
          'issuance_no': '',
          'instrument_no': '',
          'violation_code': '',
          'violation_name': '',
          'license_action': '',
          'incident': '',
          'rights_scope': '',
          // Object fields
          'prescriptive_period': null
        };
        
        Object.entries(fieldsToClear).forEach(([field, defaultValue]) => {
          newData[field] = defaultValue;
        });
      }
      
      return newData;
    });
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Add created_at timestamp for new entries
      if (!entry) {
        // Check if user has incomplete entries from yesterday
        const incompleteEntries = JSON.parse(sessionStorage.getItem('incompleteEntries') || '[]');
        const userPersonId = user?.personId ? Number(String(user.personId).replace('P', '')) : null;
        const userHasIncompleteEntries = incompleteEntries.some((incompleteEntry) => 
          incompleteEntry.personId === userPersonId || 
          incompleteEntry.personName === user?.name ||
          incompleteEntry.personName === user?.username
        );
        
        console.log('Checking incomplete entries for user:', {
          userPersonId,
          userName: user?.name,
          userUsername: user?.username,
          incompleteEntries,
          userHasIncompleteEntries
        });
        
        if (userHasIncompleteEntries && onShowIncompleteEntriesModal) {
          // Show modal with entry details instead of saving directly
          formData.id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Add user information to formData
          formData.team_member_id = user?.personId ? Number(String(user.personId).replace('P','')) : undefined;
          formData.created_by = user?.personId ? Number(String(user.personId).replace('P','')) : undefined;
          formData.created_by_name = user?.name || user?.username;
          formData.created_by_username = user?.username;
          
          onShowIncompleteEntriesModal(formData);
          return;
        } else {
          formData.created_at = new Date().toISOString();
          console.log('No incomplete entries: Setting created_at to today', formData.created_at);
        }
        
        formData.id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add user information to formData
        formData.team_member_id = user?.personId ? Number(String(user.personId).replace('P','')) : undefined;
        formData.created_by = user?.personId ? Number(String(user.personId).replace('P','')) : undefined;
        formData.created_by_name = user?.name || user?.username;
        formData.created_by_username = user?.username;
      }
      
      // Call the onSave function passed from parent
      onSave(formData);
      
      // Dispatch event to refresh progress display
      window.dispatchEvent(new Event('refresh-progress'));
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const missing = getMissingFieldsForStep(currentStep);
    if (missing.length > 0) {
      setStepError(missing.join(', '));
      return;
    }
    setStepError('');
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { id: 1, name: 'Basics', icon: '📋', description: 'Basic information' },
    { id: 2, name: 'Sources & Dates', icon: '📅', description: 'Sources and important dates' },
    { id: 3, name: 'Content', icon: '📝', description: 'Legal text and summary' },
    { id: 4, name: 'Type-Specific', icon: '⚙️', description: 'Type-specific fields' },
    { id: 5, name: 'Visibility & Offline', icon: '👁️', description: 'Visibility settings' },
    { id: 6, name: 'Review & Publish', icon: '✅', description: 'Review and submit' }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {stepError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
                Please complete: {stepError}
              </div>
            )}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-lg text-gray-600">Start with the fundamental details about this legal entry.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Entry Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Entry Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select Entry Type</option>
                        <option value="constitution_provision">📜 Constitution Provision</option>
                        <option value="statute_section">⚖️ Statute Section</option>
                        <option value="city_ordinance_section">🏛️ City Ordinance Section</option>
                        <option value="rule_of_court">⚖️ Rule of Court</option>
                        <option value="agency_circular">📋 Agency Circular</option>
                        <option value="doj_issuance">🏛️ DOJ Issuance</option>
                        <option value="executive_issuance">📜 Executive Issuance</option>
                        <option value="pnp_sop">👮 PNP SOP</option>
                        <option value="incident_checklist">📋 Incident Checklist</option>
                        <option value="rights_advisory">⚖️ Rights Advisory</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter a clear, descriptive title for this legal entry"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Jurisdiction <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.jurisdiction}
                        onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select Jurisdiction</option>
                        <option value="PH">🇵🇭 Philippines (PH)</option>
                        <option value="PH-CEBU-CITY">🏙️ Cebu City (PH-CEBU-CITY)</option>
                        <option value="PH-MANILA">🏙️ Manila (PH-MANILA)</option>
                        <option value="PH-QUEZON-CITY">🏙️ Quezon City (PH-QUEZON-CITY)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Law Family <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.law_family}
                        onChange={(e) => handleInputChange('law_family', e.target.value)}
                        placeholder="e.g., RA 4136, Rules of Court, Cebu Ord. 2606"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Reference Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Section ID
                      </label>
                      <input
                        type="text"
                        value={formData.section_id}
                        onChange={(e) => handleInputChange('section_id', e.target.value)}
                        placeholder="e.g., Sec. 7, Rule 113 Sec. 5, Art. 308"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Canonical Citation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.canonical_citation}
                        onChange={(e) => handleInputChange('canonical_citation', e.target.value)}
                        placeholder="e.g., RPC Art. 308, ROC Rule 113, Sec. 5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">Shown to users; follows official formatting.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="active">🟢 Active</option>
                        <option value="amended">🟡 Amended</option>
                        <option value="repealed">🔴 Repealed</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs text-gray-500">Suggested Entry ID</div>
                      <div className="mt-1 inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-mono select-all">
                        {generateEntryIdPreview() || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-blue-600 text-lg">💡</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">Pro Tip</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Choose the most specific entry type that matches your legal document. 
                        This helps Villy AI provide more accurate and relevant responses.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {stepError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
                Please complete: {stepError}
              </div>
            )}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sources & Dates</h2>
              <p className="text-lg text-gray-600">Provide official sources and important dates for this entry.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Important Dates
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Effective Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.effective_date}
                        onChange={(e) => handleInputChange('effective_date', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {formData.status === 'amended' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Amendment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.amendment_date}
                          onChange={(e) => handleInputChange('amendment_date', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Required when status is "amended"</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Reviewed <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.last_reviewed}
                        onChange={(e) => handleInputChange('last_reviewed', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Source URLs
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Official Sources <span className="text-red-500">*</span>
                    </label>
                    
                    {formData.source_urls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleArrayChange('source_urls', index, e.target.value)}
                          placeholder="e.g., https://official-government-website.gov.ph"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('source_urls', index)}
                          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addArrayItem('source_urls')}
                      className="w-full px-4 py-3 bg-white text-orange-600 rounded-lg border-2 border-orange-500 hover:bg-orange-50 transition-colors mt-4"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-green-600 text-lg">📚</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-900">Source Guidelines</h4>
                      <ul className="text-sm text-green-800 mt-1 space-y-1">
                        <li>• Use official government websites when possible</li>
                        <li>• Include multiple sources for verification</li>
                        <li>• Ensure URLs are publicly accessible</li>
                        <li>• Prefer primary sources over secondary interpretations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {stepError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">Please complete: {stepError}</div>
            )}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Content</h2>
              <p className="text-lg text-gray-600">Provide the legal text and summary for this entry.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Legal Content
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => handleInputChange('summary', e.target.value)}
                      placeholder="Provide a concise, neutral summary of this legal provision (1-3 sentences)"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Keep it concise and neutral. This will be shown to users as a quick overview.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Legal Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.text}
                      onChange={(e) => handleInputChange('text', e.target.value)}
                      placeholder="Enter the complete, normalized legal text (substance-only, without formatting artifacts)"
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Include the complete legal text, normalized and cleaned for consistency.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                  Tags & Keywords
                </h3>
                
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags <span className="text-red-500">*</span>
                  </label>
                  
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                        placeholder="Enter tag (e.g., arrest, search, traffic)"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addArrayItem('tags')}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                  >
                    ➕ Add Tag
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-600 text-lg">💡</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-900">Content Guidelines</h4>
                    <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                      <li>• <strong>Summary:</strong> Be concise, neutral, and informative</li>
                      <li>• <strong>Legal Text:</strong> Include complete, normalized text without formatting artifacts</li>
                      <li>• <strong>Tags:</strong> Use relevant keywords that will help users find this entry</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            {stepError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">Please complete: {stepError}</div>
            )}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Type-Specific Fields</h2>
              <p className="text-lg text-gray-600">
                Configure fields specific to {formData.type ? formData.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'selected entry type'} entries.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <span className="text-3xl">🚧</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon!</h3>
              <p className="text-gray-600 mb-6">
                Type-specific fields will be implemented in the next iteration. 
                For now, please add any type-specific information in the Legal Text field.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This step will include dynamic fields based on the selected entry type, 
                  such as elements, penalties, triggers, and other type-specific attributes.
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            {stepError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">Please complete: {stepError}</div>
            )}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <span className="text-2xl">👁️</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Visibility & Offline Pack</h2>
              <p className="text-lg text-gray-600">Configure where this entry appears and offline pack settings.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Offline Pack Settings
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-6">
                    Configure offline pack inclusion:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        id="pack-include"
                        checked={formData.offline.pack_include}
                        onChange={(e) => handleInputChange('offline', { ...formData.offline, pack_include: e.target.checked })}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="pack-include" className="ml-3 flex items-center">
                        <span className="text-lg mr-2">📦</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Include in Offline Pack</div>
                          <div className="text-xs text-gray-500">Make available for offline use</div>
                        </div>
                      </label>
                    </div>

                    {formData?.offline?.pack_include && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Pack Category <span className="text-red-500">*</span></label>
                          <select
                            value={formData.offline.pack_category || ''}
                            onChange={(e) => handleInputChange('offline', { ...formData.offline, pack_category: e.target.value || undefined })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select Category</option>
                            <option value="sop">SOP</option>
                            <option value="checklist">Checklist</option>
                            <option value="traffic">Traffic</option>
                            <option value="rights">Rights</option>
                            <option value="roc">Rules of Court</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Required when including in offline pack.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Pack Priority</label>
                          <select
                            value={formData.offline.pack_priority || ''}
                            onChange={(e) => handleInputChange('offline', { ...formData.offline, pack_priority: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Default (2)</option>
                            <option value="1">1 (Highest)</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-blue-600 text-lg">💡</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">Visibility Guidelines</h4>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• <strong>GLI:</strong> General legal questions and broad inquiries</li>
                        <li>• <strong>CPA:</strong> Case analysis, elements, defenses, and probability assessment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Review & Publish</h2>
              <p className="text-lg text-gray-600">Review your entry and submit for review or publish directly.</p>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Entry Preview
              </h3>
              
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{formData.title || 'Untitled Entry'}</h4>
                  <p className="text-lg text-gray-600">{formData.canonical_citation || 'No citation'}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {formData.type ? formData.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Type'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1) : 'Unknown Status'}
                  </span>
                  {formData.visibility?.gli && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      🔍 GLI
                    </span>
                  )}
                  {formData.visibility?.cpa && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      📊 CPA
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Effective:</span> {formData.effective_date || 'Not set'}
                  </div>
                  {formData.amendment_date && (
                    <div>
                      <span className="font-medium">Amended:</span> {formData.amendment_date}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Last Reviewed:</span> {formData.last_reviewed || 'Not set'}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{formData.summary || 'No summary provided'}</p>
                </div>
                
                {formData.tags && formData.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-green-600 text-lg">🎉</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-900">Ready to Submit!</h4>
                  <p className="text-sm text-green-800 mt-1">
                    Your knowledge base entry is ready. Click "Create Entry" to save it to the system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="kb-form min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {entry ? 'Edit Knowledge Base Entry' : 'Create Knowledge Base Entry'}
          </h1>
          <p className="text-xl text-gray-600">
            {entry ? 'Update the legal knowledge base entry.' : 'Add a new entry to the legal knowledge base for Villy AI.'}
          </p>
          <div className="text-xs text-gray-500 mt-2">{lastSavedAt ? `Autosaved ${Math.round((Date.now()-new Date(lastSavedAt).getTime())/1000)}s ago` : 'Autosave enabled'}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Stepper Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Progress
              </h2>
              
              <nav className="space-y-3 stepper">
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const isClickable = isCompleted || step.id === 1;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => isClickable && setCurrentStep(step.id)}
                      disabled={!isClickable}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-md'
                          : isCompleted
                          ? 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:shadow-md'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                      } ${!isClickable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mr-4 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg'
                            : isCompleted
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? '✓' : step.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{step.name}</div>
                          <div className="text-xs opacity-75">{step.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Step {currentStep} of {steps.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Form Content */}
          <div className="lg:col-span-3">
            <div className="section-card">
              <form onSubmit={handleSubmit} className="p-8">
                {renderStep()}
                
                {/* Enhanced Navigation Buttons */}
                <div className="flex justify-between mt-12 pt-8 border-t border-gray-200">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="kb-btn-outline"
                    >
                      ❌ Cancel
                    </button>
                    
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="kb-btn-outline"
                      >
                        ⬅️ Previous
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {currentStep < steps.length ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="kb-btn-primary"
                      >
                        Next ➡️
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="kb-btn-primary"
                      >
                        {isSubmitting ? '⏳ Saving...' : (entry ? '🔄 Update Entry' : '✨ Create Entry')}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

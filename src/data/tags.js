/**
 * Tag definitions for categorizing legal entries
 */

export const TAGS = [
  // Traffic-related tags
  { value: 'traffic', label: 'Traffic', category: 'traffic' },
  { value: 'licensing', label: 'Licensing', category: 'traffic' },
  { value: 'violation', label: 'Violation', category: 'traffic' },
  { value: 'fine', label: 'Fine', category: 'traffic' },
  { value: 'suspension', label: 'Suspension', category: 'traffic' },
  { value: 'revocation', label: 'Revocation', category: 'traffic' },
  { value: 'checkpoint', label: 'Checkpoint', category: 'traffic' },
  { value: 'dui', label: 'DUI', category: 'traffic' },
  { value: 'sobriety', label: 'Sobriety', category: 'traffic' },
  { value: 'breath-test', label: 'Breath Test', category: 'traffic' },
  { value: 'field-test', label: 'Field Test', category: 'traffic' },

  // Arrest and detention tags
  { value: 'arrest', label: 'Arrest', category: 'arrest' },
  { value: 'detention', label: 'Detention', category: 'arrest' },
  { value: 'custody', label: 'Custody', category: 'arrest' },
  { value: 'booking', label: 'Booking', category: 'arrest' },
  { value: 'processing', label: 'Processing', category: 'arrest' },
  { value: 'miranda', label: 'Miranda Rights', category: 'arrest' },
  { value: 'counsel', label: 'Right to Counsel', category: 'arrest' },

  // Search and seizure tags
  { value: 'search', label: 'Search', category: 'search' },
  { value: 'seizure', label: 'Seizure', category: 'search' },
  { value: 'warrant', label: 'Warrant', category: 'search' },
  { value: 'probable-cause', label: 'Probable Cause', category: 'search' },
  { value: 'consent', label: 'Consent', category: 'search' },
  { value: 'plain-view', label: 'Plain View', category: 'search' },
  { value: 'exigent', label: 'Exigent Circumstances', category: 'search' },

  // Rights and constitutional tags
  { value: 'rights', label: 'Rights', category: 'rights' },
  { value: 'constitutional', label: 'Constitutional', category: 'rights' },
  { value: 'due-process', label: 'Due Process', category: 'rights' },
  { value: 'equal-protection', label: 'Equal Protection', category: 'rights' },
  { value: 'privacy', label: 'Privacy', category: 'rights' },
  { value: 'free-speech', label: 'Free Speech', category: 'rights' },
  { value: 'assembly', label: 'Assembly', category: 'rights' },
  { value: 'religion', label: 'Religion', category: 'rights' },

  { value: 'sop', label: 'SOP', category: 'operations' },
  { value: 'procedure', label: 'Procedure', category: 'operations' },
  { value: 'protocol', label: 'Protocol', category: 'operations' },
  { value: 'guidelines', label: 'Guidelines', category: 'operations' },
  { value: 'standards', label: 'Standards', category: 'operations' },
  { value: 'training', label: 'Training', category: 'operations' },
  { value: 'supervision', label: 'Supervision', category: 'operations' },

  // Incident and investigation tags
  { value: 'incident', label: 'Incident', category: 'investigation' },
  { value: 'investigation', label: 'Investigation', category: 'investigation' },
  { value: 'evidence', label: 'Evidence', category: 'investigation' },
  { value: 'witness', label: 'Witness', category: 'investigation' },
  { value: 'statement', label: 'Statement', category: 'investigation' },
  { value: 'report', label: 'Report', category: 'investigation' },
  { value: 'blotter', label: 'Blotter', category: 'investigation' },
  { value: 'documentation', label: 'Documentation', category: 'investigation' },

  // Forms and documentation tags
  { value: 'forms', label: 'Forms', category: 'forms' },
  { value: 'tvr', label: 'TVR', category: 'forms' },
  { value: 'noa', label: 'NOA', category: 'forms' },
  { value: 'apprehension-report', label: 'Apprehension Report', category: 'forms' },
  { value: 'patrol-log', label: 'Patrol Log', category: 'forms' },
  { value: 'bwc-log', label: 'BWC Log', category: 'forms' },
  { value: 'medical-exam', label: 'Medical Exam', category: 'forms' },

  // Legal basis tags
  { value: 'statute', label: 'Statute', category: 'legal' },
  { value: 'ordinance', label: 'Ordinance', category: 'legal' },
  { value: 'rule-of-court', label: 'Rule of Court', category: 'legal' },
  { value: 'circular', label: 'Circular', category: 'legal' },
  { value: 'issuance', label: 'Issuance', category: 'legal' },
  { value: 'executive-order', label: 'Executive Order', category: 'legal' },
  { value: 'case-law', label: 'Case Law', category: 'legal' },
  { value: 'precedent', label: 'Precedent', category: 'legal' },

  // Special categories
  { value: 'emergency', label: 'Emergency', category: 'special' },
  { value: 'critical', label: 'Critical', category: 'special' },
  { value: 'high-priority', label: 'High Priority', category: 'special' },
  { value: 'time-sensitive', label: 'Time Sensitive', category: 'special' },
  { value: 'public-safety', label: 'Public Safety', category: 'special' },
  { value: 'community', label: 'Community', category: 'special' },
  { value: 'outreach', label: 'Outreach', category: 'special' }
];

/**
 * Get all tags
 * @returns {Array} Array of all tags
 */
export const getAllTags = () => {
  return TAGS;
};

/**
 * Get tags by category
 * @param {string} category - Category name
 * @returns {Array} Array of tags in the category
 */
export const getTagsByCategory = (category) => {
  return TAGS.filter(tag => tag.category === category);
};

/**
 * Get tag by value
 * @param {string} value - Tag value
 * @returns {Object|null} Tag object or null
 */
export const getTagByValue = (value) => {
  return TAGS.find(tag => tag.value === value) || null;
};

/**
 * Get tag label by value
 * @param {string} value - Tag value
 * @returns {string} Tag label
 */
export const getTagLabel = (value) => {
  const tag = getTagByValue(value);
  return tag ? tag.label : value;
};

/**
 * Get tag categories
 * @returns {Array} Array of unique category names
 */
export const getTagCategories = () => {
  const categories = [...new Set(TAGS.map(tag => tag.category))];
  return categories.sort();
};

/**
 * Get suggested tags based on text content
 * @param {string} text - Text to analyze
 * @returns {Array} Array of suggested tag values
 */
export const getSuggestedTags = (text) => {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const suggestions = [];
  
  TAGS.forEach(tag => {
    if (lowerText.includes(tag.value.replace('-', ' ')) || 
        lowerText.includes(tag.label.toLowerCase())) {
      suggestions.push(tag.value);
    }
  });
  
  return [...new Set(suggestions)]; // Remove duplicates
};






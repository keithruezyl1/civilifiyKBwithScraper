import { ENTRY_TYPES } from '../data/entryTypes';

// Generate unique entry ID based on type and content
export const generateEntryId = (type, title, lawFamily, sectionId = null) => {
  if (!type || !title || !lawFamily) {
    return null;
  }

  const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
  const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  switch (type) {
    case 'constitution_provision':
      return `CONST-${sectionId || 'Art'}-${timestamp}`;
    
    case 'statute_section':
      // Extract RA number from law_family (e.g., "RA 4136" -> "RA4136")
      const raMatch = lawFamily.match(/RA\s*(\d+)/i);
      const raNumber = raMatch ? raMatch[1] : 'UNK';
      return `RA${raNumber}-${sectionId || 'Sec'}-${timestamp}`;
    
    case 'city_ordinance_section':
      // Extract ordinance number from law_family (e.g., "Cebu City Ordinance 2606" -> "2606")
      const ordMatch = lawFamily.match(/(\d+)/);
      const ordNumber = ordMatch ? ordMatch[1] : 'UNK';
      return `CEBU-ORD-${ordNumber}-${timestamp}`;
    
    case 'rule_of_court':
      // Extract rule number from section_id (e.g., "Rule 113 Sec. 5" -> "Rule113-Sec5")
      const ruleMatch = sectionId ? sectionId.match(/Rule\s*(\d+)/i) : null;
      const secMatch = sectionId ? sectionId.match(/Sec\.?\s*(\d+)/i) : null;
      const ruleNum = ruleMatch ? ruleMatch[1] : 'UNK';
      const secNum = secMatch ? secMatch[1] : 'UNK';
      return `ROC-Rule${ruleNum}-Sec${secNum}-${timestamp}`;
    
    case 'agency_circular':
      // Extract circular number from title or law_family
      const circMatch = title.match(/(\d+)/) || lawFamily.match(/(\d+)/);
      const circNumber = circMatch ? circMatch[1] : 'UNK';
      return `CIRC-${circNumber}-${timestamp}`;
    
    case 'doj_issuance':
      // Extract issuance number from title or law_family
      const dojMatch = title.match(/(\d+)/) || lawFamily.match(/(\d+)/);
      const dojNumber = dojMatch ? dojMatch[1] : 'UNK';
      return `DOJ-${dojNumber}-${timestamp}`;
    
    case 'executive_issuance':
      // Extract EO/Proclamation number from title or law_family
      const execMatch = title.match(/(\d+)/) || lawFamily.match(/(\d+)/);
      const execNumber = execMatch ? execMatch[1] : 'UNK';
      return `EO-${execNumber}-${timestamp}`;
    
    case 'pnp_sop':
      // Generate SOP ID based on title
      const sopName = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      return `PNP-SOP-${sopName}-${timestamp}`;
    
    case 'incident_checklist':
      // Generate incident checklist ID based on incident type
      const incidentType = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      return `INC-${incidentType}-${timestamp}`;
    
    case 'rights_advisory':
      // Generate rights advisory ID based on scope or title
      const rightsScope = title.match(/[A-Z]{2,}/) ? title.match(/[A-Z]{2,}/)[0] : 'RIGHTS';
      return `RIGHTS-${rightsScope}-${timestamp}`;
    
    default:
      return `ENTRY-${type.toUpperCase()}-${timestamp}`;
  }
};

// Validate entry ID format
export const validateEntryId = (entryId) => {
  if (!entryId || typeof entryId !== 'string') {
    return false;
  }
  
  // Check if it follows one of our ID patterns
  const patterns = [
    /^CONST-[A-Za-z0-9]+-\d{6}$/,
    /^RA\d+-[A-Za-z0-9]+-\d{6}$/,
    /^CEBU-ORD-\d+-\d{6}$/,
    /^ROC-Rule\d+-Sec\d+-\d{6}$/,
    /^CIRC-\d+-\d{6}$/,
    /^DOJ-\d+-\d{6}$/,
    /^EO-\d+-\d{6}$/,
    /^PNP-SOP-[A-Za-z0-9]+-\d{6}$/,
    /^TRAFFIC-[A-Za-z0-9]+-\d{6}$/,
    /^INC-[A-Za-z0-9]+-\d{6}$/,
    /^RIGHTS-[A-Za-z0-9]+-\d{6}$/,
    /^ENTRY-[A-Za-z0-9]+-\d{6}$/,
    // Additional patterns for new format
    /^[A-Z]+-[A-Z]+-\d{4}-\d{4}$/,
    /^[A-Z]+-[A-Z]+-[A-Z]+-\d{6}$/
  ];
  
  return patterns.some(pattern => pattern.test(entryId));
};

// Extract information from entry ID
export const parseEntryId = (entryId) => {
  if (!validateEntryId(entryId)) {
    return null;
  }
  
  const parts = entryId.split('-');
  if (parts.length < 3) {
    return null;
  }
  
  const prefix = parts[0];
  const timestamp = parts[parts.length - 1];
  
  switch (prefix) {
    case 'CONST':
      return { type: 'constitution_provision', section: parts[1], timestamp };
    case 'RA':
      return { type: 'statute_section', raNumber: parts[0].substring(2), section: parts[1], timestamp };
    case 'CEBU':
      return { type: 'city_ordinance_section', ordinanceNumber: parts[2], timestamp };
    case 'ROC':
      return { type: 'rule_of_court', ruleNumber: parts[1].substring(4), sectionNumber: parts[2].substring(3), timestamp };
    case 'CIRC':
      return { type: 'agency_circular', circularNumber: parts[1], timestamp };
    case 'DOJ':
      return { type: 'doj_issuance', issuanceNumber: parts[1], timestamp };
    case 'EO':
      return { type: 'executive_issuance', executiveNumber: parts[1], timestamp };
    case 'PNP':
      return { type: 'pnp_sop', sopName: parts[2], timestamp };
    case 'INC':
      return { type: 'incident_checklist', incidentType: parts[1], timestamp };
    case 'RIGHTS':
      return { type: 'rights_advisory', rightsScope: parts[1], timestamp };
    default:
      return { type: 'unknown', prefix, timestamp };
  }
};






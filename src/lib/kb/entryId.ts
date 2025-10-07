export function generateEntryId(type: string, lawFamily: string, sectionId?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = now.getTime().toString().slice(-6); // Last 6 digits for uniqueness
  const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  switch (type) {
    case 'statute_section':
      if (lawFamily.includes('RPC') || lawFamily.includes('Revised Penal Code')) {
        return `RPC-${sectionId || 'Art'}-${timestamp}`;
      }
      if (lawFamily.includes('RA')) {
        const raMatch = lawFamily.match(/RA\s*(\d+)/i);
        const raNumber = raMatch ? raMatch[1] : '0000';
        return `RA${raNumber}-${sectionId || 'Sec'}-${timestamp}`;
      }
      return `${lawFamily.replace(/\s+/g, '')}-${sectionId || 'Sec'}-${timestamp}`;
      
    case 'rule_of_court':
      if (sectionId) {
        const ruleMatch = sectionId.match(/Rule\s*(\d+)/i);
        const secMatch = sectionId.match(/Sec\.\s*(\d+)/i);
        if (ruleMatch && secMatch) {
          return `ROC-Rule${ruleMatch[1]}-Sec${secMatch[1]}-${timestamp}`;
        }
      }
      return `ROC-${sectionId || 'Rule'}-${timestamp}`;
      
    case 'city_ordinance_section':
      if (lawFamily.includes('Cebu')) {
        const coMatch = lawFamily.match(/Ord\.\s*(\d+)/i);
        const coNumber = coMatch ? coMatch[1] : '0000';
        return `CEBU-CO${coNumber}-${sectionId || 'Sec'}-${timestamp}`;
      }
      return `${lawFamily.replace(/\s+/g, '')}-${sectionId || 'Sec'}-${timestamp}`;
      
    case 'pnp_sop':
      return `PNP-SOP-${lawFamily.replace(/\s+/g, '')}-${year}-${randomSuffix}`;
      
    case 'incident_checklist':
      // Generate a short identifier based on the first word of law_family
      const shortName = lawFamily.split(' ')[0].toUpperCase();
      return `INC-${shortName}-${randomSuffix}`;
      
    case 'agency_circular':
      return `${lawFamily.replace(/\s+/g, '')}-Circular-${year}-${randomSuffix}`;
      
    case 'doj_issuance':
      return `DOJ-${lawFamily.replace(/\s+/g, '')}-${year}-${randomSuffix}`;
      
    case 'executive_issuance':
      return `EO-${lawFamily.replace(/\s+/g, '')}-${year}-${randomSuffix}`;
      
    case 'rights_advisory':
      return `RIGHTS-${lawFamily.replace(/\s+/g, '')}-${year}-${randomSuffix}`;
      
    case 'constitution_provision':
      return `CONST-${lawFamily.replace(/\s+/g, '')}-${sectionId || 'Art'}-${timestamp}`;
      
    default:
      return `${type.toUpperCase()}-${lawFamily.replace(/\s+/g, '')}-${sectionId || 'Sec'}-${timestamp}`;
  }
}

export function validateEntryId(entryId: string): boolean {
  // Basic validation for entry ID format with timestamps/random suffixes
  const validPatterns = [
    /^RPC-Art\d+-\d{6}$/,
    /^RA\d+-Sec\d+-\d{6}$/,
    /^ROC-Rule\d+-Sec\d+-\d{6}$/,
    /^CEBU-CO\d+-Sec\d+-\d{6}$/,
    /^PNP-SOP-[A-Z]+-\d{4}-\d{4}$/,
    /^INC-[A-Z]+-\d{4}$/,
    /^[A-Z]+-Circular-\d{4}-\d{4}$/,
    /^DOJ-[A-Z]+-\d{4}-\d{4}$/,
    /^EO-[A-Z]+-\d{4}-\d{4}$/,
    /^RIGHTS-[A-Z]+-\d{4}-\d{4}$/,
    /^CONST-[A-Z]+-Art\d+-\d{6}$/,
    // Fallback patterns for other types
    /^[A-Z]+-[A-Z]+-[A-Z]+-\d{6}$/
  ];
  
  return validPatterns.some(pattern => pattern.test(entryId));
}

/**
 * Generate a unique entry ID that doesn't conflict with existing entries
 * This function will keep trying until it finds a unique ID
 */
export async function generateUniqueEntryId(
  type: string, 
  lawFamily: string, 
  sectionId?: string,
  existingEntryIds: string[] = []
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const candidateId = generateEntryId(type, lawFamily, sectionId);
    
    // Check if this ID already exists
    if (!existingEntryIds.includes(candidateId)) {
      return candidateId;
    }
    
    attempts++;
    
    // If we've tried too many times, add an additional random component
    if (attempts >= maxAttempts) {
      const extraRandom = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      return `${candidateId}-${extraRandom}`;
    }
  }
  
  // Fallback - this should never happen
  return generateEntryId(type, lawFamily, sectionId);
}


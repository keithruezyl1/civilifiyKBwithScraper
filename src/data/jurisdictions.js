/**
 * Jurisdiction definitions for the law knowledge base
 */

export const JURISDICTIONS = [
  {
    value: 'PH',
    label: 'Philippines (National)',
    description: 'National laws and regulations'
  },
  {
    value: 'PH-CEBU-CITY',
    label: 'Cebu City',
    description: 'Cebu City ordinances and regulations'
  },
  {
    value: 'PH-CEBU-PROVINCE',
    label: 'Cebu Province',
    description: 'Cebu Provincial ordinances and regulations'
  },
  {
    value: 'PH-MANILA',
    label: 'Manila',
    description: 'Manila City ordinances and regulations'
  },
  {
    value: 'PH-QUEZON-CITY',
    label: 'Quezon City',
    description: 'Quezon City ordinances and regulations'
  },
  {
    value: 'PH-MAKATI',
    label: 'Makati',
    description: 'Makati City ordinances and regulations'
  },
  {
    value: 'PH-PASIG',
    label: 'Pasig',
    description: 'Pasig City ordinances and regulations'
  },
  {
    value: 'PH-MANDALUYONG',
    label: 'Mandaluyong',
    description: 'Mandaluyong City ordinances and regulations'
  },
  {
    value: 'PH-MARIKINA',
    label: 'Marikina',
    description: 'Marikina City ordinances and regulations'
  },
  {
    value: 'PH-PARANAQUE',
    label: 'Parañaque',
    description: 'Parañaque City ordinances and regulations'
  },
  {
    value: 'PH-LAS-PINAS',
    label: 'Las Piñas',
    description: 'Las Piñas City ordinances and regulations'
  },
  {
    value: 'PH-MUNTINLUPA',
    label: 'Muntinlupa',
    description: 'Muntinlupa City ordinances and regulations'
  },
  {
    value: 'PH-TAGUIG',
    label: 'Taguig',
    description: 'Taguig City ordinances and regulations'
  },
  {
    value: 'PH-PATEROS',
    label: 'Pateros',
    description: 'Pateros ordinances and regulations'
  },
  {
    value: 'PH-VALENZUELA',
    label: 'Valenzuela',
    description: 'Valenzuela City ordinances and regulations'
  },
  {
    value: 'PH-CALOOCAN',
    label: 'Caloocan',
    description: 'Caloocan City ordinances and regulations'
  },
  {
    value: 'PH-MALABON',
    label: 'Malabon',
    description: 'Malabon City ordinances and regulations'
  },
  {
    value: 'PH-NAVOTAS',
    label: 'Navotas',
    description: 'Navotas City ordinances and regulations'
  },
  {
    value: 'PH-SAN-JUAN',
    label: 'San Juan',
    description: 'San Juan City ordinances and regulations'
  },
  {
    value: 'PH-PASIG',
    label: 'Pasig',
    description: 'Pasig City ordinances and regulations'
  }
];

/**
 * Get jurisdiction options for form selects
 * @returns {Array} Array of jurisdiction options
 */
export const getJurisdictionOptions = () => {
  return JURISDICTIONS;
};

/**
 * Get jurisdiction by value
 * @param {string} value - Jurisdiction value
 * @returns {Object|null} Jurisdiction object or null
 */
export const getJurisdiction = (value) => {
  return JURISDICTIONS.find(jurisdiction => jurisdiction.value === value) || null;
};

/**
 * Get jurisdiction label by value
 * @param {string} value - Jurisdiction value
 * @returns {string} Jurisdiction label
 */
export const getJurisdictionLabel = (value) => {
  const jurisdiction = getJurisdiction(value);
  return jurisdiction ? jurisdiction.label : value;
};






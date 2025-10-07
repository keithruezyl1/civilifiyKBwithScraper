import { validateEntry, validateEntryType, validateJurisdiction } from '../validation';

describe('Validation Utils', () => {
  describe('validateEntry', () => {
    test('validates a complete valid entry', () => {
      const validEntry = {
        entry_id: 'TEST-001',
        type: 'statute_section',
        title: 'Test Statute',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Test text content',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01',
        visibility: { gli: true, cpa: false },
        offline: { pack_include: false }
      };

      const result = validateEntry(validEntry);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates required fields', () => {
      const incompleteEntry = {
        entry_id: 'TEST-001',
        // Missing required fields
      };

      const result = validateEntry(incompleteEntry);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Type is required');
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Jurisdiction is required');
      expect(result.errors).toContain('Law family is required');
      expect(result.errors).toContain('Canonical citation is required');
      expect(result.errors).toContain('Summary is required');
      expect(result.errors).toContain('Text is required');
      expect(result.errors).toContain('At least one source URL is required');
      expect(result.errors).toContain('At least one tag is required');
    });

    test('validates entry ID format', () => {
      const entryWithInvalidId = {
        entry_id: 'invalid-id-format',
        type: 'statute_section',
        title: 'Test Entry',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Test text',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01'
      };

      const result = validateEntry(entryWithInvalidId);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entry ID must follow the format: TYPE-XXXX-XXXXXX');
    });

    test('validates URL format', () => {
      const entryWithInvalidUrl = {
        entry_id: 'TEST-001',
        type: 'statute_section',
        title: 'Test Entry',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Test text',
        source_urls: ['invalid-url'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01'
      };

      const result = validateEntry(entryWithInvalidUrl);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All source URLs must be valid URLs');
    });

    test('validates date format', () => {
      const entryWithInvalidDate = {
        entry_id: 'TEST-001',
        type: 'statute_section',
        title: 'Test Entry',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Test text',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: 'invalid-date',
        last_reviewed: '2025-01-01'
      };

      const result = validateEntry(entryWithInvalidDate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Effective date must be a valid ISO date');
    });

    test('validates text length', () => {
      const entryWithShortText = {
        entry_id: 'TEST-001',
        type: 'statute_section',
        title: 'Test Entry',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Short',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01'
      };

      const result = validateEntry(entryWithShortText);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text must be at least 50 characters long');
    });
  });

  describe('validateEntryType', () => {
    test('validates valid entry types', () => {
      const validTypes = [
        'constitution_provision',
        'statute_section',
        'city_ordinance_section',
        'rule_of_court',
        'agency_circular',
        'doj_issuance',
        'executive_issuance',
        'rights_advisory'
      ];

      validTypes.forEach(type => {
        expect(validateEntryType(type)).toBe(true);
      });
    });

    test('rejects invalid entry types', () => {
      const invalidTypes = [
        'invalid_type',
        'constitution',
        'statute',
        '',
        null,
        undefined
      ];

      invalidTypes.forEach(type => {
        expect(validateEntryType(type)).toBe(false);
      });
    });
  });

  describe('validateJurisdiction', () => {
    test('validates valid jurisdictions', () => {
      const validJurisdictions = [
        'PH',
        'PH-CEBU-CITY',
        'PH-MANILA',
        'PH-QUEZON-CITY'
      ];

      validJurisdictions.forEach(jurisdiction => {
        expect(validateJurisdiction(jurisdiction)).toBe(true);
      });
    });

    test('rejects invalid jurisdictions', () => {
      const invalidJurisdictions = [
        'US',
        'INVALID',
        '',
        null,
        undefined
      ];

      invalidJurisdictions.forEach(jurisdiction => {
        expect(validateJurisdiction(jurisdiction)).toBe(false);
      });
    });
  });

  describe('Type-specific validation', () => {
    test('validates statute_section specific fields', () => {
      const statuteEntry = {
        entry_id: 'TEST-001',
        type: 'statute_section',
        title: 'Test Statute',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Test text content that is long enough to pass validation',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01',
        elements: ['Element 1', 'Element 2'],
        penalties: ['Penalty 1'],
        related_sections: ['Related Section 1']
      };

      const result = validateEntry(statuteEntry);
      expect(result.isValid).toBe(true);
    });

    test('validates rule_of_court specific fields', () => {
      const ruleEntry = {
        entry_id: 'TEST-001',
        type: 'rule_of_court',
        title: 'Test Rule',
        jurisdiction: 'PH',
        law_family: 'Rules of Court',
        canonical_citation: 'Rule 1, Section 1',
        summary: 'Test summary',
        text: 'Test text content that is long enough to pass validation',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01',
        rule_no: '1',
        section_no: '1',
        triggers: ['Trigger 1'],
        time_limits: ['Time limit 1']
      };

      const result = validateEntry(ruleEntry);
      expect(result.isValid).toBe(true);
    });

    test('validates agency_circular specific fields', () => {
      const circularEntry = {
        entry_id: 'TEST-001',
        type: 'agency_circular',
        title: 'Test Circular',
        jurisdiction: 'PH',
        law_family: 'LTO Circular',
        canonical_citation: 'Circular 001',
        summary: 'Test summary',
        text: 'Test text content that is long enough to pass validation',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01',
        circular_no: '001',
        section_no: '1',
        applicability: ['Applicable to all'],
        legal_bases: ['Legal basis 1']
      };

      const result = validateEntry(circularEntry);
      expect(result.isValid).toBe(true);
    });

    test('validates rights_advisory specific fields', () => {
      const rightsEntry = {
        entry_id: 'TEST-001',
        type: 'rights_advisory',
        title: 'Test Rights Advisory',
        jurisdiction: 'PH',
        law_family: 'Rights Advisory',
        canonical_citation: 'RA 001',
        summary: 'Test summary',
        text: 'Test text content that is long enough to pass validation',
        source_urls: ['https://example.com'],
        tags: ['test'],
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01',
        rights_scope: ['arrest', 'search'],
        applicable_situations: ['Traffic stop'],
        key_points: ['Key point 1'],
        legal_bases: ['Legal basis 1']
      };

      const result = validateEntry(rightsEntry);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('handles null and undefined values', () => {
      const result = validateEntry(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entry data is required');
    });

    test('handles empty object', () => {
      const result = validateEntry({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validates array fields properly', () => {
      const entryWithInvalidArrays = {
        entry_id: 'TEST-001',
        type: 'statute_section',
        title: 'Test Entry',
        jurisdiction: 'PH',
        law_family: 'Test Law',
        canonical_citation: 'Test Citation',
        summary: 'Test summary',
        text: 'Test text content that is long enough to pass validation',
        source_urls: [], // Empty array should fail
        tags: [], // Empty array should fail
        effective_date: '2025-01-01',
        last_reviewed: '2025-01-01'
      };

      const result = validateEntry(entryWithInvalidArrays);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one source URL is required');
      expect(result.errors).toContain('At least one tag is required');
    });
  });
});

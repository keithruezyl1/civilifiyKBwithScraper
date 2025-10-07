import { useState, useCallback } from 'react';
import { validateEntryForSave } from '../utils/validation';

export const useEntryValidation = (existingEntries = []) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((fieldName, value, formData) => {
    const fieldErrors = {};
    
    // Common field validations
    switch (fieldName) {
      case 'type':
        if (!value) {
          fieldErrors[fieldName] = 'Entry type is required';
        }
        break;
        
      case 'team_member_id':
        if (!value) {
          fieldErrors[fieldName] = 'Team member is required';
        }
        break;
        
      case 'title':
        if (!value) {
          fieldErrors[fieldName] = 'Title is required';
        } else if (value.length < 5) {
          fieldErrors[fieldName] = 'Title must be at least 5 characters';
        } else if (value.length > 200) {
          fieldErrors[fieldName] = 'Title must be less than 200 characters';
        }
        break;
        
      case 'jurisdiction':
        if (!value) {
          fieldErrors[fieldName] = 'Jurisdiction is required';
        }
        break;
        
      case 'law_family':
        if (!value) {
          fieldErrors[fieldName] = 'Law family is required';
        }
        break;
        
      case 'canonical_citation':
        if (!value) {
          fieldErrors[fieldName] = 'Canonical citation is required';
        }
        break;
        
      case 'effective_date':
        if (!value) {
          fieldErrors[fieldName] = 'Effective date is required';
        }
        break;
        
      case 'amendment_date':
        if (formData.status === 'amended' && !value) {
          fieldErrors[fieldName] = 'Amendment date is required when status is amended';
        }
        break;
        
      case 'status':
        if (!value) {
          fieldErrors[fieldName] = 'Status is required';
        }
        break;
        
      case 'text_raw':
        if (!value || value.trim() === '') {
          fieldErrors[fieldName] = 'Raw text is required';
        } else if (value.trim().length < 10) {
          fieldErrors[fieldName] = 'Raw text must be at least 10 characters';
        }
        break;
        
      case 'summary':
        if (!value || value.trim() === '') {
          fieldErrors[fieldName] = 'Summary is required';
        } else if (value.trim().length < 10) {
          fieldErrors[fieldName] = 'Summary must be at least 10 characters';
        }
        break;
        
      case 'source_urls':
        if (!value || value.length === 0) {
          fieldErrors[fieldName] = 'At least one source URL is required';
        } else {
          const invalidUrls = value.filter(url => {
            try {
              new URL(url);
              return false;
            } catch {
              return true;
            }
          });
          if (invalidUrls.length > 0) {
            fieldErrors[fieldName] = 'Invalid URL format detected';
          }
        }
        break;
        
      case 'tags':
        if (!value || value.length === 0) {
          fieldErrors[fieldName] = 'At least one tag is required';
        }
        break;
        
      case 'offline_pack_category':
        if (formData.offline?.pack_include && !value) {
          fieldErrors[fieldName] = 'Pack category is required when including in offline pack';
        }
        break;
        
      default:
        // Handle array field validation
        if (fieldName.includes('[') && fieldName.includes(']')) {
          const [arrayName, indexStr] = fieldName.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          const arrayValue = formData[arrayName];
          
          if (arrayValue && arrayValue[index] !== undefined) {
            const itemValue = arrayValue[index];
            if (arrayName === 'source_urls') {
              try {
                new URL(itemValue);
              } catch {
                fieldErrors[fieldName] = 'Invalid URL format';
              }
            }
          }
        }
        break;
    }
    
    return fieldErrors;
  }, []);

  const validateAndTouchField = useCallback((fieldName, value, formData) => {
    const fieldErrors = validateField(fieldName, value, formData);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      
      // Clear the error for this field if it's now valid
      if (!fieldErrors[fieldName]) {
        delete newErrors[fieldName];
      } else {
        // Add the new error
        newErrors[fieldName] = fieldErrors[fieldName];
      }
      
      return newErrors;
    });
    
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, [validateField]);

  const validateForm = useCallback((formData) => {
    const allErrors = {};
    
    // Validate all required fields
    const requiredFields = [
      'type', 'team_member_id', 'title', 'jurisdiction', 'law_family',
      'canonical_citation', 'effective_date', 'status', 'text_raw', 'summary'
    ];
    
    requiredFields.forEach(field => {
      const fieldErrors = validateField(field, formData[field], formData);
      Object.assign(allErrors, fieldErrors);
    });
    
    // Validate conditional fields
    if (formData.status === 'amended') {
      const amendmentErrors = validateField('amendment_date', formData.amendment_date, formData);
      Object.assign(allErrors, amendmentErrors);
    }
    
    // Validate source URLs
    const urlErrors = validateField('source_urls', formData.source_urls, formData);
    Object.assign(allErrors, urlErrors);
    
    // Validate tags
    const tagErrors = validateField('tags', formData.tags, formData);
    Object.assign(allErrors, tagErrors);
    
    // Validate offline pack category if included
    if (formData.offline?.pack_include) {
      const categoryErrors = validateField('offline_pack_category', formData.offline.pack_category, formData);
      Object.assign(allErrors, categoryErrors);
    }
    
    // Validate type-specific fields
    if (formData.type) {
      const typeSpecificErrors = validateTypeSpecificFields(formData);
      Object.assign(allErrors, typeSpecificErrors);
    }
    
    setErrors(allErrors);
    return allErrors;
  }, [validateField]);

  const validateTypeSpecificFields = useCallback((formData) => {
    const errors = {};
    
    switch (formData.type) {
      case 'rule_of_court':
        if (!formData.rule_no) {
          errors.rule_no = 'Rule number is required';
        }
        if (!formData.section_no) {
          errors.section_no = 'Section number is required';
        }
        break;
        
      case 'agency_circular':
        if (!formData.circular_no) {
          errors.circular_no = 'Circular number is required';
        }
        break;
        
      case 'doj_issuance':
        if (!formData.issuance_no) {
          errors.issuance_no = 'Issuance number is required';
        }
        break;
        
      case 'executive_issuance':
        if (!formData.instrument_no) {
          errors.instrument_no = 'Instrument number is required';
        }
        break;
        
      case 'pnp_sop':
        if (!formData.steps_brief || formData.steps_brief.length === 0) {
          errors.steps_brief = 'At least one step is required';
        }
        break;
        
        
      case 'incident_checklist':
        if (!formData.incident) {
          errors.incident = 'Incident type is required';
        }
        if (!formData.phases || formData.phases.length === 0) {
          errors.phases = 'At least one phase is required';
        }
        break;
        
      case 'rights_advisory':
        if (!formData.rights_scope) {
          errors.rights_scope = 'Rights scope is required';
        }
        if (!formData.advice_points || formData.advice_points.length === 0) {
          errors.advice_points = 'At least one advice point is required';
        }
        break;
        
      case 'statute_section':
      case 'city_ordinance_section':
        if (!formData.section_id) {
          errors.section_id = 'Section ID is required';
        }
        break;
    }
    
    return errors;
  }, []);

  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName];
  }, [errors]);

  const hasFieldError = useCallback((fieldName) => {
    return !!errors[fieldName] && touched[fieldName];
  }, [errors, touched]);

  const hasErrors = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  const getErrorCount = useCallback(() => {
    return Object.keys(errors).length;
  }, [errors]);

  const getAllErrorMessages = useCallback(() => {
    return Object.values(errors);
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const markFieldAsTouched = useCallback((fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  return {
    errors,
    touched,
    validateAndTouchField,
    validateForm,
    getFieldError,
    hasFieldError,
    hasErrors,
    getErrorCount,
    getAllErrorMessages,
    clearErrors,
    markFieldAsTouched
  };
};

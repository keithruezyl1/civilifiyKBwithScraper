import React from 'react';
import { Control } from 'react-hook-form';
import { Entry } from '../../../lib/civilify-kb-schemas';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/Form';
import { Input } from '../../ui/Input';
import { StringArray } from '../fields/StringArray';

interface RuleOfCourtFormProps {
  control: Control<Entry>;
}

export function RuleOfCourtForm({ control }: RuleOfCourtFormProps) {
  const sanitizeNumberWithPrefix = (raw: string, prefix: string) => {
    const digits = String(raw || '').replace(/\D+/g, '');
    return digits ? `${prefix} ${digits}` : `${prefix} `;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      {/* Removed header and helper per requirements for rule_of_court */}
      <FormField
        control={control}
        name="rule_no"
        render={({ field }) => (
          <FormItem className="kb-field-spaced">
            <FormLabel className="kb-form-label kb-label-spaced-sm">Rule Number</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g., Rule 113"
                className="kb-form-input"
                onFocus={(e) => {
                  const v = String(field.value || '');
                  if (!v || !/^\s*rule\b/i.test(v)) {
                    const next = 'Rule ';
                    field.onChange(next);
                    // Move cursor to end
                    requestAnimationFrame(() => {
                      try { e.currentTarget.setSelectionRange(next.length, next.length); } catch {}
                    });
                  }
                }}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  // Always enforce single prefix + digits
                  const next = sanitizeNumberWithPrefix(raw.replace(/^\s*rule\b\s*/i, ''), 'Rule');
                  field.onChange(next);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = (e.clipboardData || (window as any).clipboardData).getData('text');
                  const next = sanitizeNumberWithPrefix(pasted.replace(/^\s*rule\b\s*/i, ''), 'Rule');
                  field.onChange(next);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="section_no"
        render={({ field }) => (
          <FormItem className="kb-field-spaced">
            <FormLabel className="kb-form-label kb-label-spaced-sm">Section Number</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g., Section 5"
                className="kb-form-input"
                onFocus={(e) => {
                  const v = String(field.value || '');
                  if (!v || !/^\s*section\b/i.test(v)) {
                    const next = 'Section ';
                    field.onChange(next);
                    requestAnimationFrame(() => {
                      try { e.currentTarget.setSelectionRange(next.length, next.length); } catch {}
                    });
                  }
                }}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  const cleaned = raw
                    .replace(/^\s*sec(t(ion)?)?\.?\b\s*/i, '') // tolerate Sec., Sect., Section prefixes
                    .replace(/^\s*section\b\s*/i, '');
                  const next = sanitizeNumberWithPrefix(cleaned, 'Section');
                  field.onChange(next);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = (e.clipboardData || (window as any).clipboardData).getData('text');
                  const cleaned = pasted
                    .replace(/^\s*sec(t(ion)?)?\.?\b\s*/i, '')
                    .replace(/^\s*section\b\s*/i, '');
                  const next = sanitizeNumberWithPrefix(cleaned, 'Section');
                  field.onChange(next);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="triggers"
          label="Triggers"
          help="Events or conditions that activate this rule"
          placeholder="e.g., warrantless_arrest, arraignment"
        />
      </div>
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="time_limits"
          label="Time Limits"
          help="Deadlines such as 'within 12 hours', '10 days'"
          placeholder="e.g., within_12_hours, 10_days"
        />
      </div>
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="required_forms"
          label="Required Forms"
          help="Official forms demanded by the rule"
          placeholder="e.g., warrant_application, subpoena_form"
        />
      </div>
    </div>
  );
}



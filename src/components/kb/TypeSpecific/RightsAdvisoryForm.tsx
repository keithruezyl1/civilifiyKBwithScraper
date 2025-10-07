import React from 'react';
import { Control } from 'react-hook-form';
import { Entry } from '../../../lib/civilify-kb-schemas';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/Form';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { StringArray } from '../fields/StringArray';

interface RightsAdvisoryFormProps {
  control: Control<Entry>;
}

export function RightsAdvisoryForm({ control }: RightsAdvisoryFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <div className="md:col-span-2">
        <FormField
          control={control}
          name="rights_scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-3 kb-form-label">Rights Scope</FormLabel>
              <FormControl>
                <>
                  <Select
                    value={field.value && ![
                      'arrest','search','detention','counsel','GBV','minors','privacy','traffic stop','protective orders','fair trial','freedom of expression','legal aid access','complaint filing','labor rights','consumer rights','housing/land rights','health/education'
                    ].includes(field.value) ? 'Other' : (field.value || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        // Keep field as-is; show input below for custom text
                        field.onChange('');
                      } else {
                        field.onChange(val);
                      }
                    }}
                    options={[
                      { value: 'arrest', label: 'Arrest' },
                      { value: 'search', label: 'Search' },
                      { value: 'detention', label: 'Detention' },
                      { value: 'counsel', label: 'Counsel' },
                      { value: 'GBV', label: 'GBV' },
                      { value: 'minors', label: 'Minors' },
                      { value: 'privacy', label: 'Privacy' },
                      { value: 'traffic stop', label: 'Traffic Stop' },
                      { value: 'protective orders', label: 'Protective Orders' },
                      { value: 'fair trial', label: 'Fair Trial' },
                      { value: 'freedom of expression', label: 'Freedom of Expression' },
                      { value: 'legal aid access', label: 'Legal Aid Access' },
                      { value: 'complaint filing', label: 'Complaint Filing' },
                      { value: 'labor rights', label: 'Labor Rights' },
                      { value: 'consumer rights', label: 'Consumer Rights' },
                      { value: 'housing/land rights', label: 'Housing/Land Rights' },
                      { value: 'health/education', label: 'Health/Education' },
                      { value: 'Other', label: 'Other (type your own)' }
                    ]}
                    className="h-11 px-4 text-base rounded-xl leading-tight"
                  />
                  {/* If Other/custom, show text input */}
                  {(
                    !field.value ||
                    ![
                      'arrest','search','detention','counsel','GBV','minors','privacy','traffic stop','protective orders','fair trial','freedom of expression','legal aid access','complaint filing','labor rights','consumer rights','housing/land rights','health/education'
                    ].includes(field.value)
                  ) && (
                    <div className="mt-3">
                      <Input
                        placeholder="Type custom rights scope"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-11 px-4 text-base rounded-xl"
                      />
                    </div>
                  )}
                </>
              </FormControl>
              {/* Suppress min-length warning for custom Other input */}
            </FormItem>
          )}
        />
      </div>
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="advice_points"
          label="Advice Points"
          help="short actionable lines"
          placeholder="Enter advice point"
        />
      </div>
    </div>
  );
}



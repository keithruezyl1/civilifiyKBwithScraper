import React from 'react';
import { Control } from 'react-hook-form';
import { Entry } from '../../../lib/civilify-kb-schemas';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '../../ui/Form';
import { Input } from '../../ui/Input';
import { StringArray } from '../fields/StringArray';

interface DojIssuanceFormProps {
  control: Control<Entry>;
}

export function DojIssuanceForm({ control }: DojIssuanceFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <div className="md:col-span-2">
        <FormField
          control={control}
          name="issuance_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2">Issuance Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., DOJ-2023-001"
                  className="h-11 px-4 text-base rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="md:col-span-2 mb-2">
        <StringArray
          control={control}
          name="applicability"
          label="Applicability"
          placeholder="Enter applicability"
        />
      </div>
      
      <div className="md:col-span-2 mb-2">
        <StringArray
          control={control}
          name="supersedes"
          label="Supersedes"
          placeholder="Enter superseded issuance"
        />
      </div>
    </div>
  );
}



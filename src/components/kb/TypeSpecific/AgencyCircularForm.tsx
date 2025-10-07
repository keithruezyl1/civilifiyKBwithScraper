import React from 'react';
import { Control } from 'react-hook-form';
import { Entry } from '../../../lib/civilify-kb-schemas';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/Form';
import { Input } from '../../ui/Input';
import { StringArray } from '../fields/StringArray';

interface AgencyCircularFormProps {
  control: Control<Entry>;
}

export function AgencyCircularForm({ control }: AgencyCircularFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <FormField
        control={control}
        name="circular_no"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="mb-2">Circular Number</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g., MC 2023-001"
                className="h-11 px-4 text-base rounded-xl"
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
          <FormItem>
            <FormLabel className="mb-2">Section Number</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="section number if applicable"
                className="h-11 px-4 text-base rounded-xl"
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="applicability"
          label="Applicability"
          help="domains/actors touched (licensing, towing, breath test)"
          placeholder="Enter applicability"
        />
      </div>
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="supersedes"
          label="Supersedes"
          help="earlier circulars affected"
          placeholder="Enter superseded circular"
        />
      </div>
    </div>
  );
}



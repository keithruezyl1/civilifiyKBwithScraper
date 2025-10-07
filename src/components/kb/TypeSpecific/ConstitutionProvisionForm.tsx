import React from 'react';
import { Control } from 'react-hook-form';
import { Entry } from '../../../lib/civilify-kb-schemas';
//
import { StringArray } from '../fields/StringArray';

interface ConstitutionProvisionFormProps {
  control: Control<Entry>;
}

export function ConstitutionProvisionForm({ control }: ConstitutionProvisionFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="topics"
          label="Topics"
          help="e.g., ['arrest','search','detention','privacy']"
          placeholder="Enter topic"
        />
      </div>
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="jurisprudence"
          label="Jurisprudence"
          help="key case short cites (GR no., year, doctrine)"
          placeholder="Enter jurisprudence"
        />
      </div>
    </div>
  );
}



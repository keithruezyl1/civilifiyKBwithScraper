import React from 'react';
import { Control } from 'react-hook-form';
import { Entry } from '../../../lib/civilify-kb-schemas';
import { StringArray } from '../fields/StringArray';

interface CityOrdinanceFormProps {
  control: Control<Entry>;
}

export function CityOrdinanceForm({ control }: CityOrdinanceFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="elements"
          label="Elements"
          help="enumerated elements/requirements"
          placeholder="Enter element"
        />
      </div>
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="penalties"
          label="Penalties"
          help="human-readable penalties (ranges/qualifiers)"
          placeholder="Enter penalty"
        />
      </div>
      
      <div className="md:col-span-2">
        <StringArray
          control={control}
          name="defenses"
          label="Defenses"
          help="typical statutory defenses/exceptions"
          placeholder="Enter defense"
        />
      </div>
    </div>
  );
}



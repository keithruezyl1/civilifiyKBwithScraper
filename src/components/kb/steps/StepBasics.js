import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select } from '../../ui/Select';
import { generateEntryId } from '../../../lib/kb/entryId';
import { getKbConfig } from '../../../lib/kb/parseKbRules';

export function StepBasics() {
  const { register, setValue, formState: { errors } } = useFormContext();
  const kbConfig = getKbConfig();
  
  // Watch for changes to generate entry_id
  const type = useWatch({ name: 'type' });
  const lawFamily = useWatch({ name: 'law_family' });
  const sectionId = useWatch({ name: 'section_id' });
  
  // Generate entry_id when type, law_family, or section_id changes
  React.useEffect(() => {
    if (type && lawFamily) {
      const generatedId = generateEntryId(type, lawFamily, sectionId);
      setValue('entry_id', generatedId);
    }
  }, [type, lawFamily, sectionId, setValue]);

  const typeOptions = Object.entries(kbConfig.types).map(([key, type]) => ({
    value: key,
    label: type.label
  }));

  const jurisdictionOptions = [
    { value: 'PH', label: 'Philippines (PH)' },
    { value: 'PH-CEBU-CITY', label: 'Cebu City (PH-CEBU-CITY)' },
    { value: 'PH-MANILA', label: 'Manila (PH-MANILA)' },
    { value: 'PH-QUEZON-CITY', label: 'Quezon City (PH-QUEZON-CITY)' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'amended', label: 'Amended' },
    { value: 'repealed', label: 'Repealed' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground">Start with the fundamental details about this legal entry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Entry Type *</Label>
            <Select
              {...register('type')}
              options={typeOptions}
              className="mt-1"
            />
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              {...register('title')}
              placeholder="Human-readable label for this entry"
              className="mt-1"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="jurisdiction">Jurisdiction *</Label>
            <Select
              {...register('jurisdiction')}
              options={jurisdictionOptions}
              className="mt-1"
            />
            {errors.jurisdiction && (
              <p className="text-sm text-red-600 mt-1">{errors.jurisdiction.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="law_family">Law Family *</Label>
            <Input
              {...register('law_family')}
              placeholder="e.g., RA 4136, Rules of Court, Cebu Ord. 2606"
              className="mt-1"
            />
            {errors.law_family && (
              <p className="text-sm text-red-600 mt-1">{errors.law_family.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="entry_id">Entry ID</Label>
            <Input
              {...register('entry_id')}
              placeholder="Auto-generated stable ID"
              className="mt-1 bg-gray-50"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-generated based on type, law family, and section. You can customize this later.
            </p>
            {errors.entry_id && (
              <p className="text-sm text-red-600 mt-1">{errors.entry_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="section_id">Section ID</Label>
            <Input
              {...register('section_id')}
              placeholder="e.g., Sec. 7, Rule 113 Sec. 5, Art. 308"
              className="mt-1"
            />
            {errors.section_id && (
              <p className="text-sm text-red-600 mt-1">{errors.section_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="canonical_citation">Canonical Citation *</Label>
            <Input
              {...register('canonical_citation')}
              placeholder="e.g., RPC Art. 308, ROC Rule 113, Sec. 5"
              className="mt-1"
            />
            {errors.canonical_citation && (
              <p className="text-sm text-red-600 mt-1">{errors.canonical_citation.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              {...register('status')}
              options={statusOptions}
              className="mt-1"
            />
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


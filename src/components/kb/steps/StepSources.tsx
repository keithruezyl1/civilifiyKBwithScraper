import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { UrlList } from '../fields/UrlList';

export function StepSources() {
  const { register, control, formState: { errors } } = useFormContext();
  const status = useWatch({ name: 'status' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sources & Dates</h2>
        <p className="text-muted-foreground">Provide official sources and important dates for this entry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="effective_date">Effective Date <span className="text-red-600">*</span></Label>
            <Input
              {...register('effective_date')}
              type="date"
              placeholder="dd/mm/yyyy"
              className="mt-1"
            />
            {errors.effective_date && (
              <p className="text-sm text-red-600 mt-1">{String(errors.effective_date.message)}</p>
            )}
          </div>

          {status === 'amended' && (
            <div>
              <Label htmlFor="amendment_date">Amendment Date <span className="text-red-600">*</span></Label>
              <Input
                {...register('amendment_date')}
                type="date"
                placeholder="dd/mm/yyyy"
                className="mt-1"
              />
              {errors.amendment_date && (
                <p className="text-sm text-red-600 mt-1">{String(errors.amendment_date.message)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Required when status is "amended"
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="last_reviewed">Last Reviewed <span className="text-red-600">*</span></Label>
            <Input
              {...register('last_reviewed')}
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
            {errors.last_reviewed && (
              <p className="text-sm text-red-600 mt-1">{String(errors.last_reviewed.message)}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <UrlList
            control={control}
            name="source_urls"
            label="Source URLs *"
            help="Official/public sources where this legal text can be found"
          />
          {errors.source_urls && (
            <p className="text-sm text-red-600 mt-1">{String(errors.source_urls.message)}</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Source Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use official government websites when possible</li>
          <li>• Include multiple sources for verification</li>
          <li>• Ensure URLs are publicly accessible</li>
          <li>• Prefer primary sources over secondary interpretations</li>
        </ul>
      </div>
    </div>
  );
}


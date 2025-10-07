import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '../../ui/Textarea';
import { Label } from '../../ui/Label';
import { StringArray } from '../fields/StringArray';

export function StepContent() {
  const { register, control, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content</h2>
        <p className="text-muted-foreground">Provide the legal text and summary for this entry.</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="summary">Summary *</Label>
          <p className="text-xs text-muted-foreground mt-1">Keep it concise and neutral.</p>
          <Textarea
            {...register('summary')}
            placeholder="1–3 sentence neutral synopsis of this legal provision"
            className="mt-1"
            rows={3}
          />
          {errors.summary && (
            <p className="text-sm text-red-600 mt-1">{String(errors.summary.message)}</p>
          )}
        </div>

        <div>
          <Label htmlFor="text">Legal Text *</Label>
          <p className="text-xs text-muted-foreground mt-1">Substance-only, normalized.</p>
          <Textarea
            {...register('text')}
            placeholder="Clean, normalized legal text (substance-only)"
            className="mt-1"
            rows={10}
          />
          {errors.text && (
            <p className="text-sm text-red-600 mt-1">{String(errors.text.message)}</p>
          )}
        </div>

        <div>
          <StringArray
            control={control}
            name="tags"
            label="Tags *"
            help="Retrieval hints (e.g., ['arrest','search','traffic'])"
            placeholder="Enter tag"
            enableTagParsing={true}
          />
          {errors.tags && (
            <p className="text-sm text-red-600 mt-1">{String(errors.tags.message)}</p>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">Content Guidelines</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• <strong>Summary:</strong> Be concise, neutral, and informative</li>
          <li>• <strong>Legal Text:</strong> Include complete, normalized text without formatting artifacts</li>
          <li>• <strong>Tags:</strong> Use relevant keywords that will help users find this entry</li>
        </ul>
      </div>
    </div>
  );
}


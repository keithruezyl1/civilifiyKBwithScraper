import React from 'react';
import { useFieldArray, Control, useFormContext } from 'react-hook-form';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Trash2, Plus } from 'lucide-react';

interface UrlListProps {
  control: Control<any>;
  name: string;
  label: string;
  help?: string;
}

export function UrlList({ control, name, label, help }: UrlListProps) {
  const { register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {help && (
        <p className="text-sm text-muted-foreground">{help}</p>
      )}
      
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mb-3">
            <Input
              {...register(`${name}.${index}` as const)}
              placeholder="e.g., https://official-government-website.gov.ph"
              type="url"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => remove(index)}
              className="shrink-0 px-6 py-3 min-w-[80px] bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        ))}
        
        <Button
          type="button"
          variant="success"
          size="sm"
          onClick={() => append('')}
          className="w-full px-4 py-3 rounded-lg mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          + Add Item
        </Button>
      </div>
    </div>
  );
}


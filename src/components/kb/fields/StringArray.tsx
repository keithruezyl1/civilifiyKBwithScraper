import React, { useState } from 'react';
import { useFieldArray, Control, useFormContext } from 'react-hook-form';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Trash2, Plus } from 'lucide-react';

interface StringArrayProps {
  control: Control<any>;
  name: string;
  label: string;
  help?: string;
  placeholder?: string;
  enableTagParsing?: boolean; // New prop to enable special tag parsing
}

export function StringArray({ control, name, label, help, placeholder = "Enter item", enableTagParsing = false }: StringArrayProps) {
  const { register, setValue, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name
  });
  
  const [bulkInput, setBulkInput] = useState('');
  const currentValues = watch(name) || [];

  // Function to parse tags from comma-separated and underscore-separated input
  const parseTags = (input: string): string[] => {
    if (!input.trim()) return [];
    
    // Split by comma first, then by underscore, then clean up
    const tags = input
      .split(',')
      .flatMap(part => part.split('_'))
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    return tags;
  };

  // Function to add tags from bulk input
  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    
    const newTags = parseTags(bulkInput);
    const existingTags = new Set(currentValues.map((tag: string) => tag.toLowerCase()));
    
    // Only add tags that don't already exist (case-insensitive)
    const uniqueNewTags = newTags.filter(tag => !existingTags.has(tag.toLowerCase()));
    
    uniqueNewTags.forEach(tag => append(tag));
    setBulkInput('');
  };

  // Function to handle individual tag input with parsing
  const handleTagInput = (value: string, index: number) => {
    if (enableTagParsing && (value.includes(',') || value.includes('_'))) {
      // Parse the input and replace the current field with the first tag
      const parsedTags = parseTags(value);
      if (parsedTags.length > 0) {
        // Use setTimeout to make setValue non-blocking and prevent flickering
        setTimeout(() => setValue(`${name}.${index}`, parsedTags[0]), 0);
        
        // Add remaining tags if any
        const existingTags = new Set(currentValues.map((tag: string) => tag.toLowerCase()));
        const uniqueNewTags = parsedTags.slice(1).filter(tag => !existingTags.has(tag.toLowerCase()));
        uniqueNewTags.forEach(tag => append(tag));
      }
    } else {
      // Use setTimeout to make setValue non-blocking and prevent flickering
      setTimeout(() => setValue(`${name}.${index}`, value), 0);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-2 block">{label}</label>
        {help && (
          <p className="text-xs text-muted-foreground mt-1 mb-2">{help}</p>
        )}
      </div>
      
      {/* Bulk input for tags */}
      {enableTagParsing && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Paste multiple tags: national_territory, sovereignty, archipelagic_doctrine"
              className="flex-1 h-11 pl-6 pr-4 text-base rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBulkAdd();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleBulkAdd}
              className="shrink-0 h-11 px-4 rounded-xl"
            >
              Add All
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Separate with commas, underscores will be split automatically. Duplicates are ignored.
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mb-2">
            <Input
              {...register(`${name}.${index}` as const)}
              onChange={(e) => handleTagInput(e.target.value, index)}
              placeholder={placeholder}
              className="flex-1 h-11 pl-6 pr-4 text-base rounded-xl"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => remove(index)}
              className="shrink-0 h-11 w-11 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <Button
          type="button"
          variant="success"
          onClick={() => append('')}
          className="w-full h-11 px-5 rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>
    </div>
  );
}


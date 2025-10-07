import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select } from '../../ui/Select';
import { Trash2, Plus } from 'lucide-react';

interface FineGridProps {
  control: Control<any>;
  name: string;
  label: string;
  help?: string;
}

export function FineGrid({ control, name, label, help }: FineGridProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name
  });

  const currencyOptions = [
    { value: 'PHP', label: 'Philippine Peso (₱)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' }
  ];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {help && (
        <p className="text-sm text-muted-foreground">{help}</p>
      )}
      
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Fine #{index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor={`${name}.${index}.offense_no`}>Offense Number</Label>
                <Input
                  {...control.register(`${name}.${index}.offense_no` as const)}
                  placeholder="e.g., 001"
                />
              </div>
              
              <div>
                <Label htmlFor={`${name}.${index}.amount`}>Amount</Label>
                <Input
                  {...control.register(`${name}.${index}.amount` as const, {
                    valueAsNumber: true
                  })}
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <Label htmlFor={`${name}.${index}.currency`}>Currency</Label>
                <Select
                  {...control.register(`${name}.${index}.currency` as const)}
                  options={currencyOptions}
                />
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ offense_no: '', amount: 0, currency: 'PHP' })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Fine Schedule Entry
        </Button>
      </div>
    </div>
  );
}


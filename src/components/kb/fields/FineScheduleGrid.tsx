import React from 'react';
import { Control, useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Trash2, Plus } from 'lucide-react';

interface FineScheduleGridProps {
  name: string; // e.g., 'fine_schedule'
  control: Control<any>;
  label?: string;
  help?: string;
}

export function FineScheduleGrid({ name, control, label, help }: FineScheduleGridProps) {
  const { register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ name, control });

  return (
    <div className="space-y-3">
      {(label || help) && (
        <div>
          {label && <label className="text-sm font-medium">{label}</label>}
          {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
        </div>
      )}
      
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Offense No.</th>
              <th className="px-3 py-2 text-left font-medium">Amount</th>
              <th className="px-3 py-2 text-left font-medium">Currency</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 && (
              <tr>
                <td className="px-3 py-2 text-muted-foreground" colSpan={4}>No rows. Add a fine level below.</td>
              </tr>
            )}
            {fields.map((row, i) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2 w-32">
                  <Input
                    type="number"
                    min={1}
                    className="h-11 px-4 text-base rounded-xl"
                    placeholder="1"
                    {...register(`${name}.${i}.offense_no` as const, { valueAsNumber: true })}
                  />
                </td>
                <td className="px-3 py-2 w-40">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    className="h-11 px-4 text-base rounded-xl"
                    placeholder="1000"
                    {...register(`${name}.${i}.amount` as const, { valueAsNumber: true })}
                  />
                </td>
                <td className="px-3 py-2 w-36">
                  <Select
                    className="h-11 px-4 text-base rounded-xl"
                    options={[
                      { value: 'PHP', label: 'PHP' },
                      { value: 'USD', label: 'USD' }
                    ]}
                    {...register(`${name}.${i}.currency` as const)}
                  />
                </td>
                <td className="px-3 py-2 w-24">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(i)}
                    className="h-11 w-11 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ offense_no: fields.length + 1, amount: 0, currency: 'PHP' })}
        className="w-full h-11 px-5 rounded-xl"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add row
      </Button>
    </div>
  );
}




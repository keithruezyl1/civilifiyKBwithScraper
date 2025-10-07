import React from 'react';
import { Button } from '../ui/Button';

type Props = {
  label: string;
  done: number;
  required: number;
  onInc: () => void;
  onDec: () => void;
  hint?: string;
};

export function TypeChip({ label, done, required, onInc, onDec, hint }: Props) {
  const disabledPlus = done >= required;
  const disabledMinus = done <= 0;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border-2 border-gray-300 px-4 py-2 mr-2 mb-2 bg-white shadow-sm hover:shadow-md transition-all">
      <span className="text-sm font-semibold text-gray-700" title={hint || ''}>{label}</span>
      <span className="text-sm font-bold text-orange-600 tabular-nums">{done}/{required}</span>
      <div className="flex items-center gap-1">
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          disabled={disabledMinus} 
          onClick={onDec} 
          className="h-6 w-6 p-0 text-xs font-bold hover:bg-red-50 hover:border-red-300 hover:text-red-600"
        >
          -
        </Button>
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          disabled={disabledPlus} 
          onClick={onInc} 
          className="h-6 w-6 p-0 text-xs font-bold hover:bg-green-50 hover:border-green-300 hover:text-green-600"
        >
          +
        </Button>
      </div>
    </div>
  );
}



import React from 'react';
import { Progress } from '../ui/Progress';
import { TypeChip } from './TypeChip';
import { increment, decrement, getCount, getCumulativeCount } from '../../lib/plan/progressStore';

type Req = Record<string, number> & { total: number; ordinanceNote?: string };

type Props = {
  person: string; // P1..P5
  dateISO: string;
  requirements: Req;
};

export function PersonCard({ person, dateISO, requirements }: Props) {
  const entries = Object.entries(requirements).filter(([k]) => !['total', 'ordinanceNote'].includes(k));
  const [doneByType, setDoneByType] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const [type, req] of entries) {
      init[type] = getCumulativeCount(dateISO, person, type);
    }
    return init;
  });

  const totalDone = entries.reduce((sum, [t]) => sum + (doneByType[t] || 0), 0);
  const totalReq = requirements.total || entries.reduce((s, [, v]) => s + (v as number), 0);

  return (
    <div className="rounded-2xl border-2 border-gray-200 p-6 md:p-8 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-xl font-bold text-gray-800">{person}</div>
        <div className="text-lg font-semibold text-orange-600">{totalDone} / {totalReq}</div>
      </div>
      <Progress value={(totalDone / Math.max(1, totalReq)) * 100} className="mb-6" />
      
      {/* Weekly Task Summary */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-1">This Week's Focus:</div>
        <div className="text-xs text-blue-700">
          {person === 'P1' && 'RPC + Cebu Ordinances'}
          {person === 'P2' && 'Rules of Court + DOJ (procedure-heavy)'}
          {person === 'P3' && 'PNP SOPs + Incident Checklists'}
          {person === 'P4' && 'Traffic/LTO lane'}
          {person === 'P5' && 'Rights + Constitution + Policy'}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {entries.filter(([, v]) => Number(v) > 0).map(([type, req]) => (
          <TypeChip
            key={type}
            label={type}
            done={doneByType[type] || 0}
            required={Number(req)}
            onInc={() => {
              increment(dateISO, person, type, Number(req));
              setDoneByType((s) => ({ ...s, [type]: getCumulativeCount(dateISO, person, type) }));
            }}
            onDec={() => {
              decrement(dateISO, person, type);
              setDoneByType((s) => ({ ...s, [type]: getCumulativeCount(dateISO, person, type) }));
            }}
          />
        ))}
      </div>
      {requirements.ordinanceNote && (
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>Note:</strong> {requirements.ordinanceNote}
        </div>
      )}
    </div>
  );
}


